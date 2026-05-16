import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';
import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { Image } from 'react-native';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

interface Report {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  status: ReportStatus;
  upvoteCount: number;
  imageUrls: string[];
  location: { address: string; latitude: number; longitude: number };
  resolutionNote?: string;
  createdAt: any;
  statusHistory: Array<{ status: string; changedAt: string; changedBy: string; note?: string }>;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Pending',  color: '#F59E0B', bg: '#3D2E0A', icon: 'time-outline'             },
  ASSIGNED: { label: 'Assigned', color: '#60A5FA', bg: '#0D1A3D', icon: 'person-add-outline'        },
  FIXING:   { label: 'Fixing',   color: '#4CC2D1', bg: '#0D2A35', icon: 'construct-outline'         },
  RESOLVED: { label: 'Resolved', color: '#30A89C', bg: '#0D3D35', icon: 'checkmark-circle-outline'  },
  REJECTED: { label: 'Rejected', color: '#E05C5C', bg: '#3D1515', icon: 'close-circle-outline'      },
};

const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

const FILTER_TABS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type FilterTab = typeof FILTER_TABS[number];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return '';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)  return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;

  const timelineIndex = TIMELINE_STATUSES.indexOf(report.status);

  return (
    <Modal visible={!!report} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold flex-1">Report Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Image (first one if exists) */}
          {report.imageUrls?.[0] && (
            <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

          {/* Title + meta */}
          <View className="px-5 mb-4">
            <Text className="text-[#4CC2D1] text-xs font-bold mb-1">
              Ref: {report.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text className="text-white text-2xl font-bold">{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name={report.categoryIcon as any} size={13} color="#5A7D8A" />
              <Text className="text-gray-500 text-xs">{report.category}</Text>
              <Text className="text-gray-600">•</Text>
              <Text className="text-gray-500 text-xs">{formatDate(report.createdAt)}</Text>
            </View>
          </View>

          <View className="px-5 gap-3 mb-4">

            {/* Status Timeline */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-white font-bold mb-4">Status Timeline</Text>

              {report.status === 'REJECTED' ? (
                /* Rejected path */
                <>
                  {(['PENDING'] as ReportStatus[]).map((s) => {
                    const sc = STATUS_CONFIG[s];
                    const done = true;
                    return (
                      <View key={s} className="flex-row items-center mb-3">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: sc.bg }}>
                          <Ionicons name={sc.icon as any} size={16} color={sc.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: sc.color }}>{sc.label}</Text>
                        </View>
                        <Ionicons name="checkmark" size={14} color={sc.color} />
                      </View>
                    );
                  })}
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-[#3D1515]">
                      <Ionicons name="close-circle-outline" size={16} color="#E05C5C" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#E05C5C] font-semibold text-sm">Rejected</Text>
                      <Text className="text-gray-500 text-xs">Current status</Text>
                    </View>
                    <View className="w-2 h-2 rounded-full bg-[#E05C5C]" />
                  </View>
                </>
              ) : (
                /* Normal path */
                TIMELINE_STATUSES.map((s, i) => {
                  const sc = STATUS_CONFIG[s];
                  const done = timelineIndex >= i;
                  const isCurrent = report.status === s;
                  return (
                    <View key={s} className="flex-row items-center mb-3">
                      {/* Connector line */}
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <View className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: done ? sc.bg : '#1A2D3D' }}>
                          <Ionicons name={sc.icon as any} size={16} color={done ? sc.color : '#2D4F5C'} />
                        </View>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <View style={{
                            width: 2, height: 16, marginTop: 2,
                            backgroundColor: done ? sc.color + '40' : '#1E3347',
                          }} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: done ? sc.color : '#3A5060' }}>
                          {sc.label}
                        </Text>
                        {isCurrent && <Text className="text-gray-500 text-xs">Current status</Text>}
                      </View>
                      {isCurrent && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />}
                      {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                    </View>
                  );
                })
              )}
            </View>

            {/* Location */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-start gap-3"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center">
                <Ionicons name="location-outline" size={16} color="#4CC2D1" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-1">Location</Text>
                <Text className="text-white text-sm leading-5">{report.location?.address ?? 'Unknown'}</Text>
              </View>
            </View>

            {/* Description */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Description</Text>
              <Text className="text-white text-sm leading-6">{report.description}</Text>
            </View>

            {/* Upvotes */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-up-circle-outline" size={20} color="#4CC2D1" />
                <Text className="text-white font-semibold">{report.upvoteCount} community upvotes</Text>
              </View>
            </View>

            {/* Resolution / Rejection note */}
            {report.resolutionNote && (
              <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text className="text-white text-sm leading-6">{report.resolutionNote}</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Report Card
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80">
      <View className="bg-[#111E27] rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
        <View className="flex-row">
          {/* Category icon block */}
          <View className="w-[80px] h-[80px] items-center justify-center"
            style={{ backgroundColor: (report.categoryColor ?? '#4CC2D1') + '18' }}>
            <Ionicons name={report.categoryIcon as any} size={28} color={report.categoryColor ?? '#4CC2D1'} />
          </View>

          {/* Info */}
          <View className="flex-1 p-3 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>{report.title}</Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg }}>
                <Text className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{report.category}</Text>
            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={11} color="#3A6070" />
                <Text className="text-gray-600 text-[11px]" numberOfLines={1} style={{ maxWidth: 140 }}>
                  {report.location?.address ?? 'Unknown'}
                </Text>
              </View>
              <Text className="text-gray-600 text-[10px]">{formatDate(report.createdAt)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main History Screen
// ─────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollContext();
  const { user } = useAuth();

  const [reports, setReports]           = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // ── Subscribe to current user's reports ──
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Report[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Report, 'id'>),
        }));
        setReports(data);
        setFirestoreLoading(false);
      },
      (err) => {
        console.error('❌ History Firestore error:', err);
        setFirestoreLoading(false);
      },
    );

    return unsub;
  }, [user]);

  // Update selected report when real-time data changes
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports]);

  const filtered = reports.filter((r) => {
    if (activeFilter === 'All')      return true;
    if (activeFilter === 'Pending')  return r.status === 'PENDING';
    if (activeFilter === 'Fixing')   return r.status === 'FIXING' || r.status === 'ASSIGNED';
    if (activeFilter === 'Resolved') return r.status === 'RESOLVED';
    if (activeFilter === 'Rejected') return r.status === 'REJECTED';
    return true;
  });

  const countFor = (tab: FilterTab): number => {
    if (tab === 'All')      return reports.length;
    if (tab === 'Pending')  return reports.filter((r) => r.status === 'PENDING').length;
    if (tab === 'Fixing')   return reports.filter((r) => r.status === 'FIXING' || r.status === 'ASSIGNED').length;
    if (tab === 'Resolved') return reports.filter((r) => r.status === 'RESOLVED').length;
    if (tab === 'Rejected') return reports.filter((r) => r.status === 'REJECTED').length;
    return 0;
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      >
        {/* ── Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-white text-xl font-bold tracking-tight">My Reports</Text>
          </View>
          <View className="bg-[#1E3347] px-3 py-1.5 rounded-full">
            <Text className="text-[#4CC2D1] text-xs font-bold">{reports.length} Total</Text>
          </View>
        </View>

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            const count = countFor(tab);
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveFilter(tab)}
                className="flex-row items-center px-4 py-2 rounded-full gap-1.5"
                style={{
                  backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                  borderWidth: 1,
                  borderColor: isActive ? '#4CC2D1' : '#1E3347',
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: isActive ? '#071318' : '#5A7D8A' }}>
                  {tab}
                </Text>
                <View className="px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: isActive ? 'rgba(7,19,24,0.2)' : '#1E3347' }}>
                  <Text className="text-[10px] font-bold" style={{ color: isActive ? '#071318' : '#4CC2D1' }}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Report List ── */}
        <View className="px-5">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#4CC2D1" size="large" />
              <Text className="text-gray-500 mt-4 text-sm">Loading your reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-16 h-16 rounded-full bg-[#111E27] items-center justify-center mb-4">
                <Ionicons name="document-outline" size={30} color="#2D4F5C" />
              </View>
              <Text className="text-gray-500 font-semibold">
                {activeFilter === 'All' ? 'No reports yet' : `No ${activeFilter} reports`}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {activeFilter === 'All' ? 'Submit your first report using the + button' : 'Your reports will appear here'}
              </Text>
            </View>
          ) : (
            filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => setSelectedReport(report)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </LinearGradient>
  );
}