import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuth, UserProfile } from '../config/authConfig';
import { toastConfig } from '../config/toastConfig';
import { db } from '../services/firebase';

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
  statusHistory?: Array<{ status: string; changedAt: any; changedBy: string; note?: string }>;
}

interface Comment {
  id: string;
  uid: string;
  body: string;
  upvoteCount: number;
  createdAt: any;
}

interface Props {
  reportId: string | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Pending', color: '#F59E0B', bg: '#3D2E0A', icon: 'time-outline' },
  ASSIGNED: { label: 'Assigned', color: '#60A5FA', bg: '#0D1A3D', icon: 'person-add-outline' },
  FIXING: { label: 'Fixing', color: '#4CC2D1', bg: '#0D2A35', icon: 'construct-outline' },
  RESOLVED: { label: 'Resolved', color: '#30A89C', bg: '#0D3D35', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Rejected', color: '#E05C5C', bg: '#3D1515', icon: 'close-circle-outline' },
};

const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

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
// Comment Card Sub-component
// ─────────────────────────────────────────────
function CommentCard({
  comment,
  currentUser,
  currentProfile,
}: {
  comment: Comment;
  currentUser: User | null;
  currentProfile: UserProfile | null;
}) {
  const isMe = currentUser && comment.uid === currentUser.uid;
  const displayName = isMe ? (currentProfile?.fullName || 'Me') : 'Community Member';
  const avatarUrl = isMe ? currentProfile?.avatarUrl : null;

  return (
    <View
      style={{
        backgroundColor: '#0D1F2D',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isMe ? '#4CC2D1' : '#1E3347',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isMe ? '#4CC2D1' : '#1E3A44',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: isMe ? '#071318' : '#4CC2D1', fontSize: 12, fontWeight: '700' }}>
                {isMe ? displayName.slice(0, 1).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: isMe ? 'white' : '#5A7D8A', fontSize: 11, fontWeight: '600' }}>
              {displayName} {isMe && <Text style={{ color: '#4CC2D1', fontSize: 10 }}>(You)</Text>}
            </Text>
            <Text style={{ color: '#3A5060', fontSize: 10, marginTop: 1 }}>{timeAgo(comment.createdAt)}</Text>
          </View>
        </View>
      </View>
      <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 19, marginTop: 8 }}>{comment.body}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ReportDetailSheet({ reportId, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [asOfTime, setAsOfTime] = useState('');

  // Upvote confirmation modal states
  const [upvoteModalType, setUpvoteModalType] = useState<'add' | 'remove' | null>(null);
  const [upvoteCommentText, setUpvoteCommentText] = useState('');

  // ── Subscribe to report + upvote status + comments ──
  useEffect(() => {
    if (!reportId) {
      setReport(null);
      setComments([]);
      setHasUpvoted(false);
      setLoading(true);
      setShowAllComments(false);
      setAsOfTime('');
      return;
    }

    setLoading(true);
    setActiveImageIndex(0);
    setShowAllComments(false);

    const unsubReport = onSnapshot(doc(db, 'reports', reportId), (snap) => {
      if (snap.exists()) {
        setReport({ id: snap.id, ...(snap.data() as Omit<Report, 'id'>) });
        // Format live asOf datetime
        const d = new Date();
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setAsOfTime(`As of ${dateStr} at ${timeStr}`);
      }
      setLoading(false);
    }, () => setLoading(false));

    let unsubUpvote = () => { };
    if (user?.uid) {
      unsubUpvote = onSnapshot(
        doc(db, 'reports', reportId, 'upvotes', user.uid),
        (snap) => setHasUpvoted(snap.exists()),
      );
    }

    const commentsQ = query(
      collection(db, 'reports', reportId, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    const unsubComments = onSnapshot(commentsQ, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) })));
    }, () => { });

    return () => { unsubReport(); unsubUpvote(); unsubComments(); };
  }, [reportId, user?.uid]);

  // ── Upvote press flow ──
  const handleUpvotePress = useCallback(() => {
    if (!user || !report || isUpvoting) return;
    if (hasUpvoted) {
      setUpvoteModalType('remove');
    } else {
      setUpvoteCommentText('');
      setUpvoteModalType('add');
    }
  }, [user, report, hasUpvoted, isUpvoting]);

  const performUpvote = async (shouldUpvote: boolean, commentText?: string) => {
    if (!user || !report) return;
    setIsUpvoting(true);
    setUpvoteModalType(null);
    try {
      const batch = writeBatch(db);
      const upvoteRef = doc(db, 'reports', report.id, 'upvotes', user.uid);
      const reportRef = doc(db, 'reports', report.id);

      if (!shouldUpvote) {
        batch.delete(upvoteRef);
        batch.update(reportRef, { upvoteCount: increment(-1) });
        await batch.commit();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: 'Upvote removed.',
          position: 'top',
          visibilityTime: 1800,
        });
      } else {
        batch.set(upvoteRef, { uid: user.uid, createdAt: new Date() });
        batch.update(reportRef, { upvoteCount: increment(1) });

        if (commentText && commentText.trim()) {
          const commentsRef = collection(db, 'reports', report.id, 'comments');
          const commentDocRef = doc(commentsRef);
          batch.set(commentDocRef, {
            uid: user.uid,
            body: commentText.trim(),
            upvoteCount: 0,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: commentText && commentText.trim() ? 'Upvoted and commented successfully!' : 'Upvoted successfully!',
          position: 'top',
          visibilityTime: 1800,
        });
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
    setIsUpvoting(false);
  };

  // ── Post comment ──
  const handlePostComment = useCallback(async () => {
    if (!user || !report || !newComment.trim() || isPostingComment) return;
    setIsPostingComment(true);
    try {
      await addDoc(collection(db, 'reports', report.id, 'comments'), {
        uid: user.uid,
        body: newComment.trim(),
        upvoteCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewComment('');

      // Give feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Comment posted successfully!',
        position: 'top',
        visibilityTime: 1800,
      });

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (err) {
      console.error('Comment post error:', err);
    }
    setIsPostingComment(false);
  }, [user, report, newComment, isPostingComment]);

  // ── Show on Map ──
  const handleShowOnMap = useCallback(() => {
    if (!report) return;
    onClose();
    setTimeout(() => {
      router.push(
        `/(tabs)/map?id=${report.id}&lat=${report.location.latitude}&lng=${report.location.longitude}` as any,
      );
    }, 350);
  }, [report, onClose, router]);

  // ── Open in Maps app ──
  const handleOpenInMaps = useCallback(() => {
    if (!report) return;
    const { latitude, longitude } = report.location;
    const encodedTitle = encodeURIComponent(report.title);
    const url = Platform.OS === 'ios'
      ? `maps:?ll=${latitude},${longitude}&q=${encodedTitle}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedTitle})`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
    });
  }, [report]);

  if (!reportId) return null;

  const cfg = report ? (STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING) : null;
  const timelineIndex = report ? TIMELINE_STATUSES.indexOf(report.status) : -1;
  const displayedComments = showAllComments ? comments : comments.slice(0, 5);

  return (
    <Modal
      visible={!!reportId}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#4CC2D1" size="large" />
              <Text style={{ color: '#5A7D8A', marginTop: 12, fontSize: 14 }}>Loading report…</Text>
            </View>
          ) : !report ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="alert-circle-outline" size={40} color="#E05C5C" />
              <Text style={{ color: '#E05C5C', marginTop: 10 }}>Report not found</Text>
              <Pressable onPress={onClose} style={{ marginTop: 16 }}>
                <Text style={{ color: '#4CC2D1', fontWeight: '600' }}>Go Back</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: 24 }}
                style={{ flex: 1 }}
              >
                {/* ── Header ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => ({
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: pressed ? '#1E3A44' : '#1E3347',
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    <Ionicons name="arrow-back" size={20} color="#4CC2D1" />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#4CC2D1', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
                      REF: {report.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                      Issue Details
                    </Text>
                  </View>
                  {cfg && (
                    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                      <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
                    </View>
                  )}
                </View>

                {/* ── Image Carousel ── */}
                {report.imageUrls?.length > 0 && (
                  <View style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 18, overflow: 'hidden', height: 200 }}>
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
                                  backgroundColor: i === activeImageIndex ? '#4CC2D1' : 'rgba(255,255,255,0.4)',
                                }}
                              />
                            </Pressable>
                          ))}
                        </View>
                        {activeImageIndex > 0 && (
                          <Pressable
                            onPress={() => setActiveImageIndex(activeImageIndex - 1)}
                            style={{ position: 'absolute', left: 10, top: '50%', marginTop: -16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 6 }}
                          >
                            <Ionicons name="chevron-back" size={20} color="white" />
                          </Pressable>
                        )}
                        {activeImageIndex < report.imageUrls.length - 1 && (
                          <Pressable
                            onPress={() => setActiveImageIndex(activeImageIndex + 1)}
                            style={{ position: 'absolute', right: 10, top: '50%', marginTop: -16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 6 }}
                          >
                            <Ionicons name="chevron-forward" size={20} color="white" />
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>
                )}

                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {/* ── Title Block ── */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: (report.categoryColor ?? '#4CC2D1') + '22',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name={report.categoryIcon as any} size={18} color={report.categoryColor ?? '#4CC2D1'} />
                      </View>
                      <View>
                        <Text style={{ color: '#5A7D8A', fontSize: 11, fontWeight: '600' }}>{report.category}</Text>
                        <Text style={{ color: '#3A5060', fontSize: 10 }}>{timeAgo(report.createdAt)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Upvote Count Badge */}
                  <View
                    style={{
                      minWidth: 46,
                      height: 46,
                      backgroundColor: '#0f93f226',
                      borderColor: '#4CC2D1',
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 15
                    }}
                  >
                    <Text style={{ color: '#4CC2D1', fontWeight: '600', fontSize: 15 }}>
                      Total Upvotes:  {report.upvoteCount}
                    </Text>
                  </View>

                  {/* ── Upvote Bar (Make whole button pressable + show as of date/time) ── */}
                  <Pressable
                    onPress={handleUpvotePress}
                    disabled={isUpvoting || !user}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: pressed ? '#007cc0' : '#0f93f2ff',
                      borderRadius: 16,
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderWidth: 1,
                      borderColor: '#1E3347',
                      gap: 12,
                    })}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: hasUpvoted ? '#045236ff' : '#0a8ac5ff',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      flex: 1,
                    }}>
                      {isUpvoting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name={hasUpvoted ? 'checkmark-circle' : 'arrow-up-circle-outline'}
                          size={28}
                          color={hasUpvoted ? '#34D399' : '#ffffffff'}
                        />
                      )}
                      <View style={{ flexShrink: 1, flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '400', fontSize: 15 }} numberOfLines={1}>
                          {hasUpvoted ? 'You have already upvoted this Issue!' : 'Upvote this Issue?'}
                        </Text>
                      </View>
                    </View>


                  </Pressable>

                  {/* ── Location ── */}
                  <View style={{
                    backgroundColor: '#111E27', borderRadius: 16, padding: 14,
                    borderWidth: 1, borderColor: '#1E3347',
                    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                  }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#1E3347', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="location-outline" size={18} color="#4CC2D1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#5A7D8A', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Location</Text>
                      <Text style={{ color: 'white', fontSize: 13, lineHeight: 18 }}>{report.location?.address ?? 'Unknown'}</Text>
                    </View>
                  </View>

                  {/* ── Description ── */}
                  <View style={{
                    backgroundColor: '#111E27', borderRadius: 16, padding: 14,
                    borderWidth: 1, borderColor: '#1E3347',
                  }}>
                    <Text style={{ color: '#5A7D8A', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Description</Text>
                    <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 20 }}>{report.description}</Text>
                  </View>

                  {/* ── Status Timeline ── */}
                  <View style={{
                    backgroundColor: '#111E27', borderRadius: 16, padding: 14,
                    borderWidth: 1, borderColor: '#1E3347',
                  }}>
                    <Text style={{ color: 'white', fontWeight: '700', marginBottom: 12 }}>Status Timeline</Text>
                    {report.status === 'REJECTED' ? (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: STATUS_CONFIG.PENDING.bg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Ionicons name={STATUS_CONFIG.PENDING.icon as any} size={14} color={STATUS_CONFIG.PENDING.color} />
                          </View>
                          <Text style={{ color: STATUS_CONFIG.PENDING.color, fontWeight: '600', fontSize: 13, flex: 1 }}>Pending</Text>
                          <Ionicons name="checkmark" size={14} color={STATUS_CONFIG.PENDING.color} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#3D1515', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Ionicons name="close-circle-outline" size={14} color="#E05C5C" />
                          </View>
                          <Text style={{ color: '#E05C5C', fontWeight: '600', fontSize: 13, flex: 1 }}>Rejected</Text>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E05C5C' }} />
                        </View>
                        {report.resolutionNote && (
                          <View style={{ marginTop: 10, backgroundColor: '#3D1515', borderRadius: 10, padding: 10 }}>
                            <Text style={{ color: '#E05C5C', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>REJECTION REASON</Text>
                            <Text style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 17 }}>{report.resolutionNote}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        {TIMELINE_STATUSES.map((s, i) => {
                          const sc = STATUS_CONFIG[s];
                          const done = timelineIndex >= i;
                          const isCurrent = report.status === s;
                          return (
                            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < TIMELINE_STATUSES.length - 1 ? 4 : 0 }}>
                              <View style={{ alignItems: 'center', marginRight: 10 }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: done ? sc.bg : '#1A2D3D', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name={sc.icon as any} size={14} color={done ? sc.color : '#2D4F5C'} />
                                </View>
                                {i < TIMELINE_STATUSES.length - 1 && (
                                  <View style={{ width: 2, height: 12, marginVertical: 2, backgroundColor: done ? sc.color + '50' : '#1E3347' }} />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: done ? sc.color : '#3A5060', fontWeight: '600', fontSize: 13 }}>{sc.label}</Text>
                                {isCurrent && <Text style={{ color: '#5A7D8A', fontSize: 11 }}>Current status</Text>}
                              </View>
                              {isCurrent && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc.color }} />}
                              {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                            </View>
                          );
                        })}
                        {report.resolutionNote && (
                          <View style={{ marginTop: 10, backgroundColor: '#0D3D35', borderRadius: 10, padding: 10 }}>
                            <Text style={{ color: '#30A89C', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>RESOLUTION NOTE</Text>
                            <Text style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 17 }}>{report.resolutionNote}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* ── Action Buttons ── */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between', // Pushes the two buttons to the far left and right
                      alignItems: 'center',
                      backgroundColor: '#111E27',
                      padding: 10,
                      borderRadius: 20,
                      width: '100%', // Ensures the container spans the full available width
                    }}
                  >
                    <Pressable
                      onPress={handleShowOnMap}
                      style={({ pressed }) => ({
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, paddingVertical: 14, borderRadius: 16,
                        backgroundColor: pressed ? '#1E3A44' : '#b5c3ceff',
                        borderWidth: 1, borderColor: '#2D4F5C',
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 }}>
                        <Ionicons name="map-outline" size={18} color="#4CC2D1" />
                        <Text style={{ color: '#4CC2D1', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                          Show on Map
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={handleOpenInMaps}
                      style={({ pressed }) => ({
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 8, paddingVertical: 14, borderRadius: 16,
                        backgroundColor: pressed ? '#3BAFBD' : '#4CC2D1',
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="navigate" size={18} color="#4CC2D1" />
                        <Text style={{ color: '#4CC2D1', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                          Open in Maps
                        </Text>
                      </View>
                    </Pressable>
                  </View>

                  {/* ── Community Comments ── */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                        Community Comments
                      </Text>
                      <View style={{ backgroundColor: '#1E3347', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ color: '#4CC2D1', fontSize: 11, fontWeight: '700' }}>{comments.length}</Text>
                      </View>
                    </View>

                    {comments.length === 0 ? (
                      <View style={{
                        backgroundColor: '#111E27', borderRadius: 16, padding: 20,
                        alignItems: 'center', borderWidth: 1, borderColor: '#1E3347',
                      }}>
                        <Ionicons name="chatbubble-outline" size={28} color="#1E3347" />
                        <Text style={{ color: '#3A5060', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                          No comments yet.{'\n'}Be the first to share your thoughts.
                        </Text>
                      </View>
                    ) : (
                      <>
                        {displayedComments.map((c) => (
                          <CommentCard
                            key={c.id}
                            comment={c}
                            currentUser={user}
                            currentProfile={profile}
                          />
                        ))}

                        {comments.length > 5 && (
                          <Pressable
                            onPress={() => setShowAllComments(!showAllComments)}
                            style={({ pressed }) => ({
                              alignItems: 'center',
                              paddingVertical: 12,
                              marginTop: 4,
                              backgroundColor: pressed ? '#1E3347' : '#111E27',
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#1E3347',
                            })}
                          >
                            <Text style={{ color: '#4CC2D1', fontWeight: '700', fontSize: 13 }}>
                              {showAllComments ? 'Show Less' : `View All (${comments.length}) Comments`}
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* ── Comment Input (fixed above keyboard via flex layout) ── */}
              <View style={{
                paddingBottom: Math.max(insets.bottom, 16),
                paddingTop: 12, paddingHorizontal: 16,
                backgroundColor: '#0A1820',
                borderTopWidth: 1, borderTopColor: '#1E3347',
              }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: '#111E27', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: 1, borderColor: '#4CC2D1',
                }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E3A44', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {profile?.avatarUrl ? (
                      <Image source={{ uri: profile.avatarUrl }} style={{ width: 28, height: 28 }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="person-outline" size={14} color="#4CC2D1" />
                    )}
                  </View>
                  <TextInput
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a community comment…"
                    placeholderTextColor="#5A7D8A"
                    multiline
                    maxLength={280}
                    style={{
                      flex: 1, color: 'white', fontSize: 14,
                      maxHeight: 80,
                      paddingTop: Platform.OS === 'ios' ? 4 : 0,
                      paddingBottom: Platform.OS === 'ios' ? 4 : 0,
                    }}
                  />
                  <Pressable
                    onPress={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    style={({ pressed }) => ({
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: newComment.trim() ? (pressed ? '#3BAFBD' : '#4CC2D1') : '#e8e8e8ff',
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    {isPostingComment ? (
                      <ActivityIndicator size="small" color="#ffffffff" />
                    ) : (
                      <Ionicons name="send" size={16} color={newComment.trim() ? '#ffffffff' : '#2D4F5C'} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ── Upvote/Retract Confirmation Dialog Modal ── */}
      <Modal
        visible={upvoteModalType !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUpvoteModalType(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: '#0A1820',
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: upvoteModalType === 'remove' ? '#E05C5C44' : '#0f93f2ff44',
            padding: 22,
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          }}>
            {upvoteModalType === 'add' ? (
              <>
                {/* Header with Close Icon */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f93f2ff22', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="arrow-up-circle" size={20} color="#0f93f2ff" />
                    </View>
                    <Text style={{ color: 'white', fontSize: 17, fontWeight: '800' }}>Upvote this issue?</Text>
                  </View>
                  <Pressable onPress={() => setUpvoteModalType(null)}>
                    <Ionicons name="close" size={24} color="#5A7D8A" />
                  </Pressable>
                </View>

                <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 19 }}>
                  Show support for this report to help prioritize it. You can optionally add a community comment too.
                </Text>

                {/* Optional Comment Input */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#5A7D8A', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Optional comment
                  </Text>
                  <View style={{
                    backgroundColor: '#111E27',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#1E3347',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}>
                    <TextInput
                      value={upvoteCommentText}
                      onChangeText={setUpvoteCommentText}
                      placeholder="Share details, updates, or words of support…"
                      placeholderTextColor="#3A5060"
                      multiline
                      maxLength={140}
                      style={{
                        color: 'white',
                        fontSize: 13,
                        height: 56,
                        textAlignVertical: 'top',
                      }}
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {upvoteCommentText.trim().length > 0 ? (
                    <Pressable
                      onPress={() => performUpvote(true, upvoteCommentText)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? '#007cc0' : '#0f93f2ff',
                        borderRadius: 14,
                        paddingVertical: 13,
                        alignItems: 'center',
                      })}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        Upvote & Comment
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => performUpvote(true)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? '#007cc0' : '#0f93f2ff',
                        borderRadius: 14,
                        paddingVertical: 13,
                        alignItems: 'center',
                      })}
                    >
                      <Text style={{ color: '#2ab001ff', fontWeight: '800', fontSize: 14 }}>
                        Just Upvote
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setUpvoteModalType(null)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: 14,
                      paddingVertical: 10,
                      alignItems: 'center',
                    })}
                  >
                    <Text style={{ color: '#ad1111ff', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {/* Retract Upvote dialog */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#E05C5C22', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="alert-circle" size={20} color="#E05C5C" />
                    </View>
                    <Text style={{ color: 'white', fontSize: 17, fontWeight: '800' }}>Retract your upvote?</Text>
                  </View>
                  <Pressable onPress={() => setUpvoteModalType(null)}>
                    <Ionicons name="close" size={24} color="#5A7D8A" />
                  </Pressable>
                </View>

                <Text style={{ color: '#CBD5E1', fontSize: 13, lineHeight: 19 }}>
                  Are you sure you want to remove your upvote? Your support will be retracted from this incident.
                </Text>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <Pressable
                    onPress={() => performUpvote(false)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#b83b3b' : '#E05C5C',
                      borderRadius: 14,
                      paddingVertical: 13,
                      alignItems: 'center',
                    })}
                  >
                    <Text style={{ color: '#c11212ff', fontWeight: '800', fontSize: 14 }}>
                      Yes, Remove Upvote
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setUpvoteModalType(null)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderRadius: 14,
                      paddingVertical: 10,
                      alignItems: 'center',
                    })}
                  >
                    <Text style={{ color: '#2ab001ff', fontWeight: '600', fontSize: 13 }}>
                      Keep My Upvote
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Mounting Toast component inside the Modal so it overlays native modals */}
      <Toast config={toastConfig} />
    </Modal>
  );
}
