import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
import { db } from '../services/firebase';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import ReportDetailSheet from '../components/ReportDetailSheet';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

interface Report {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  categoryIcon: string;
  categoryColor: string;
  status: ReportStatus;
  upvoteCount: number;
  location: { address: string; latitude: number; longitude: number };
  createdAt: any;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',  color: '#F59E0B', bg: '#3D2E0A' },
  ASSIGNED: { label: 'Assigned', color: '#60A5FA', bg: '#0D1A3D' },
  FIXING:   { label: 'Fixing',   color: '#4CC2D1', bg: '#0D2A35' },
  RESOLVED: { label: 'Resolved', color: '#30A89C', bg: '#0D3D35' },
  REJECTED: { label: 'Rejected', color: '#E05C5C', bg: '#3D1515' },
};

const CATEGORIES = [
  { id: 'all',               label: 'All',          icon: 'grid-outline',        color: '#4CC2D1' },
  { id: 'road_traffic',      label: 'Roads',         icon: 'car-outline',         color: '#4CC2D1' },
  { id: 'water_drainage',    label: 'Water',         icon: 'water-outline',       color: '#60A5FA' },
  { id: 'waste_environment', label: 'Waste',         icon: 'trash-outline',       color: '#34D399' },
  { id: 'social_safety',     label: 'Safety',        icon: 'shield-outline',      color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Structural',    icon: 'git-network-outline', color: '#F59E0B' },
  { id: 'other',             label: 'Other',         icon: 'help-circle-outline', color: '#94A3B8' },
] as const;

const STATUS_FILTERS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeAgo(ts: any): string {
  if (!ts) return '';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

// ─────────────────────────────────────────────
// Report Card
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ backgroundColor: '#111E27', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#1E3347' }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: (report.categoryColor ?? '#4CC2D1') + '18' }}>
            <Ionicons name={report.categoryIcon as any} size={28} color={report.categoryColor ?? '#4CC2D1'} />
          </View>
          <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>
                {report.title}
              </Text>
              <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={{ color: '#5A7D8A', fontSize: 11, marginTop: 2 }} numberOfLines={1}>{report.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                <Ionicons name="location-outline" size={11} color="#3A6070" />
                <Text style={{ color: '#3A5060', fontSize: 11, flex: 1, maxWidth: 140 }} numberOfLines={1}>
                  {report.location?.address ?? 'Unknown'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="arrow-up-circle-outline" size={12} color="#4CC2D1" />
                <Text style={{ color: '#4CC2D1', fontSize: 11, fontWeight: '600' }}>{report.upvoteCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function UpvotedReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [reports, setReports]               = useState<Report[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus]     = useState<StatusFilter>('All');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // ── Subscribe to all reports the user has upvoted ──
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collectionGroup(db, 'upvotes'),
      where('uid', '==', user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      // Extract unique report IDs from parent paths
      const reportIds = [...new Set(
        snap.docs
          .map((d) => d.ref.parent?.parent?.id)
          .filter(Boolean) as string[]
      )];

      if (reportIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // Fetch each report individually (handles any list size)
      try {
        const fetched = await Promise.all(
          reportIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'reports', id));
            if (!snap.exists()) return null;
            const data = snap.data();
            return {
              id: snap.id,
              title: data.title ?? data.category ?? 'Report',
              category: data.category ?? '',
              categoryId: data.categoryId ?? 'other',
              categoryIcon: data.categoryIcon ?? 'help-circle-outline',
              categoryColor: data.categoryColor ?? '#4CC2D1',
              status: (data.status ?? 'PENDING') as ReportStatus,
              upvoteCount: data.upvoteCount ?? 0,
              location: data.location ?? { address: '', latitude: 0, longitude: 0 },
              createdAt: data.createdAt,
            } as Report;
          })
        );

        setReports(fetched.filter(Boolean) as Report[]);
      } catch (err) {
        console.error('Error fetching upvoted reports:', err);
      }
      setLoading(false);
    }, (err) => {
      console.error('Upvoted reports subscription error:', err);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  // ── Apply filters ──
  const filtered = reports.filter((r) => {
    if (activeCategory !== 'all' && r.categoryId !== activeCategory) return false;
    if (activeStatus === 'Pending' && r.status !== 'PENDING') return false;
    if (activeStatus === 'Fixing' && r.status !== 'FIXING' && r.status !== 'ASSIGNED') return false;
    if (activeStatus === 'Resolved' && r.status !== 'RESOLVED') return false;
    if (activeStatus === 'Rejected' && r.status !== 'REJECTED') return false;
    return true;
  });

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: pressed ? '#1E3A44' : '#1E3347',
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Ionicons name="arrow-back" size={20} color="#4CC2D1" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>My Upvoted Reports</Text>
            <Text style={{ color: '#5A7D8A', fontSize: 12, marginTop: 2 }}>Issues you've supported in your community</Text>
          </View>
          <View style={{ backgroundColor: '#1E3347', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: '#4CC2D1', fontSize: 12, fontWeight: '700' }}>{filtered.length}</Text>
          </View>
        </View>

        {/* ── Category Filter ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#5A7D8A', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 }}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1, borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Ionicons name={cat.icon as any} size={13} color={isActive ? '#071318' : cat.color} />
                  <Text style={{ color: isActive ? '#071318' : '#5A7D8A', fontSize: 12, fontWeight: '600' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Status Filter ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#5A7D8A', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 }}>
            Status
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {STATUS_FILTERS.map((sf) => {
              const isActive = activeStatus === sf;
              return (
                <Pressable
                  key={sf}
                  onPress={() => setActiveStatus(sf)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1, borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Text style={{ color: isActive ? '#071318' : '#5A7D8A', fontSize: 12, fontWeight: '600' }}>{sf}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Report List ── */}
        <View style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator color="#4CC2D1" size="large" />
              <Text style={{ color: '#5A7D8A', marginTop: 12, fontSize: 13 }}>Loading your upvoted reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{
              alignItems: 'center', paddingVertical: 50,
              backgroundColor: '#111E27', borderRadius: 24, padding: 30,
              borderWidth: 1, borderColor: '#1E3347',
            }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1E3A44', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name="arrow-up-circle-outline" size={32} color="#4CC2D1" />
              </View>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                {reports.length === 0 ? 'No upvoted reports yet' : 'No matches found'}
              </Text>
              <Text style={{ color: '#5A7D8A', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                {reports.length === 0
                  ? 'Tap the upvote button on any nearby issue to support it.'
                  : 'Try changing your category or status filter.'}
              </Text>
            </View>
          ) : (
            filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => setSelectedReportId(report.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ReportDetailSheet
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </LinearGradient>
  );
}
