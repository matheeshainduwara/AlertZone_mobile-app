import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../config/themeContext';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useScrollContext } from '../../config/tabBarScrollContext';
import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { Image } from 'react-native';
import {
  awardAcceptedPoints,
  computeEarnedBadgeIds,
  incrementResolvedCount,
  syncBadgesToFirestore,
} from '../../services/gamification.service';

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
  description: string;
  status: ReportStatus;
  upvoteCount: number;
  imageUrls: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
    province?: string;
    district?: string;
    localGovernmentArea?: string;
  };
  resolutionNote?: string;
  createdAt: any;
  updatedAt?: any;
  isArchived?: boolean;
  statusHistory: Array<{ status: string; changedAt: any; changedBy: string; note?: string }>;
  // gamification flags — written by client to prevent double-awarding
  pointsAwarded?: boolean;
  resolvedCounted?: boolean;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Pending',  color: '#D97706', bg: '#FEF3C7', icon: 'time-outline'             },
  ASSIGNED: { label: 'Assigned', color: '#3B82F6', bg: '#DBEAFE', icon: 'person-add-outline'        },
  FIXING:   { label: 'Fixing',   color: '#0D8A72', bg: '#E6F7F3', icon: 'construct-outline'         },
  RESOLVED: { label: 'Resolved', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline'  },
  REJECTED: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline'      },
};

const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

const FILTER_TABS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type FilterTab = typeof FILTER_TABS[number];

const DATE_FILTERS = [
  { id: 'all',    label: 'All Time' },
  { id: 'today',  label: 'Today' },
  { id: '7d',     label: 'Last 7 Days' },
  { id: '30d',    label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
] as const;
type DateFilterId = typeof DATE_FILTERS[number]['id'];

const INITIAL_PAGE_SIZE = 15;
const LOAD_MORE_SIZE = 20;

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

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// ─────────────────────────────────────────────
// Custom Calendar Modal
// ─────────────────────────────────────────────
interface CalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
  title: string;
}

function CalendarModal({ value, onChange, onClose, title }: CalendarProps) {
  const { colors, isDark } = useTheme();
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(value ? value.getDate() : null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, key: `empty-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `day-${d}` });

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    onChange(new Date(currentYear, currentMonth, day));
    onClose();
  };

  return (
    <Modal transparent visible animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.calendarTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
            <Text style={[styles.monthYearText, { color: colors.text }]}>{months[currentMonth]} {currentYear}</Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={[styles.weekdayText, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {cells.map((cell) => {
              const isSelected = cell.day === selectedDay;
              return (
                <Pressable
                  key={cell.key}
                  disabled={cell.day === null}
                  onPress={() => cell.day && handleDaySelect(cell.day)}
                  style={[styles.dayCell, isSelected && { backgroundColor: colors.primary }]}
                >
                  {cell.day && (
                    <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                      {cell.day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={[styles.closeCalendarButton, { borderColor: colors.border }]}>
            <Text style={[styles.closeCalendarText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const { colors } = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [report]);

  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  const timelineIndex = TIMELINE_STATUSES.indexOf(report.status);

  return (
    <Modal visible={!!report} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 }}>Report Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Image Carousel */}
          {report.imageUrls && report.imageUrls.length > 0 && (
            <View className="mx-5 mb-4 mt-4 rounded-2xl overflow-hidden" style={{ height: 180, position: 'relative' }}>
              <Image
                source={{ uri: report.imageUrls[activeImageIndex] }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              {report.imageUrls.length > 1 && (
                <>
                  <View
                    style={{
                      position: 'absolute', bottom: 10, left: 0, right: 0,
                      flexDirection: 'row', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {report.imageUrls.map((_, i) => (
                      <Pressable key={i} onPress={() => setActiveImageIndex(i)}>
                        <View
                          style={{
                            width: i === activeImageIndex ? 20 : 6,
                            height: 6, borderRadius: 3,
                            backgroundColor: i === activeImageIndex ? colors.primary : 'rgba(255,255,255,0.4)',
                          }}
                        />
                      </Pressable>
                    ))}
                  </View>
                  {activeImageIndex > 0 && (
                    <Pressable
                      onPress={() => setActiveImageIndex(activeImageIndex - 1)}
                      style={{ position: 'absolute', left: 10, top: 74, backgroundColor: colors.modalBackdrop, borderRadius: 16, padding: 6 }}
                    >
                      <Ionicons name="chevron-back" size={20} color="white" />
                    </Pressable>
                  )}
                  {activeImageIndex < report.imageUrls.length - 1 && (
                    <Pressable
                      onPress={() => setActiveImageIndex(activeImageIndex + 1)}
                      style={{ position: 'absolute', right: 10, top: 74, backgroundColor: colors.modalBackdrop, borderRadius: 16, padding: 6 }}
                    >
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* Title + meta */}
          <View className="px-5 mb-4" style={{ marginTop: (report.imageUrls && report.imageUrls.length > 0) ? 0 : 16 }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>Ref: {report.id}</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name={report.categoryIcon as any} size={13} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDate(report.createdAt)}</Text>
            </View>
          </View>

          <View className="px-5 gap-3 mb-4">

            {/* Status Timeline */}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 16 }}>Status Timeline</Text>

              {report.status === 'REJECTED' ? (
                <>
                  {(['PENDING'] as ReportStatus[]).map((s) => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <View key={s} className="flex-row items-center mb-3">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: sc.bg }}>
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
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.dangerBg }}>
                      <Ionicons name="close-circle-outline" size={16} color={colors.dangerText} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.dangerText, fontWeight: '600', fontSize: 13 }}>Rejected</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>Current status</Text>
                    </View>
                    <View className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  </View>
                </>
              ) : (
                TIMELINE_STATUSES.map((s, i) => {
                  const sc = STATUS_CONFIG[s];
                  const done = timelineIndex >= i;
                  const isCurrent = report.status === s;
                  return (
                    <View key={s} className="flex-row items-center mb-3">
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <View className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: done ? sc.bg : colors.background }}>
                          <Ionicons name={sc.icon as any} size={16} color={done ? sc.color : colors.border} />
                        </View>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <View style={{ width: 2, height: 16, marginTop: 2, backgroundColor: done ? sc.color + '40' : colors.border }} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: done ? sc.color : colors.border }}>
                          {sc.label}
                        </Text>
                        {isCurrent && <Text style={{ color: colors.textMuted, fontSize: 12 }}>Current status</Text>}
                      </View>
                      {isCurrent && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />}
                      {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                    </View>
                  );
                })
              )}
            </View>

            {/* Location */}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Location</Text>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>{report.location?.address ?? 'Unknown'}</Text>
                {(report.location?.province || report.location?.district || report.location?.localGovernmentArea) && (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 }}>
                    {report.location?.province && (
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Province: </Text>{report.location.province}
                      </Text>
                    )}
                    {report.location?.district && (
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>District: </Text>{report.location.district}
                      </Text>
                    )}
                    {report.location?.localGovernmentArea && (
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>LGA: </Text>{report.location.localGovernmentArea}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Description</Text>
              <Text style={{ color: colors.text, fontSize: 13, lineHeight: 22 }}>{report.description}</Text>
            </View>

            {/* Upvotes */}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: '600' }}>{report.upvoteCount} community upvotes</Text>
              </View>
            </View>

            {/* View on Map */}
            <Pressable
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/(tabs)/map',
                  params: { lat: report.location.latitude, lng: report.location.longitude, id: report.id }
                });
              }}
              style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary }}
              className="active:opacity-70"
            >
              <Ionicons name="map-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700' }}>View on Map</Text>
            </Pressable>

            {/* Resolution / Rejection note */}
            {report.resolutionNote && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 22 }}>{report.resolutionNote}</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Report Card
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
      }}
      className="active:opacity-85"
    >
      {/* Image / Icon preview */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.background,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {report.imageUrls && report.imageUrls.length > 0 ? (
          <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: (report.categoryColor ?? '#0D8A72') + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={require('../../assets/images/iconAlerZone-Bg-none.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Title & Details */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
          {report.location?.address ?? 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {formatDate(report.createdAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {report.upvoteCount ?? 0} upvotes
            </Text>
          </View>
        </View>
      </View>

      {/* Status Pill & Arrow */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
          <Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold' }}>{cfg.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Resolution & Archive Helpers
// ─────────────────────────────────────────────
const getResolvedTime = (report: Report): Date | null => {
  if (report.status !== 'RESOLVED') return null;
  if (report.statusHistory && Array.isArray(report.statusHistory)) {
    const resolvedEntry = report.statusHistory.find(h => h.status === 'RESOLVED');
    if (resolvedEntry?.changedAt) {
      return resolvedEntry.changedAt.toDate ? resolvedEntry.changedAt.toDate() : new Date(resolvedEntry.changedAt);
    }
  }
  if (report.updatedAt) return report.updatedAt.toDate ? report.updatedAt.toDate() : new Date(report.updatedAt);
  if (report.createdAt) return report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
  return null;
};

const isEligibleForArchive = (report: Report): boolean => {
  if (report.status !== 'RESOLVED') return false;
  if (report.isArchived === true) return false;
  const resolvedTime = getResolvedTime(report);
  if (!resolvedTime) return false;
  return (new Date().getTime() - resolvedTime.getTime()) >= 24 * 60 * 60 * 1000;
};

// ─────────────────────────────────────────────
// Main History Screen
// ─────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onScroll } = useScrollContext();
  const { user, profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const gamificationBusy = useRef(false);

  const [reports, setReports]           = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Date filter state
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate]   = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]   = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

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
      async (snap) => {
        const data: Report[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Report, 'id'>),
        }));
        setReports(data);
        setFirestoreLoading(false);

        // ── Gamification: award points & badges ─────────────────
        if (!user || !profile || gamificationBusy.current) return;
        gamificationBusy.current = true;
        try {
          const newlyAccepted = data.filter((r) => r.status === 'ASSIGNED' && !r.pointsAwarded);
          const newlyResolved = data.filter((r) => r.status === 'RESOLVED' && !r.resolvedCounted);

          for (const r of newlyAccepted) await awardAcceptedPoints(user.uid, r.id);
          for (const r of newlyResolved) await incrementResolvedCount(user.uid, r.id);

          if (newlyAccepted.length > 0) {
            const totalPts = newlyAccepted.length * 10;
            Toast.show({
              type: 'success',
              text1: `+${totalPts} Points Earned! 🎉`,
              text2: `${newlyAccepted.length} report${newlyAccepted.length > 1 ? 's' : ''} accepted by authorities.`,
            });
          }

          const updatedAccepted = (profile.reportsAccepted ?? 0) + newlyAccepted.length;
          const updatedResolved = (profile.reportsResolved ?? 0) + newlyResolved.length;
          const updatedPoints   = (profile.contributionPoints ?? 0) + newlyAccepted.length * 10;
          const timestamps = data.map((r) => r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt));

          const earnedIds = computeEarnedBadgeIds({
            totalReports: data.length,
            reportsAccepted: updatedAccepted,
            reportsResolved: updatedResolved,
            contributionPoints: updatedPoints,
            reportTimestamps: timestamps,
          });

          const newBadges = await syncBadgesToFirestore(user.uid, earnedIds, profile.badges ?? []);

          if (newBadges.length > 0) {
            Toast.show({
              type: 'success',
              text1: `🏅 New Badge${newBadges.length > 1 ? 's' : ''} Unlocked!`,
              text2: `Check your profile to see your rewards.`,
            });
          }

          if (newlyAccepted.length > 0 || newlyResolved.length > 0 || newBadges.length > 0) {
            await refreshProfile();
          }
        } catch (e) {
          console.error('❌ Gamification processing error:', e);
        } finally {
          gamificationBusy.current = false;
        }
      },
      (err) => {
        console.error('❌ History Firestore error:', err);
        setFirestoreLoading(false);
      },
    );

    return unsub;
  }, [user, profile]);

  // Update selected report when real-time data changes
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports]);

  // ── Auto-archiving resolved reports after 24 hours ──
  useEffect(() => {
    if (reports.length === 0) return;
    const toArchive = reports.filter(isEligibleForArchive);
    if (toArchive.length === 0) return;

    const archiveReports = async () => {
      try {
        const batch = writeBatch(db);
        toArchive.forEach((report) => {
          batch.update(doc(db, 'reports', report.id), { isArchived: true, updatedAt: new Date() });
        });
        await batch.commit();
      } catch (err) {
        console.error('[AutoArchive] Error auto-archiving reports:', err);
      }
    };

    archiveReports();
  }, [reports]);

  // ── Reset visible count when any filter changes ──
  useEffect(() => { setVisibleCount(INITIAL_PAGE_SIZE); }, [activeFilter, activeDateFilter, customStartDate, customEndDate]);

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveDateFilter('all');
  };

  // ── Combined filtering ──
  const filtered = reports.filter((r) => {
    if (r.isArchived === true) return false;

    // Status filter
    if (activeFilter === 'Pending'  && r.status !== 'PENDING') return false;
    if (activeFilter === 'Fixing'   && r.status !== 'FIXING' && r.status !== 'ASSIGNED') return false;
    if (activeFilter === 'Resolved' && r.status !== 'RESOLVED') return false;
    if (activeFilter === 'Rejected' && r.status !== 'REJECTED') return false;

    // Date filter
    const reportDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    if (activeDateFilter === 'today') {
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      if (reportDate < startOfToday) return false;
    } else if (activeDateFilter === '7d') {
      const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
      if (reportDate < sevenAgo) return false;
    } else if (activeDateFilter === '30d') {
      const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      if (reportDate < thirtyAgo) return false;
    } else if (activeDateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate); start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }
    }

    return true;
  });

  const visibleReports = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const countFor = (tab: FilterTab): number => {
    const active = reports.filter((r) => r.isArchived !== true);
    if (tab === 'All')      return active.length;
    if (tab === 'Pending')  return active.filter((r) => r.status === 'PENDING').length;
    if (tab === 'Fixing')   return active.filter((r) => r.status === 'FIXING' || r.status === 'ASSIGNED').length;
    if (tab === 'Resolved') return active.filter((r) => r.status === 'RESOLVED').length;
    if (tab === 'Rejected') return active.filter((r) => r.status === 'REJECTED').length;
    return 0;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>My Reports</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/archive' as any)}
              style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border }}
              className="active:opacity-75"
            >
              <Ionicons name="archive-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Archive</Text>
            </Pressable>
            <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                {filtered.length}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status Filter Tabs ── */}
        <View className="mb-1">
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
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
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }}>
                    {tab}
                  </Text>
                  <View className="px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.border }}>
                    <Text className="text-[10px] font-bold" style={{ color: isActive ? '#FFFFFF' : colors.primary }}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filter ── */}
        <View className="mb-4">
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date Filter</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {DATE_FILTERS.map((df) => {
              const isActive = activeDateFilter === df.id;
              return (
                <Pressable
                  key={df.id}
                  onPress={() => setActiveDateFilter(df.id)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Range Picker ── */}
        {activeDateFilter === 'custom' && (
          <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                className="active:opacity-75"
              >
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Start Date</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                className="active:opacity-75"
              >
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>End Date</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Report List ── */}
        <View className="px-5">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 13 }}>Loading your reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 24 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="document-outline" size={28} color={colors.border} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                {activeFilter === 'All' ? 'No reports found' : `No ${activeFilter} reports`}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
                {activeFilter === 'All' && activeDateFilter === 'all'
                  ? 'Submit your first report using the + button'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            <>
              {/* Results count */}
              <View className="flex-row justify-between items-center mb-3">
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Showing <Text style={{ color: colors.primary, fontWeight: '700' }}>{visibleReports.length}</Text> of <Text style={{ color: colors.text, fontWeight: '600' }}>{filtered.length}</Text> reports
                </Text>
              </View>

              {visibleReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onPress={() => setSelectedReport(report)}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Pressable
                  onPress={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
                  style={{ marginTop: 8, marginBottom: 16, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
                  className="active:opacity-75"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="chevron-down-circle-outline" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View className="items-center py-4">
                  <Text style={{ color: colors.border, fontSize: 12 }}>All {filtered.length} reports shown</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modals */}
      {showStartPicker && (
        <CalendarModal
          title="Select Start Date"
          value={customStartDate}
          onChange={(d) => setCustomStartDate(d)}
          onClose={() => setShowStartPicker(false)}
        />
      )}
      {showEndPicker && (
        <CalendarModal
          title="Select End Date"
          value={customEndDate}
          onChange={(d) => setCustomEndDate(d)}
          onClose={() => setShowEndPicker(false)}
        />
      )}

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </View>
  );
}



// ─────────────────────────────────────────────
// Calendar Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  arrowButton: { padding: 8 },
  monthYearText: { color: '#1A1A1A', fontSize: 16, fontWeight: '600' },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    color: '#9CA3AF',
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDayCell: { backgroundColor: '#0D8A72' },
  dayText: { color: '#4A4A4A', fontSize: 14 },
  selectedDayText: { color: '#FFFFFF', fontWeight: 'bold' },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  closeCalendarText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
});