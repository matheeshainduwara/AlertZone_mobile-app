import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../config/authConfig';
import { AppNotification, NotificationType } from '../types/notification';

// ─────────────────────────────────────────────
// UI Constants & Meta
// ─────────────────────────────────────────────
const TYPE_META: Record<
  NotificationType,
  { color: string; bg: string; icon: string }
> = {
  status_change: { color: '#4CC2D1', bg: 'rgba(76, 194, 209, 0.1)', icon: 'construct' },
  upvote: { color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.1)', icon: 'arrow-up-circle' },
  badge_earned: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: 'trophy' },
  system: { color: '#E05C5C', bg: 'rgba(224, 92, 92, 0.1)', icon: 'alert-circle' },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const timeAgo = (createdAt: any) => {
  if (!createdAt) return 'Recently';
  let date: Date;
  if (typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    date = new Date(createdAt);
  }

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 0) return 'Just now'; // prevent negative timing due to clock drift
  
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

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  // 1. Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            recipientUid: data.recipientUid,
            type: data.type,
            title: data.title ?? 'AlertZone Notification',
            body: data.body ?? '',
            reportId: data.reportId,
            data: data.data,
            isRead: data.isRead ?? false,
            createdAt: data.createdAt,
          } as AppNotification;
        });

        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error listening to notifications:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Actions
  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error('❌ Error marking notification as read:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error('❌ Error deleting notification:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('❌ Error marking all as read:', e);
    }
  };

  const handleNotificationPress = (item: AppNotification) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }

    if (item.reportId) {
      const lat = item.data?.latitude || item.data?.reportLocation?.latitude;
      const lng = item.data?.longitude || item.data?.reportLocation?.longitude;

      if (lat && lng) {
        router.push({
          pathname: '/(tabs)/map',
          params: {
            id: item.reportId,
            lat: String(lat),
            lng: String(lng),
          },
        });
      } else {
        router.push({
          pathname: '/(tabs)/map',
          params: { id: item.reportId },
        });
      }
    }
  };

  // Filter list
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'all') return true;
    return notif.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#1E3347',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-[#1E3A44] items-center justify-center border border-[#2D4F5C] active:opacity-75">
            <Ionicons name="arrow-back" size={20} color="#4CC2D1" />
          </Pressable>
          <View>
            <Text className="text-white text-lg font-bold">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-[#4CC2D1] text-xs font-semibold">{unreadCount} unread messages</Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllAsRead}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A44] border border-[#2D4F5C] active:opacity-75"
          >
            <Ionicons name="checkmark-done" size={16} color="#4CC2D1" />
            <Text className="text-[#4CC2D1] text-xs font-bold">Read All</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="px-5 py-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'all', label: 'All' },
            { id: 'status_change', label: 'Reports' },
            { id: 'upvote', label: 'Upvotes' },
            { id: 'badge_earned', label: 'Rewards' },
            { id: 'system', label: 'System' },
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.id as any)}
                className="mr-2 active:opacity-80"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: isActive ? '#1E3A44' : '#111E27',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? '#4CC2D1' : '#1E3347',
                }}
              >
                <Text
                  style={{
                    color: isActive ? '#4CC2D1' : '#5A7D8A',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4CC2D1" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-16 h-16 rounded-full bg-[#1E3A44] items-center justify-center mb-4 border border-[#2D4F5C]">
            <Ionicons name="notifications-off-outline" size={28} color="#4CC2D1" />
          </View>
          <Text className="text-white text-base font-bold mb-1">All caught up!</Text>
          <Text className="text-gray-500 text-xs text-center leading-5">
            You don't have any notifications under this filter at the moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || TYPE_META.system;
            return (
              <Pressable
                onPress={() => handleNotificationPress(item)}
                className="mb-3 rounded-2xl bg-[#111E27] border border-[#1E3347] active:opacity-90 overflow-hidden relative"
                style={{
                  borderLeftWidth: item.isRead ? 1 : 4,
                  borderLeftColor: item.isRead ? '#1E3347' : meta.color,
                }}
              >
                {/* Glow/Dot indicator */}
                {!item.isRead && (
                  <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#E05C5C]" />
                )}

                <View className="p-4 flex-row items-start gap-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                  </View>

                  <View className="flex-1 pr-4">
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1 leading-5">
                      {item.body}
                    </Text>
                    <Text className="text-gray-500 text-[10px] mt-2 font-medium">
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Actions Panel */}
                <View className="px-4 py-2 border-t border-[#1E3347] flex-row justify-end items-center gap-3 bg-[#0D1F2D]/30">
                  {item.reportId && (
                    <Pressable
                      onPress={() => handleNotificationPress(item)}
                      className="flex-row items-center gap-1 py-1 px-2.5 rounded bg-[#1E3A44]/50 border border-[#2D4F5C]/50 active:opacity-75"
                    >
                      <Ionicons name="map-outline" size={12} color="#4CC2D1" />
                      <Text className="text-[#4CC2D1] text-[10px] font-bold">View on Map</Text>
                    </Pressable>
                  )}
                  
                  {!item.isRead && (
                    <Pressable
                      onPress={() => handleMarkAsRead(item.id)}
                      className="flex-row items-center gap-1 py-1 px-2.5 rounded bg-[#1A302B] border border-[#2D5A4E]/50 active:opacity-75"
                    >
                      <Ionicons name="checkmark" size={12} color="#30A89C" />
                      <Text className="text-[#30A89C] text-[10px] font-bold">Mark Read</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    className="flex-row items-center gap-1 py-1 px-2.5 rounded bg-[#2D1F20] border border-[#5A2D30]/50 active:opacity-75"
                  >
                    <Ionicons name="trash-outline" size={12} color="#E05C5C" />
                    <Text className="text-[#E05C5C] text-[10px] font-bold">Delete</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </LinearGradient>
  );
}
