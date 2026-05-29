import React, { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
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
  location: { address: string; latitude: number; longitude: number };
  resolutionNote?: string;
  createdAt: any;
  updatedAt?: any;
  isArchived?: boolean;
  statusHistory: Array<{ status: string; changedAt: any; changedBy: string; note?: string }>;
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

const CATEGORIES = [
  { id: 'all',               label: 'All Categories',     icon: 'grid-outline',          color: '#4CC2D1' },
  { id: 'road_traffic',      label: 'Road & Traffic',     icon: 'car-outline',          color: '#4CC2D1' },
  { id: 'water_drainage',    label: 'Water & Drainage',   icon: 'water-outline',         color: '#60A5FA' },
  { id: 'waste_environment', label: 'Waste & Environment.',icon: 'trash-outline',        color: '#34D399' },
  { id: 'social_safety',     label: 'Social Safety',      icon: 'shield-outline',        color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Bridge & Structural',icon: 'git-network-outline',   color: '#F59E0B' },
  { id: 'other',             label: 'Other',              icon: 'help-circle-outline',   color: '#94A3B8' },
] as const;

const DATE_FILTERS = [
  { id: 'all',    label: 'All Time' },
  { id: 'today',  label: 'Today' },
  { id: '7d',     label: 'Last 7 Days' },
  { id: '30d',    label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
] as const;

type DateFilterId = typeof DATE_FILTERS[number]['id'];

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
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>{title}</Text>
          
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color="#4CC2D1" />
            </Pressable>
            <Text style={styles.monthYearText}>
              {months[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color="#4CC2D1" />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={styles.weekdayText}>{d}</Text>
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
                    isSelected && styles.selectedDayCell
                  ]}
                >
                  {cell.day && (
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText
                      ]}
                    >
                      {cell.day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={styles.closeCalendarButton}>
            <Text style={styles.closeCalendarText}>Cancel</Text>
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
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80">
      <View className="bg-[#111E27] rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
        <View className="flex-row">
          <View className="w-[80px] h-[80px] items-center justify-center"
            style={{ backgroundColor: (report.categoryColor ?? '#4CC2D1') + '18' }}>
            <Ionicons name={report.categoryIcon as any} size={28} color={report.categoryColor ?? '#4CC2D1'} />
          </View>

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
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold flex-1">Archived Report Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {report.imageUrls?.[0] && (
            <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

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
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-white font-bold mb-4">Status Timeline</Text>
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
                TIMELINE_STATUSES.map((s, i) => {
                  const sc = STATUS_CONFIG[s];
                  const done = timelineIndex >= i;
                  const isCurrent = report.status === s;
                  return (
                    <View key={s} className="flex-row items-center mb-3">
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

            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Description</Text>
              <Text className="text-white text-sm leading-6">{report.description}</Text>
            </View>

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
// Main Archive Screen
// ─────────────────────────────────────────────
export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

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
        console.error('❌ Archive Firestore error:', err);
        setFirestoreLoading(false);
      },
    );

    return unsub;
  }, [user]);

  // Update selected report if database updates
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports]);

  // Filtering implementation
  const filtered = reports.filter((r) => {
    // 1. Category Filter
    if (activeCategory !== 'all' && r.categoryId !== activeCategory) {
      return false;
    }

    // 2. Date Filter
    const reportDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    const now = new Date();

    if (activeDateFilter === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (reportDate < startOfToday) return false;
    } else if (activeDateFilter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (reportDate < sevenDaysAgo) return false;
    } else if (activeDateFilter === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (reportDate < thirtyDaysAgo) return false;
    } else if (activeDateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }
    }

    return true;
  });

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveDateFilter('all');
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-5 mb-5 gap-3">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-[#1E3A44] items-center justify-center active:opacity-75">
            <Ionicons name="arrow-back" size={20} color="#4CC2D1" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold tracking-tight">Archive</Text>
            <Text className="text-gray-500 text-xs mt-0.5">View resolved and historical reports</Text>
          </View>
          <View className="bg-[#1E3347] px-3 py-1.5 rounded-full">
            <Text className="text-[#4CC2D1] text-xs font-bold">{filtered.length} Found</Text>
          </View>
        </View>

        {/* ── Category Filter List ── */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs font-bold px-5 mb-2 uppercase tracking-wide">Category</Text>
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
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1,
                    borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? '#071318' : cat.color}
                  />
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#071318' : '#5A7D8A' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filters ── */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs font-bold px-5 mb-2 uppercase tracking-wide">Date Filter</Text>
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
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1,
                    borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#071318' : '#5A7D8A' }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Picker Inputs ── */}
        {activeDateFilter === 'custom' && (
          <View className="mx-5 mb-4 p-4 rounded-2xl bg-[#111E27] border border-[#1E3347]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-xs font-bold uppercase tracking-wide">Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text className="text-[#E05C5C] text-xs font-semibold">Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-1 p-3 rounded-xl bg-[#1E3A44] border border-[#2D4F5C] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-gray-500 text-[10px] uppercase font-bold">Start Date</Text>
                  <Text className="text-white text-sm font-semibold mt-0.5">
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#4CC2D1" />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-1 p-3 rounded-xl bg-[#1E3A44] border border-[#2D4F5C] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-gray-500 text-[10px] uppercase font-bold">End Date</Text>
                  <Text className="text-white text-sm font-semibold mt-0.5">
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#4CC2D1" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Reports List ── */}
        <View className="px-5 mt-2">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#4CC2D1" size="large" />
              <Text className="text-gray-500 mt-4 text-sm">Loading archive…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16 bg-[#111E27] border border-[#1E3347] rounded-3xl p-6">
              <View className="w-16 h-16 rounded-full bg-[#1E3A44] items-center justify-center mb-4">
                <Ionicons name="archive-outline" size={30} color="#4CC2D1" />
              </View>
              <Text className="text-white font-bold text-base">No archived reports</Text>
              <Text className="text-gray-500 text-sm text-center mt-1 leading-5">
                Reports resolved for over 24 hours will automatically move to the archive. Use filters to adjust search.
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
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Calendar & Modals Custom Styling
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111E27',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E3347',
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: '#5A7D8A',
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
    backgroundColor: '#4CC2D1',
  },
  dayText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  selectedDayText: {
    color: '#071318',
    fontWeight: 'bold',
  },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  closeCalendarText: {
    color: '#5A7D8A',
    fontSize: 14,
    fontWeight: '600',
  },
});
