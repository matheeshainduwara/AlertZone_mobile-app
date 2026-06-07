import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
import { useTheme } from '../config/themeContext';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

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
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

const CATEGORIES = [
  { id: 'all',               label: 'All Categories',     icon: 'grid-outline',          color: '#0D8A72' },
  { id: 'road_traffic',      label: 'Road & Traffic',     icon: 'car-outline',          color: '#0D8A72' },
  { id: 'water_drainage',    label: 'Water & Drainage',   icon: 'water-outline',         color: '#3B82F6' },
  { id: 'waste_environment', label: 'Waste & Environment',icon: 'trash-outline',        color: '#34D399' },
  { id: 'social_safety',     label: 'Social Safety',      icon: 'shield-outline',        color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Bridge & Structural',icon: 'git-network-outline',   color: '#D97706' },
  { id: 'other',             label: 'Other',              icon: 'help-circle-outline',   color: '#94A3B8' },
] as const;

const STATUS_FILTERS = [
  { id: 'all',      label: 'All Statuses' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' },
] as const;

type StatusFilterId = typeof STATUS_FILTERS[number]['id'];

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

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// ─────────────────────────────────────────────
// Custom Calendar Modal Component
// ─────────────────────────────────────────────
interface CalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
  title: string;
}

function CalendarModal({ value, onChange, onClose, title }: CalendarProps) {
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(value ? value.getDate() : null);
  const { colors, isDark } = useTheme();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `day-${d}` });
  }

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(newDate);
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
            <Text style={[styles.monthYearText, { color: colors.text }]}>
              {months[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={[styles.weekdayText, { color: colors.textSecondary }]}>{d}</Text>
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
                  style={[
                    styles.dayCell,
                    isSelected && [styles.selectedDayCell, { backgroundColor: colors.primary }]
                  ]}
                >
                  {cell.day && (
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isSelected && [styles.selectedDayText, { color: '#FFFFFF' }]
                      ]}
                    >
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
// Report Card
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  
  const getStatusColorConfig = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg, icon: 'time-outline' };
      case 'ASSIGNED':
        return { label: 'Assigned', color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE', icon: 'person-add-outline' };
      case 'FIXING':
        return { label: 'Fixing', color: colors.primary, bg: colors.successBg, icon: 'construct-outline' };
      case 'RESOLVED':
        return { label: 'Resolved', color: colors.successText, bg: colors.successBg, icon: 'checkmark-circle-outline' };
      case 'REJECTED':
        return { label: 'Rejected', color: colors.dangerText, bg: colors.dangerBg, icon: 'close-circle-outline' };
      default:
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg, icon: 'time-outline' };
    }
  };

  const cfg = getStatusColorConfig(report.status);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.card,
        borderRadius: 16,
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
          backgroundColor: colors.border,
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
              backgroundColor: (report.categoryColor ?? colors.primary) + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={require('../assets/images/iconAlerZone-Bg-none.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
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
        <View style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
          <Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold' }}>{cfg.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const { colors, isDark } = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageScrollViewRef = useRef<ScrollView>(null);
  const [imageWidth, setImageWidth] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
    imageScrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [report]);

  const getStatusColorConfig = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg, icon: 'time-outline' };
      case 'ASSIGNED':
        return { label: 'Assigned', color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE', icon: 'person-add-outline' };
      case 'FIXING':
        return { label: 'Fixing', color: colors.primary, bg: colors.successBg, icon: 'construct-outline' };
      case 'RESOLVED':
        return { label: 'Resolved', color: colors.successText, bg: colors.successBg, icon: 'checkmark-circle-outline' };
      case 'REJECTED':
        return { label: 'Rejected', color: colors.dangerText, bg: colors.dangerBg, icon: 'close-circle-outline' };
      default:
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg, icon: 'time-outline' };
    }
  };

  if (!report) return null;
  const cfg = getStatusColorConfig(report.status);
  const timelineIndex = TIMELINE_STATUSES.indexOf(report.status);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;
    if (layoutWidth > 0) {
      const index = Math.round(contentOffset / layoutWidth);
      setActiveImageIndex(index);
    }
  };

  return (
    <Modal visible={!!report} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
            <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>Archived Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Image Carousel */}
          {report.imageUrls && report.imageUrls.length > 0 && (
            <View 
              className="mx-5 mb-4 rounded-2xl overflow-hidden" 
              style={{ height: 180, position: 'relative' }}
              onLayout={(e) => setImageWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={imageScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
              >
                {report.imageUrls.map((url, index) => (
                  <View key={index} style={{ width: imageWidth, height: 180 }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              {report.imageUrls.length > 1 && imageWidth > 0 && (
                <>
                  <View
                    style={{
                      position: 'absolute', bottom: 10, left: 0, right: 0,
                      flexDirection: 'row', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {report.imageUrls.map((_, i) => (
                      <Pressable
                        key={i}
                        onPress={() => {
                          setActiveImageIndex(i);
                          imageScrollViewRef.current?.scrollTo({ x: i * imageWidth, animated: true });
                        }}
                      >
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
                      onPress={() => {
                        const nextIdx = activeImageIndex - 1;
                        setActiveImageIndex(nextIdx);
                        imageScrollViewRef.current?.scrollTo({ x: nextIdx * imageWidth, animated: true });
                      }}
                      style={{ position: 'absolute', left: 10, top: 74, backgroundColor: colors.modalBackdrop, borderRadius: 16, padding: 6 }}
                    >
                      <Ionicons name="chevron-back" size={20} color="white" />
                    </Pressable>
                  )}
                  {activeImageIndex < report.imageUrls.length - 1 && (
                    <Pressable
                      onPress={() => {
                        const nextIdx = activeImageIndex + 1;
                        setActiveImageIndex(nextIdx);
                        imageScrollViewRef.current?.scrollTo({ x: nextIdx * imageWidth, animated: true });
                      }}
                      style={{ position: 'absolute', right: 10, top: 74, backgroundColor: colors.modalBackdrop, borderRadius: 16, padding: 6 }}
                    >
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          <View className="px-5 mb-4">
            <Text className="text-xs font-bold mb-1" style={{ color: colors.primary }}>
              Ref: {report.id}
            </Text>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name={report.categoryIcon as any} size={13} color={colors.textSecondary} />
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatDate(report.createdAt)}</Text>
            </View>
          </View>

          <View className="px-5 gap-3 mb-4">
            <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Text className="font-bold mb-4" style={{ color: colors.text }}>Status Timeline</Text>
              {report.status === 'REJECTED' ? (
                <>
                  {(['PENDING'] as ReportStatus[]).map((s) => {
                    const sc = getStatusColorConfig(s);
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
                      <Text className="font-semibold text-sm" style={{ color: colors.dangerText }}>Rejected</Text>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>Current status</Text>
                    </View>
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dangerText }} />
                  </View>
                </>
              ) : (
                TIMELINE_STATUSES.map((s, i) => {
                  const sc = getStatusColorConfig(s);
                  const done = timelineIndex >= i;
                  const isCurrent = report.status === s;
                  return (
                    <View key={s} className="flex-row items-center mb-3">
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <View className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: done ? sc.bg : colors.border }}>
                          <Ionicons name={sc.icon as any} size={16} color={done ? sc.color : colors.textMuted} />
                        </View>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <View style={{
                            width: 2, height: 16, marginTop: 2,
                            backgroundColor: done ? sc.color + '40' : colors.border,
                          }} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: done ? sc.color : colors.textMuted }}>
                          {sc.label}
                        </Text>
                        {isCurrent && <Text className="text-xs" style={{ color: colors.textMuted }}>Current status</Text>}
                      </View>
                      {isCurrent && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />}
                      {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                    </View>
                  );
                })
              )}
            </View>

            <View className="rounded-2xl p-4 flex-row items-start gap-3 border"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.border }}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] uppercase font-bold tracking-wide mb-1" style={{ color: colors.textMuted }}>Location</Text>
                <Text className="text-sm leading-5" style={{ color: colors.text }}>{report.location?.address ?? 'Unknown'}</Text>
                {(report.location?.province || report.location?.district || report.location?.localGovernmentArea) && (
                  <View className="mt-2 pt-2 border-t gap-1" style={{ borderTopColor: colors.border }}>
                    {report.location?.province && (
                      <Text className="text-xs" style={{ color: colors.text }}>
                        <Text className="font-semibold" style={{ color: colors.textSecondary }}>Province: </Text>{report.location.province}
                      </Text>
                    )}
                    {report.location?.district && (
                      <Text className="text-xs" style={{ color: colors.text }}>
                        <Text className="font-semibold" style={{ color: colors.textSecondary }}>District: </Text>{report.location.district}
                      </Text>
                    )}
                    {report.location?.localGovernmentArea && (
                      <Text className="text-xs" style={{ color: colors.text }}>
                        <Text className="font-semibold" style={{ color: colors.textSecondary }}>LGA: </Text>{report.location.localGovernmentArea}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Text className="text-[10px] uppercase font-bold tracking-wide mb-2" style={{ color: colors.textMuted }}>Description</Text>
              <Text className="text-sm leading-6" style={{ color: colors.text }}>{report.description}</Text>
            </View>

            {report.resolutionNote && (
              <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                <Text className="text-[10px] uppercase font-bold tracking-wide mb-2" style={{ color: colors.textMuted }}>
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text className="text-sm leading-6" style={{ color: colors.text }}>{report.resolutionNote}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Archive Screen
// ─────────────────────────────────────────────
export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [reports, setReports] = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilterId>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // ── Subscribe to user's archived reports ──
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      where('isArchived', '==', true),
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
        console.error('❌ Firestore Archive Error:', err);
        setFirestoreLoading(false);
      }
    );

    return unsub;
  }, [user]);

  // ── Reset visible count when any filter changes ──
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [activeCategory, activeStatusFilter, activeDateFilter, customStartDate, customEndDate]);

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  // ── Filter logic ──
  const filtered = reports.filter((r) => {
    // 1. Category filter
    if (activeCategory !== 'all' && r.categoryId !== activeCategory) {
      return false;
    }

    // 1b. Status filter
    if (activeStatusFilter === 'resolved' && r.status !== 'RESOLVED') {
      return false;
    }
    if (activeStatusFilter === 'rejected' && r.status !== 'REJECTED') {
      return false;
    }

    // 2. Date filter
    const createdDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (activeDateFilter === 'today') {
      return createdDate >= startOfToday;
    }

    if (activeDateFilter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdDate >= sevenDaysAgo;
    }

    if (activeDateFilter === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }

    if (activeDateFilter === 'custom') {
      if (customStartDate) {
        const checkStart = new Date(customStartDate);
        checkStart.setHours(0, 0, 0, 0);
        if (createdDate < checkStart) return false;
      }
      if (customEndDate) {
        const checkEnd = new Date(customEndDate);
        checkEnd.setHours(23, 59, 59, 999);
        if (createdDate > checkEnd) return false;
      }
    }

    return true;
  });

  const visibleReports = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center gap-3 px-5 mb-5">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-75"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>Archive</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>View resolved and historical reports</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.border }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>{filtered.length} Found</Text>
          </View>
        </View>

        {/* ── Category Filter List ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  className="flex-row items-center px-4 py-2 rounded-full gap-1.5"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? '#F5F5F5' : cat.color}
                  />
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#F5F5F5' : colors.textSecondary }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Status Filters ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {STATUS_FILTERS.map((sf) => {
              const isActive = activeStatusFilter === sf.id;
              return (
                <Pressable
                  key={sf.id}
                  onPress={() => setActiveStatusFilter(sf.id)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#F5F5F5' : colors.textSecondary }}>
                    {sf.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filters ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Date Filter</Text>
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
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#F5F5F5' : colors.textSecondary }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Picker Inputs ── */}
        {activeDateFilter === 'custom' && (
          <View className="mx-5 mb-4 p-4 rounded-2xl border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text }}>Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text className="text-xs font-semibold" style={{ color: colors.dangerText }}>Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-1 p-3 rounded-xl border flex-row justify-between items-center active:opacity-75"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View>
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>Start Date</Text>
                  <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text }}>
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-1 p-3 rounded-xl border flex-row justify-between items-center active:opacity-75"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View>
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>End Date</Text>
                  <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text }}>
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Reports List ── */}
        <View className="px-5 mt-2">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="mt-4 text-sm" style={{ color: colors.textMuted }}>Loading archive…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16 border rounded-3xl p-6" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.border }}>
                <Ionicons name="archive-outline" size={30} color={colors.primary} />
              </View>
              <Text className="font-bold text-base" style={{ color: colors.text }}>No archived reports</Text>
              <Text className="text-sm text-center mt-1 leading-5" style={{ color: colors.textMuted }}>
                Reports resolved for over 24 hours will automatically move to the archive. Use filters to adjust search.
              </Text>
            </View>
          ) : (
            <>
              {/* Results count */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  Showing <Text className="font-bold" style={{ color: colors.primary }}>{visibleReports.length}</Text> of <Text className="font-semibold" style={{ color: colors.text }}>{filtered.length}</Text> reports
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
                  className="mt-2 mb-4 py-4 rounded-2xl items-center justify-center active:opacity-75"
                  style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="chevron-down-circle-outline" size={20} color={colors.primary} />
                    <Text className="font-bold text-sm" style={{ color: colors.primary }}>
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View className="items-center py-4">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>All {filtered.length} reports shown</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Start Date Picker Modal ── */}
      {showStartPicker && (
        <CalendarModal
          title="Select Start Date"
          value={customStartDate}
          onChange={(d) => setCustomStartDate(d)}
          onClose={() => setShowStartPicker(false)}
        />
      )}

      {/* ── End Date Picker Modal ── */}
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
// Calendar & Modals Custom Styling
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
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
  arrowButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDayCell: {
    // dynamically styled in component
  },
  dayText: {
    fontSize: 14,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeCalendarText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
