import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'road_traffic',      label: 'Road & Traffic',     icon: 'car-outline',          color: '#4CC2D1', bg: '#0D2A35', examples: 'Potholes, signals, noise' },
  { id: 'water_drainage',    label: 'Water & Drainage',   icon: 'water-outline',         color: '#60A5FA', bg: '#0D1A3D', examples: 'Leaks, floods, pipes' },
  { id: 'waste_environment', label: 'Waste & Env.',       icon: 'trash-outline',         color: '#34D399', bg: '#0D3D25', examples: 'Litter, illegal dumping' },
  { id: 'social_safety',     label: 'Social Safety',      icon: 'shield-outline',        color: '#A78BFA', bg: '#2D1F4A', examples: 'Lighting, vandalism' },
  { id: 'bridge_structural', label: 'Bridge & Structural',icon: 'git-network-outline',   color: '#F59E0B', bg: '#3D2E0A', examples: 'Damaged bridges, public buildings', wide: true },
] as const;

type Category = typeof CATEGORIES[number];

const DARK_MAP_STYLE = [
  { elementType: 'geometry',                                 stylers: [{ color: '#0d1f2d' }] },
  { elementType: 'labels.text.fill',                         stylers: [{ color: '#4CC2D1' }] },
  { elementType: 'labels.text.stroke',                       stylers: [{ color: '#0a1820' }] },
  { featureType: 'road',        elementType: 'geometry',     stylers: [{ color: '#1E3A44' }] },
  { featureType: 'road',        elementType: 'geometry.stroke', stylers: [{ color: '#071318' }] },
  { featureType: 'water',       elementType: 'geometry',     stylers: [{ color: '#071318' }] },
  { featureType: 'poi',         elementType: 'geometry',     stylers: [{ color: '#0a1820' }] },
  { featureType: 'transit',     elementType: 'geometry',     stylers: [{ color: '#1E3A44' }] },
  { featureType: 'administrative', elementType: 'geometry',  stylers: [{ color: '#1E3A44' }] },
];

const DEFAULT_COORDS = { latitude: 6.8900, longitude: 79.8950 };

// ─────────────────────────────────────────────
// Category Picker Modal
// ─────────────────────────────────────────────
function CategoryModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-2 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Select Category</Text>
          </View>

          <View className="px-5 mt-4 mb-6">
            <Text className="text-white text-xl font-bold mb-1">What type of issue?</Text>
            <Text className="text-gray-400 text-sm leading-5">
              Choose the category that best describes the public concern.
            </Text>
          </View>

          <View className="px-5 flex-row flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => { onSelect(cat); onClose(); }}
                className="active:opacity-80"
                style={{ width: (cat as any).wide ? '100%' : '47%' }}
              >
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#111E27', borderWidth: 1, borderColor: '#1E3347' }}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: cat.bg }}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text className="text-white font-bold text-sm mb-1">{cat.label}</Text>
                  <Text className="text-gray-500 text-xs leading-4">{cat.examples}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View className="mx-5 mt-4 p-4 rounded-2xl flex-row gap-3"
            style={{ backgroundColor: '#1A2D1A', borderWidth: 1, borderColor: '#1E4D1E' }}>
            <Ionicons name="information-circle-outline" size={20} color="#34D399" />
            <Text className="text-gray-400 text-xs flex-1 leading-5">
              <Text className="text-[#34D399] font-semibold">Emergency?</Text> Please call local emergency
              services immediately. This portal is for non-urgent infrastructure reporting.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────
function SuccessScreen({
  refId,
  category,
  locationAddress,
  onDashboard,
  onMyReports,
}: {
  refId: string;
  category: string;
  locationAddress: string;
  onDashboard: () => void;
  onMyReports: () => void;
}) {
  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8">
          <View
            className="w-36 h-36 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#0D2A35',
              borderWidth: 3,
              borderColor: '#4CC2D1',
              shadowColor: '#4CC2D1',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <Ionicons name="shield-checkmark" size={72} color="#4CC2D1" />
          </View>
        </View>

        <Text className="text-white text-2xl font-bold text-center mb-3">
          Report Submitted{'\n'}Successfully!
        </Text>
        <Text className="text-gray-400 text-sm text-center leading-6 mb-2">
          Your report has been received and is being{'\n'}reviewed by our safety team.
        </Text>
        <Text className="text-[#4CC2D1] font-bold mb-8">Ref ID: {refId.slice(0, 8).toUpperCase()}</Text>

        <View className="w-full bg-[#111E27] rounded-2xl p-4 mb-8"
          style={{ borderWidth: 1, borderColor: '#1E3347' }}>
          <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Reference Details</Text>
          <Text className="text-white text-sm"><Text className="text-gray-400">Type: </Text>{category}</Text>
          <Text className="text-white text-sm mt-1 leading-5">
            <Text className="text-gray-400">Location: </Text>{locationAddress}
          </Text>
        </View>

        <Pressable
          onPress={onDashboard}
          className="w-full bg-[#4CC2D1] py-4 rounded-2xl items-center mb-3 active:opacity-80"
        >
          <Text className="text-[#071318] font-bold text-base">Back to Dashboard</Text>
        </Pressable>
        <Pressable
          onPress={onMyReports}
          className="w-full py-4 rounded-2xl items-center active:opacity-70"
          style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
        >
          <Text className="text-gray-300 font-semibold text-base">Track My Report</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Main Report Screen
// ─────────────────────────────────────────────
export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const mapRef = useRef<MapView>(null);

  // ── Location state ──
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locationAddress, setLocationAddress] = useState('Fetching location…');
  const [gpsGranted, setGpsGranted] = useState(false);
  const [locLoading, setLocLoading] = useState(true);

  // ── Form state ──
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Submission result ──
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);

  // ── Reverse geocode coords → readable address ──
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city, r.region].filter(Boolean);
        setLocationAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setLocationAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }, []);

  // ── Request permission + fetch initial location on mount ──
  useEffect(() => {
    (async () => {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationAddress('Location permission denied');
        setLocLoading(false);
        return;
      }
      setGpsGranted(true);
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = loc.coords;
        setCoords({ latitude, longitude });
        await reverseGeocode(latitude, longitude);
        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
          600,
        );
      } catch {
        setLocationAddress('Could not fetch location');
      } finally {
        setLocLoading(false);
      }
    })();
  }, [reverseGeocode]);

  // ── When marker is dragged to a new position ──
  const handleMarkerDragEnd = useCallback(
    async (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setCoords({ latitude, longitude });
      setLocationAddress('Updating address…');
      await reverseGeocode(latitude, longitude);
    },
    [reverseGeocode],
  );

  // ── Recenter to device GPS ──
  const recenter = useCallback(async () => {
    if (!gpsGranted) return;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        600,
      );
      await reverseGeocode(latitude, longitude);
    } catch {
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get current position.' });
    }
  }, [gpsGranted, reverseGeocode]);

  // ── Submit to Firestore ──
  const handleSubmit = async () => {
    if (!selectedCategory || description.trim().length < 10) return;
    if (!user || !profile) {
      Toast.show({ type: 'error', text1: 'Not logged in', text2: 'Please log in to submit a report.' });
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'reports'), {
        uid: user.uid,
        authorName: profile.fullName,
        title: selectedCategory.label,
        category: selectedCategory.label,
        categoryId: selectedCategory.id,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        description: description.trim(),
        location: {
          address: locationAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
          area: locationAddress.split(',').slice(-2).join(',').trim(),
        },
        imageUrls: [],
        videoUrl: null,
        status: 'PENDING',
        assignedTo: null,
        resolutionNote: null,
        upvoteCount: 0,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [
          {
            status: 'PENDING',
            changedAt: new Date().toISOString(),
            changedBy: 'system',
          },
        ],
      });

      // Increment user's contribution points
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          contributionPoints: increment(10),
        });
      } catch {
        // Non-critical — don't fail the submission
      }

      setSubmittedRefId(docRef.id);
    } catch (e: any) {
      console.error('❌ Report submission error:', e);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not save your report. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset form ──
  const resetForm = () => {
    setSubmittedRefId(null);
    setSelectedCategory(null);
    setDescription('');
  };

  // ── Show success screen ──
  if (submittedRefId) {
    return (
      <SuccessScreen
        refId={submittedRefId}
        category={selectedCategory?.label ?? ''}
        locationAddress={locationAddress}
        onDashboard={() => { resetForm(); router.replace('/(tabs)/home'); }}
        onMyReports={() => { resetForm(); router.replace('/(tabs)/history'); }}
      />
    );
  }

  const canSubmit = !!selectedCategory && description.trim().length > 10;

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* ── Header ── */}
          <View className="px-5 mb-5">
            <Text className="text-white text-2xl font-bold">New Report</Text>
            <Text className="text-gray-400 text-sm mt-1">Help make your community safer</Text>
          </View>

          {/* ── 1. Location ── */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-bold text-base">Pin Your Location</Text>
              <View className="flex-row items-center gap-1.5">
                {locLoading ? (
                  <ActivityIndicator size="small" color="#30A89C" />
                ) : (
                  <>
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gpsGranted ? '#30A89C' : '#E05C5C' }} />
                    <Text className="text-xs font-semibold" style={{ color: gpsGranted ? '#30A89C' : '#E05C5C' }}>
                      {gpsGranted ? 'GPS Active' : 'GPS Off'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* ── Interactive MapView with draggable marker ── */}
            <View className="rounded-2xl overflow-hidden mb-3" style={{ height: 200, borderWidth: 1, borderColor: '#1E3347' }}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                customMapStyle={DARK_MAP_STYLE}
                showsUserLocation={gpsGranted}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={coords}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                  pinColor="#4CC2D1"
                />
              </MapView>

              {/* Recenter button overlay */}
              <Pressable
                onPress={recenter}
                style={{
                  position: 'absolute', bottom: 10, right: 10,
                  backgroundColor: '#4CC2D1', borderRadius: 8,
                  padding: 8, alignItems: 'center', justifyContent: 'center',
                }}
                className="active:opacity-80"
              >
                <Ionicons name="navigate" size={16} color="#071318" />
              </Pressable>
            </View>

            {/* Drag hint */}
            <Text className="text-gray-600 text-xs text-center mb-2">
              Hold and drag the pin to adjust the exact location
            </Text>

            {/* Address bar */}
            <View className="flex-row items-center gap-2 bg-[#111E27] rounded-xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Ionicons name="location" size={16} color="#4CC2D1" />
              <Text className="text-gray-300 text-sm flex-1" numberOfLines={2}>{locationAddress}</Text>
            </View>
          </View>

          {/* ── 2. Category ── */}
          <View className="px-5 mb-5">
            <Text className="text-white font-bold text-base mb-3">Category</Text>
            <Pressable onPress={() => setCategoryModalVisible(true)} className="active:opacity-80">
              <View
                className="flex-row items-center justify-between bg-[#111E27] rounded-2xl px-4 py-4"
                style={{ borderWidth: 1, borderColor: selectedCategory ? '#4CC2D1' : '#1E3347' }}
              >
                {selectedCategory ? (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: selectedCategory.bg }}>
                      <Ionicons name={selectedCategory.icon as any} size={18} color={selectedCategory.color} />
                    </View>
                    <Text className="text-white font-semibold">{selectedCategory.label}</Text>
                  </View>
                ) : (
                  <Text className="text-gray-500">Select Category</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color="#3A6070" />
              </View>
            </Pressable>
          </View>

          {/* ── 3. Description ── */}
          <View className="px-5 mb-6">
            <Text className="text-white font-bold text-base mb-3">Description</Text>
            <View
              className="bg-[#111E27] rounded-2xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: '#1E3347', minHeight: 120 }}
            >
              <TextInput
                placeholder="Describe the issue in detail…"
                placeholderTextColor="#2A4A5A"
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, 500))}
                multiline
                textAlignVertical="top"
                style={{ color: 'white', fontSize: 14, lineHeight: 22, minHeight: 100 }}
              />
            </View>
            <Text className="text-gray-600 text-xs mt-2 text-right">{description.length}/500</Text>
          </View>

          {/* ── Submit ── */}
          <View className="px-5">
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: canSubmit ? '#4CC2D1' : '#1E3347' }}
            >
              {loading ? (
                <ActivityIndicator color="#071318" />
              ) : (
                <Text className="font-bold text-base" style={{ color: canSubmit ? '#071318' : '#3A6070' }}>
                  Submit Report
                </Text>
              )}
            </Pressable>
            {!canSubmit && (
              <Text className="text-gray-600 text-xs text-center mt-2">
                Select a category and add a description to continue
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryModal
        visible={categoryModalVisible}
        onSelect={setSelectedCategory}
        onClose={() => setCategoryModalVisible(false)}
      />
    </LinearGradient>
  );
}