import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';
import * as Location from 'expo-location';
import { collection, collectionGroup, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import ReportDetailSheet from '../../components/ReportDetailSheet';
import { db } from '../../services/firebase';
import { useAuth } from '../../config/authConfig';

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────
interface ReportPin {
  id: string;
  title: string;
  categoryId: string;
  categoryIcon: string;
  categoryColor: string;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  image?: string;
  createdAt: any;
  distance?: number;
}



const STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B',
  ASSIGNED: '#60A5FA',
  FIXING: '#4CC2D1',
  RESOLVED: '#30A89C',
  REJECTED: '#E05C5C',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distKm: number) => {
  if (distKm < 1) return `${Math.round(distKm * 1000)}m away`;
  return `${distKm.toFixed(1)}km away`;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  return 'Just now';
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-white text-lg font-bold">{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} className="active:opacity-70">
          <Text className="text-[#4CC2D1] text-sm font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}



function NearbyCard({ item, onPress }: { item: ReportPin; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-3 active:opacity-90" style={{ width: 180 }}>
      <View className="rounded-2xl overflow-hidden bg-[#1E3A44]" style={{ borderWidth: 1, borderColor: '#2D4F5C' }}>
        <View style={{ height: 110, backgroundColor: '#0D1F2D' }}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-[#111E27]">
               <Ionicons name={item.categoryIcon as any} size={40} color={item.categoryColor} style={{ opacity: 0.5 }} />
            </View>
          )}
          <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: STATUS_COLOR[item.status] || '#F59E0B' }}>
            <Text className="text-[10px] font-bold text-white tracking-wider">{item.status}</Text>
          </View>
        </View>
        <View className="px-3 py-2.5">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color="#5A7D8A" />
            <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{item.distance ? formatDistance(item.distance) : 'Nearby'}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function UpdateRow({ item, onPress }: { item: ReportPin; onPress: () => void }) {
  const isResolved = item.status === 'RESOLVED';
  const isNew = item.status === 'PENDING';
  
  const icon = isResolved ? 'checkmark-circle' : (isNew ? 'alert-circle' : 'construct');
  const iconColor = STATUS_COLOR[item.status] || '#F59E0B';
  const iconBg = iconColor + '22';
  
  let titlePrefix = 'Status Update: ';
  if (isResolved) titlePrefix = 'Resolved: ';
  else if (isNew) titlePrefix = 'New Report: ';

  const timeStr = item.createdAt ? timeAgo(item.createdAt.toDate()) : 'Recently';
  const addressStr = item.address ? item.address.split(',')[0] : 'Unknown location';

  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 active:opacity-70">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1 pr-2">
        <Text className="text-white text-sm font-semibold" numberOfLines={1}>
          {titlePrefix}{item.title}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
          {addressStr} • {timeStr}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#2D4F5C" />
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View className="mr-3 rounded-2xl overflow-hidden bg-[#1E3A44]" style={{ width: 180, borderWidth: 1, borderColor: '#2D4F5C' }}>
      <View style={{ height: 110, backgroundColor: '#2D4F5C' }} />
      <View className="px-3 py-3 gap-2">
        <View className="h-4 bg-[#2D4F5C] rounded w-3/4 opacity-50" />
        <View className="h-3 bg-[#2D4F5C] rounded w-1/2 opacity-50" />
      </View>
    </View>
  );
}

function SkeletonUpdate() {
  return (
    <View className="flex-row items-center py-3">
      <View className="w-10 h-10 rounded-full bg-[#1E3347] mr-3 opacity-50" />
      <View className="flex-1 gap-2">
        <View className="h-4 bg-[#1E3347] rounded w-2/3 opacity-50" />
        <View className="h-3 bg-[#1E3347] rounded w-1/3 opacity-50" />
      </View>
    </View>
  );
}

function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <View className="items-center justify-center py-8 px-4 border border-[#1E3347] rounded-2xl bg-[#111E27]">
      <View className="w-12 h-12 rounded-full bg-[#1E3A44] items-center justify-center mb-3">
        <Ionicons name={icon as any} size={24} color="#4CC2D1" />
      </View>
      <Text className="text-white font-bold text-sm mb-1">{title}</Text>
      <Text className="text-gray-500 text-xs text-center leading-5">{subtitle}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { onScroll } = useScrollContext();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reports, setReports] = useState<ReportPin[]>([]);
  const [nearbyIssues, setNearbyIssues] = useState<ReportPin[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<ReportPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [upvotedCount, setUpvotedCount] = useState(0);

  const handleRefresh = async () => {
    setRefreshing(true);
    let coords = profile?.homeLocation || null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch (e) {
      console.warn('Location error on Home Refresh:', e);
    }
    setUserLocation(coords);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const radiusKm = profile?.alertRadius ? parseInt(profile.alertRadius.replace(/[^0-9]/g, '')) || 5 : 5;
  const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Citizen';

  // 1. Fetch location
  useEffect(() => {
    (async () => {
      let coords = profile?.homeLocation || null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch (e) {
        console.warn('Location error on Home:', e);
      }
      setUserLocation(coords);
    })();
  }, [profile?.homeLocation]);

  // 2. Fetch active reports in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const pins: ReportPin[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? data.category ?? 'Report',
          categoryId: data.categoryId ?? 'road_traffic',
          categoryIcon: data.categoryIcon ?? 'warning-outline',
          categoryColor: data.categoryColor ?? '#4CC2D1',
          latitude: data.location?.latitude,
          longitude: data.location?.longitude,
          status: data.status ?? 'PENDING',
          address: data.location?.address ?? '',
          image: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : undefined,
          createdAt: data.createdAt,
        } as ReportPin;
      }).filter(p => p.latitude && p.longitude);
      
      setReports(pins);
    }, (err) => {
      console.error("Home reports listener error:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2.5. Fetch unread notifications count in real-time
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.length);
    }, (err) => {
      console.error("Home unread count listener error:", err);
    });
    return unsub;
  }, [user?.uid]);

  // 2.6. Fetch count of reports this user has upvoted
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collectionGroup(db, 'upvotes'),
      where('uid', '==', user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      setUpvotedCount(snap.docs.length);
    }, (err) => {
      // collectionGroup may need an index — silently ignore in dev
      console.warn('Upvoted count error (index may be needed):', err);
    });
    return unsub;
  }, [user?.uid]);

  // 3. Process distances when data or location updates
  useEffect(() => {
    if (reports.length === 0) {
      setNearbyIssues([]);
      setLatestUpdates([]);
      // wait a bit for initial fetch before clearing loading
      const t = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(t);
    }

    if (!userLocation) {
      // Fallback: Just show latest reports globally if no location
      setLatestUpdates(reports.slice(0, 3));
      setNearbyIssues(reports.slice(0, 5));
      setLoading(false);
      return;
    }

    // Calculate distance and filter by radius
    const processed = reports.map(r => ({
      ...r,
      distance: getDistance(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude)
    }));
    
    const withinRadius = processed.filter(r => r.distance !== undefined && r.distance <= radiusKm);
    
    // Nearest issues (sort by distance)
    const nearby = [...withinRadius].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Latest updates (already sorted by createdAt descending from query)
    const updates = [...withinRadius];

    setNearbyIssues(nearby);
    setLatestUpdates(updates.slice(0, 3));
    setLoading(false);
  }, [reports, userLocation, radiusKm]);

  const openReportDetail = (item: ReportPin) => {
    setSelectedReportId(item.id);
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120, // space for floating tab bar
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4CC2D1"
            colors={["#4CC2D1"]}
          />
        }
      >
        {/* ── 1. Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-white text-xl font-bold tracking-tight">AlertZone</Text>
          </View>

          {/* Notification bell with badge */}
          <Pressable onPress={() => router.push('/notifications' as any)} className="active:opacity-70">
            <View className="w-10 h-10 rounded-full bg-[#1E3A44] items-center justify-center"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Ionicons name="notifications-outline" size={20} color="#5A7D8A" />
            </View>
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E05C5C] items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── 2. Hero Banner ── */}
        <View className="mx-5 mb-6">
          <LinearGradient
            colors={['#1A3D4A', '#0F2D38']}
            className="rounded-3xl overflow-hidden p-5 shadow-lg"
            style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
          >
            <View className="flex-row items-center">
              <View className="flex-1 pr-3">
                <Text className="text-white text-xl font-bold leading-7">
                  Hello {firstName},{'\n'}Your Voice Matters.
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/profile')} className="flex-row items-center mt-2 active:opacity-70">
                  <Ionicons name="options-outline" size={14} color="#4CC2D1" style={{ marginRight: 4 }} />
                  <Text className="text-[#4CC2D1] text-xs font-bold tracking-wide">
                    {radiusKm}KM ALERT RADIUS (EDIT)
                  </Text>
                </Pressable>

                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    className="flex-1 bg-[#4CC2D1] rounded-xl flex-row items-center justify-center py-2.5 active:opacity-80"
                    onPress={() => router.push('/(tabs)/report')}
                  >
                    <Ionicons name="camera" size={16} color="#071318" />
                    <Text className="text-[#071318] font-bold text-sm ml-1.5">New Report</Text>
                  </Pressable>

                  <Pressable
                    className="flex-1 border border-[#4CC2D1] rounded-xl flex-row items-center justify-center py-2.5 active:opacity-80"
                    onPress={() => router.push('/onboarding' as any)}
                  >
                    <Ionicons name="help-circle-outline" size={16} color="#4CC2D1" />
                    <Text className="text-[#4CC2D1] font-bold text-sm ml-1.5">Test Intro</Text>
                  </Pressable>
                </View>
              </View>

              <View
                className="w-28 h-28 rounded-2xl overflow-hidden items-center justify-center bg-[#0D2A35]"
                style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-[#4CC2D1]/20" />
              </View>
            </View>
          </LinearGradient>
        </View>



        {/* ── 4. Nearby Issues ── */}
        <View className="mb-7">
          <View className="px-5">
            <SectionHeader
              title="Nearby Issues"
              actionLabel="View Map"
              onAction={() => router.push('/(tabs)/map')}
            />
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
          >
            {loading ? (
              <View className="flex-row">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </View>
            ) : nearbyIssues.length > 0 ? (
              nearbyIssues.map(item => (
                <NearbyCard key={item.id} item={item} onPress={() => openReportDetail(item)} />
              ))
            ) : (
              <View style={{ width: 300 }}>
                <EmptyState
                  title="All clear in your area!"
                  subtitle={`No active reports found within your ${radiusKm}km radius.`}
                  icon="leaf-outline"
                />
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── 5. Latest Updates ── */}
        <View className="px-5">
          <SectionHeader title="Latest Updates" />
          
          <View
            className="bg-[#111E27] rounded-2xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: '#1E3347' }}
          >
            {loading ? (
              <View className="px-4">
                {[1, 2, 3].map((i, index) => (
                  <View key={i}>
                    <SkeletonUpdate />
                    {index < 2 && <View className="h-px bg-[#1E3347]" />}
                  </View>
                ))}
              </View>
            ) : latestUpdates.length > 0 ? (
              <View className="px-4">
                {latestUpdates.map((item, index) => (
                  <View key={item.id}>
                    <UpdateRow item={item} onPress={() => openReportDetail(item)} />
                    {index < latestUpdates.length - 1 && (
                      <View className="h-px bg-[#1E3347]" />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-2">
                 <EmptyState
                  title="No recent activity"
                  subtitle="It's quiet around here. Be the first to report an issue!"
                  icon="time-outline"
                />
              </View>
            )}
          </View>
        </View>

        {/* ── 6. My Upvoted Reports ── */}
        <View className="px-5 mt-7">
          <SectionHeader title="My Community Upvotes" />
          <Pressable
            onPress={() => router.push('/upvoted-reports' as any)}
            className="active:opacity-80"
          >
            <View
              style={{
                backgroundColor: '#111E27',
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: '#1E3A44',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: '#0D2A35',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#4CC2D1',
                }}
              >
                <Ionicons name="arrow-up-circle" size={26} color="#4CC2D1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>My Upvoted Reports</Text>
                <Text style={{ color: '#5A7D8A', fontSize: 12, marginTop: 2 }}>
                  Reports you've supported in your community
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#4CC2D1', fontWeight: '800', fontSize: 20 }}>{upvotedCount}</Text>
                <Text style={{ color: '#5A7D8A', fontSize: 10 }}>upvoted</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#2D4F5C" />
            </View>
          </Pressable>
        </View>

      </ScrollView>

      <ReportDetailSheet
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </LinearGradient>
  );
}