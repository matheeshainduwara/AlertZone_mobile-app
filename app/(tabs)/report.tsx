import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../config/themeContext';
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
  Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';
import { compressImage, isUnderSizeLimit, uploadFile } from '../../services/storage.service';
import BlurLoadingOverlay from '../../components/BlurLoadingOverlay';
import PhotoSourceModal from '../../components/PhotoSourceModal';
import { resolveSrilankaRegion, PROVINCE_CODES, DISTRICT_CODES } from '../../config/sriLankaRegions';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'road_traffic',      label: 'Road & Traffic',     icon: 'car-outline',          color: '#0D8A72', bg: '#E6F7F3', examples: 'Potholes, signals, noise' },
  { id: 'water_drainage',    label: 'Water & Drainage',   icon: 'water-outline',         color: '#3B82F6', bg: '#E0F2FE', examples: 'Leaks, floods, pipes' },
  { id: 'waste_environment', label: 'Waste & Environment',       icon: 'trash-outline',         color: '#059669', bg: '#DCFCE7', examples: 'Litter, illegal dumping' },
  { id: 'social_safety',     label: 'Social Safety',      icon: 'shield-outline',        color: '#7C3AED', bg: '#F3E8FF', examples: 'Lighting, vandalism' },
  { id: 'bridge_structural', label: 'Bridge & Structural',icon: 'git-network-outline',   color: '#D97706', bg: '#FEF3C7', examples: 'Damaged bridges, public buildings' },
  { id: 'other',             label: 'Other',              icon: 'help-circle-outline',   color: '#6B7280', bg: '#F1F5F9', examples: 'Any other infrastructure issue', wide: true },
] as const;

type Category = typeof CATEGORIES[number];

import { DARK_MAP_STYLE } from '../../config/mapStyle';


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
  const { colors } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-2 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70 p-2">
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>Select Category</Text>
          </View>

          <View className="px-5 mt-4 mb-6">
            <Text className="text-xl font-bold mb-1" style={{ color: colors.text }}>What type of issue?</Text>
            <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
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
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: cat.bg }}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text className="font-bold text-sm mb-1" style={{ color: colors.text }}>{cat.label}</Text>
                  <Text className="text-xs leading-4" style={{ color: colors.textSecondary }}>{cat.examples}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View className="mx-5 mt-4 p-4 rounded-2xl flex-row gap-3"
            style={{ backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.successText} />
            <Text className="text-xs flex-1 leading-5" style={{ color: colors.textSecondary }}>
              <Text className="font-semibold" style={{ color: colors.successText }}>Emergency?</Text> Please call local emergency
              services immediately. This portal is for non-urgent infrastructure reporting.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Full Screen Map Modal
// ─────────────────────────────────────────────
function FullScreenMapModal({
  visible,
  onClose,
  coords,
  onCoordsChange,
  locationAddress,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  suggestions,
  onSelectSuggestion,
  isSuggesting,
}: {
  visible: boolean;
  onClose: () => void;
  coords: typeof DEFAULT_COORDS;
  onCoordsChange: (coords: typeof DEFAULT_COORDS) => void;
  locationAddress: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  suggestions: any[];
  onSelectSuggestion: (feat: any) => void;
  isSuggesting: boolean;
}) {
  const { colors, isDark } = useTheme();
  const fullMapRef = useRef<MapView>(null);

  // Smoothly animate map when coordinates change
  useEffect(() => {
    if (visible && coords) {
      fullMapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        400
      );
    }
  }, [coords, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <MapView
          ref={fullMapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            ...coords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onLongPress={(e) => onCoordsChange(e.nativeEvent.coordinate)}
          customMapStyle={isDark ? DARK_MAP_STYLE : []}
        >
          <Marker
            coordinate={coords}
            draggable
            onDragEnd={(e) => onCoordsChange(e.nativeEvent.coordinate)}
            pinColor="#c50000a7"
          />
        </MapView>

        {/* Floating Search Bar */}
        <View style={{ position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 }}>
          <View className="flex-row gap-2 mb-2">
            <Pressable onPress={onClose} className="p-3 rounded-xl active:opacity-70 shadow-lg border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <View className="flex-1 rounded-xl px-4 flex-row items-center border shadow-lg" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                placeholder="Search location..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={onSearchSubmit}
                className="flex-1 text-sm ml-2 py-2.5"
                style={{ color: colors.text }}
              />
              {isSuggesting && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <View className="rounded-xl overflow-hidden border shadow-2xl" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              {suggestions.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => onSelectSuggestion(item)}
                  className="flex-row items-center p-3 active:opacity-70 border-b"
                  style={{ borderColor: colors.border }}
                >
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>{item.properties.name}</Text>
                    <Text className="text-[10px]" style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {[item.properties.city, item.properties.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20 }}>
          <View className="p-4 rounded-2xl border shadow-xl" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Text className="font-bold mb-1" style={{ color: colors.text }}>Adjust Location</Text>
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.primary }} numberOfLines={1}>
              <Ionicons name="location" size={12} /> {locationAddress}
            </Text>
            <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Hold/long-press anywhere on the map to drop the pin there.
            </Text>
            <Pressable
              onPress={onClose}
              className="py-3 rounded-xl items-center active:opacity-80"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-bold">Confirm Position</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8">
          <View
            className="w-36 h-36 rounded-full items-center justify-center"
            style={{
              backgroundColor: colors.primary + '15',
              borderWidth: 3,
              borderColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Ionicons name="shield-checkmark" size={72} color={colors.primary} />
          </View>
        </View>

        <Text className="text-2xl font-bold text-center mb-3" style={{ color: colors.text }}>
          Report Submitted{'\n'}Successfully!
        </Text>
        <Text className="text-sm text-center leading-6 mb-2" style={{ color: colors.textSecondary }}>
          Your report has been received and is being{'\n'}reviewed by our safety team.
        </Text>
        <Text className="font-bold mb-8" style={{ color: colors.primary }}>Ref ID: {refId}</Text>

        <View className="w-full rounded-2xl p-4 mb-8"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-[10px] uppercase font-bold tracking-wide mb-2" style={{ color: colors.textSecondary }}>Reference Details</Text>
          <Text className="text-sm" style={{ color: colors.text }}><Text style={{ color: colors.textSecondary }}>Type: </Text>{category}</Text>
          <Text className="text-sm mt-1 leading-5" style={{ color: colors.text }}>
            <Text style={{ color: colors.textSecondary }}>Location: </Text>{locationAddress}
          </Text>
        </View>

        <Pressable
          onPress={onDashboard}
          className="w-full py-4 rounded-2xl items-center mb-3 active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold text-base">Back to Dashboard</Text>
        </Pressable>
        <Pressable
          onPress={onMyReports}
          className="w-full py-4 rounded-2xl items-center active:opacity-70"
          style={{ borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card }}
        >
          <Text className="font-semibold text-base" style={{ color: colors.primary }}>Track My Report</Text>
        </Pressable>
      </View>
    </View>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [fullMapVisible, setFullMapVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [resolvedProvince, setResolvedProvince] = useState('Unknown Province');
  const [resolvedDistrict, setResolvedDistrict] = useState('Unknown District');
  const [resolvedLGA, setResolvedLGA] = useState('Unknown Area');

  // ── Fetch suggestions (Photon API) ──
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error('❌ Suggestion error:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectSuggestion = async (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name || '';
    const city = feature.properties.city || '';
    const street = feature.properties.street || '';
    const fullAddress = [name, street, city].filter(Boolean).join(', ');
    
    const newCoords = { latitude: lat, longitude: lng };
    setCoords(newCoords);
    setSearchQuery(fullAddress);
    setSuggestions([]);
    
    mapRef.current?.animateToRegion(
      { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      600
    );
    await reverseGeocode(lat, lng);
  };

  // ── Form state ──
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadStatusText, setUploadStatusText] = useState('Submitting Report');
  const [photoSourceModalVisible, setPhotoSourceModalVisible] = useState(false);

  // ── Submission result ──
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);

  const [currentCountry, setCurrentCountry] = useState<string | null>(null);

  // ── Reverse geocode coords → readable address ──
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        setCurrentCountry(r.country);
        const parts = [r.name, r.street, r.city, r.region].filter(Boolean);
        const fullAddress = parts.join(', ');
        setLocationAddress(fullAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        
        // Resolve Sri Lankan region details using r, fullAddress, and coordinates
        const resolved = resolveSrilankaRegion(r, fullAddress, lat, lng);
        setResolvedProvince(resolved.province);
        setResolvedDistrict(resolved.district);
        setResolvedLGA(resolved.localGovernmentArea);

        // Immediate warning if not in SL
        if (r.country && r.country !== 'Sri Lanka') {
           Toast.show({
            type: 'error',
            text1: 'Outside Coverage',
            text2: 'AlertZone only supports reports within Sri Lanka.',
            visibilityTime: 5000,
          });
        }
      }
    } catch (e) {
      console.error('❌ Reverse geocode error:', e);
      setLocationAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setResolvedProvince('Unknown Province');
      setResolvedDistrict('Unknown District');
      setResolvedLGA('Unknown Area');
    }
  }, []);

  // ── Search location ──
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setLocLoading(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newCoords = { latitude, longitude };
        setCoords(newCoords);
        mapRef.current?.animateToRegion(
          { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
          600,
        );
        await reverseGeocode(latitude, longitude);
      } else {
        Toast.show({ type: 'info', text1: 'Location not found', text2: 'Try a different search term.' });
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      Toast.show({ type: 'error', text1: 'Search Error', text2: 'Could not search location.' });
    } finally {
      setLocLoading(false);
    }
  };

  // ── Request permission + fetch initial location on mount ──
  useEffect(() => {
    (async () => {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (status !== 'granted' || !servicesEnabled) {
        setLocationAddress(status !== 'granted' ? 'Location permission denied' : 'Location services disabled');
        setGpsGranted(false);
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

  // ── When marker is dragged or dropped to a new position ──
  const handleMarkerDragEnd = useCallback(
    async (coordinate: { latitude: number; longitude: number }) => {
      const { latitude, longitude } = coordinate;
      setCoords({ latitude, longitude });
      setLocationAddress('Updating address…');
      
      // Smoothly animate map to new location
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        450
      );

      await reverseGeocode(latitude, longitude);
    },
    [reverseGeocode],
  );

  // ── Recenter to device GPS ──
  const recenter = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (status !== 'granted' || !servicesEnabled) {
      setGpsGranted(false);
      Toast.show({
        type: 'info',
        text1: status !== 'granted' ? 'Permission Denied' : 'GPS Inactive',
        text2: status !== 'granted' ? 'Location permission is required.' : 'Please enable location services on your device.',
      });
      return;
    }
    setGpsGranted(true);
    try {
      setLocLoading(true);
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
    } finally {
      setLocLoading(false);
    }
  }, [reverseGeocode]);

  // ── Image picking ──
  const handleCameraLaunch = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Camera access is required to take a photo.',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processPickedImages(result.assets.map(a => a.uri));
      }
    } catch (e) {
      console.error('Camera launch error:', e);
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: 'Could not open camera.',
      });
    }
  };

  const handleGalleryLaunch = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processPickedImages(result.assets.map(a => a.uri));
      }
    } catch (e) {
      console.error('Gallery launch error:', e);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Could not open gallery.',
      });
    }
  };

  const processPickedImages = async (selectedUris: string[]) => {
    const processedUris: string[] = [];

    for (const uri of selectedUris) {
      let currentUri = uri;
      // Allow up to 5MB before compression
      const isUnderLimit = await isUnderSizeLimit(currentUri, 5);

      if (!isUnderLimit) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: 'Maximum photo size allowed is 5MB.',
        });
        continue;
      }

      // Always compress to target ≤2MB
      console.log('📦 Compressing image:', currentUri);
      currentUri = await compressImage(currentUri);
      processedUris.push(currentUri);
    }

    setImages([...images, ...processedUris].slice(0, 3));
  };

  const pickImages = () => {
    if (images.length >= 3) {
      Toast.show({ type: 'info', text1: 'Limit reached', text2: 'You can add up to 3 images.' });
      return;
    }
    setPhotoSourceModalVisible(true);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // ── Submit to Firestore ──
  const handleSubmit = async () => {
    // Check validation first
    if (!selectedCategory) {
      Alert.alert("Missing Category", "Please select a category for this report.");
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert("Description Too Short", "Please provide a detailed description (at least 10 characters).");
      return;
    }
    if (locationAddress === 'Fetching location…' || locationAddress === 'Updating address…') {
      Alert.alert("Location Not Ready", "Please wait for the location to be determined or search for a location.");
      return;
    }

    if (currentCountry && currentCountry !== 'Sri Lanka') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Location',
        text2: 'Reports can only be submitted within Sri Lanka.',
      });
      return;
    }

    if (!user || !profile) {
      Toast.show({ type: 'error', text1: 'Not logged in', text2: 'Please log in to submit a report.' });
      return;
    }

    if (images.length === 0) {
      Alert.alert(
        "No Images Added",
        "Are you sure you want to submit this report without any photo evidence?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit Anyway", onPress: () => processSubmission() }
        ]
      );
    } else {
      processSubmission();
    }
  };

  const processSubmission = async () => {
    if (!user || !profile || !selectedCategory) {
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: 'Required data is missing. Please try again.',
      });
      return;
    }

    setLoading(true);
    setUploadStatusText('Preparing evidence...');
    try {
      // 1. Upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        setUploadStatusText(`Uploading evidence ${i + 1} of ${images.length}...`);
        const path = `reports/${user.uid}/${Date.now()}_img${i}.jpg`;
        const url = await uploadFile(images[i], path);
        imageUrls.push(url);
      }

      setUploadStatusText('Securing report details...');

      // Generate standardized daily custom ID
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      const pCode = PROVINCE_CODES[resolvedProvince] || "0";
      const dCode = DISTRICT_CODES[resolvedDistrict] || "00";
      const idPrefix = `${dateStr}${pCode}${dCode}`;
      
      // Query reports matching current date (globally across all regions)
      const q = query(
        collection(db, 'reports'),
        where('reportDate', '==', dateStr)
      );
      
      const querySnapshot = await getDocs(q);
      let nextNumber = 1;
      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        // docId format: yyyymmddPDDXXXXX where yyyymmdd is dateStr
        if (docId.length === 16 && docId.startsWith(dateStr)) {
          const lastSeqStr = docId.substring(11); // Last 5 digits start at index 11
          const lastSeqNum = parseInt(lastSeqStr, 10);
          if (!isNaN(lastSeqNum) && lastSeqNum >= nextNumber) {
            nextNumber = lastSeqNum + 1;
          }
        }
      });
      
      const seqStr = String(nextNumber).padStart(5, '0');
      const customReportId = `${idPrefix}${seqStr}`;

      // 2. Add document
      const reportDocRef = doc(db, 'reports', customReportId);
      await setDoc(reportDocRef, {
        uid: user.uid,
        authorName: profile.fullName,
        reportDate: dateStr,
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
          province: resolvedProvince,
          district: resolvedDistrict,
          localGovernmentArea: resolvedLGA,
        },
        imageUrls,
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

      // 3. Create admin notification log
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientUid: 'admin',
          type: 'status_change',
          title: 'New Issue Received',
          body: `A new ${selectedCategory.label} Incident (Ref: ${customReportId}) has been reported by ${profile.fullName} in ${locationAddress.split(',').slice(-2).join(',').trim() || 'unknown region'}.`,
          reportId: customReportId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('❌ Failed to create admin notification log:', err);
      }

      setUploadStatusText('Report submitted successfully!');
      setSubmittedRefId(customReportId);
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
    setImages([]);
    setSearchQuery('');
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

  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {/* ── Header ── */}
          <View className="px-5 mb-5">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>New Report</Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>Help make your community safer</Text>
          </View>

          {/* ── 1. Location ── */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-bold text-base" style={{ color: colors.text }}>Location</Text>
              <View className="flex-row items-center gap-1.5">
                {locLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gpsGranted ? '#059669' : '#DC2626' }} />
                    <Text className="text-xs font-semibold" style={{ color: gpsGranted ? '#059669' : '#DC2626' }}>
                      {gpsGranted ? 'GPS Active' : 'GPS Inactive'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Location Search Bar */}
            <View style={{ zIndex: 5 }}>
              <View className="flex-row gap-2 mb-1">
                <View className="flex-1 rounded-xl px-4 py-2 flex-row items-center border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                  <Ionicons name="search" size={16} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Search for a location..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchLocation}
                    className="flex-1 text-sm ml-2 py-2"
                    style={{ color: colors.text }}
                  />
                  {isSuggesting && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
                <Pressable
                  onPress={searchLocation}
                  className="w-12 items-center justify-center rounded-xl active:opacity-70"
                  style={{ backgroundColor: colors.border }}
                >
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </Pressable>
              </View>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <View className="rounded-xl overflow-hidden border mt-1 shadow-2xl" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                  {suggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => selectSuggestion(item)}
                      className="flex-row items-center p-3 active:opacity-70 border-b"
                      style={{ borderColor: colors.border }}
                    >
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} className="mr-3" />
                      <View className="flex-1">
                        <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>{item.properties.name}</Text>
                        <Text className="text-[10px]" style={{ color: colors.textSecondary }} numberOfLines={1}>
                          {[item.properties.city, item.properties.country].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Interactive MapView */}
            <View className="rounded-2xl overflow-hidden my-3" style={{ height: 200, borderWidth: 1, borderColor: colors.border }}>
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
                onLongPress={(e) => handleMarkerDragEnd(e.nativeEvent.coordinate)}
                customMapStyle={isDark ? DARK_MAP_STYLE : []}
                showsUserLocation={gpsGranted}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={coords}
                  draggable
                  onDragEnd={(e) => handleMarkerDragEnd(e.nativeEvent.coordinate)}
                  pinColor="#c50000a7"
                />
              </MapView>

              {/* Recenter & FullScreen buttons */}
              <View className="absolute bottom-3 right-3 gap-2">
                <Pressable
                  onPress={() => setFullMapVisible(true)}
                  style={{ backgroundColor: colors.card, borderRadius: 8, padding: 8 }}
                  className="active:opacity-80 border border-transparent"
                >
                  <Ionicons name="expand" size={16} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={recenter}
                  style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 8 }}
                  className="active:opacity-80 shadow-md"
                >
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Address bar */}
            <View className="flex-row items-center gap-2 rounded-xl px-4 py-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text className="text-sm flex-1" style={{ color: colors.text }} numberOfLines={2}>{locationAddress}</Text>
            </View>
            <Text className="text-xs mt-2 ml-1" style={{ color: colors.textMuted }}>
              * Hold/long-press anywhere on the map to drop the pin there.
            </Text>
          </View>

          {/* ── 2. Category ── */}
          <View className="px-5 mb-5">
            <Text className="font-bold text-base mb-3" style={{ color: colors.text }}>Category</Text>
            <Pressable onPress={() => setCategoryModalVisible(true)} className="active:opacity-80">
              <View
                className="flex-row items-center justify-between rounded-2xl px-4 py-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: selectedCategory ? colors.primary : colors.border }}
              >
                {selectedCategory ? (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: selectedCategory.bg }}>
                      <Ionicons name={selectedCategory.icon as any} size={18} color={selectedCategory.color} />
                    </View>
                    <Text className="font-semibold" style={{ color: colors.text }}>{selectedCategory.label}</Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textMuted }}>Select Category</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          </View>

          {/* ── 3. Images ── */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-bold text-base" style={{ color: colors.text }}>Add Evidence (Photos)</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{images.length}/3</Text>
            </View>
            <View className="flex-row gap-3">
              {images.map((uri, index) => (
                <View key={index} className="w-[30%] aspect-square rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
                  <RNImage source={{ uri }} style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                </View>
              ))}
              {images.length < 3 && (
                <Pressable
                  onPress={pickImages}
                  className="w-[30%] aspect-square rounded-xl items-center justify-center border-2 border-dashed active:opacity-70"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                  <Text className="text-[10px] mt-1" style={{ color: colors.textSecondary }}>Add Photo</Text>
                </Pressable>
              )}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 8 }}>Max 3 images. Max 2MB per image. Auto-compression applied.</Text>
          </View>

          {/* ── 4. Description ── */}
          <View className="px-5 mb-6">
            <Text className="font-bold text-base mb-3" style={{ color: colors.text }}>Description</Text>
            <View
              className="rounded-2xl px-4 py-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, minHeight: 120 }}
            >
              <TextInput
                placeholder="Describe the issue in detail…"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, 500))}
                multiline
                textAlignVertical="top"
                style={{ color: colors.text, fontSize: 14, lineHeight: 22, minHeight: 100 }}
              />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'right' }}>{description.length}/500</Text>
          </View>

          {/* ── Submit ── */}
          <View className="px-5">
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="py-4 rounded-2xl items-center active:opacity-80"
              style={{ backgroundColor: (selectedCategory && description.trim().length >= 10) ? colors.primary : colors.border }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-base" style={{ color: canSubmit ? '#FFFFFF' : colors.textMuted }}>
                  Submit Report
                </Text>
              )}
            </Pressable>
            {!canSubmit && (
              <Text className="text-xs text-center mt-2" style={{ color: colors.textMuted }}>
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

      <FullScreenMapModal
        visible={fullMapVisible}
        onClose={() => setFullMapVisible(false)}
        coords={coords}
        onCoordsChange={handleMarkerDragEnd}
        locationAddress={locationAddress}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={searchLocation}
        suggestions={suggestions}
        onSelectSuggestion={selectSuggestion}
        isSuggesting={isSuggesting}
      />

      <BlurLoadingOverlay
        visible={loading}
        statusText="Submitting Report"
        subStatusText={uploadStatusText}
      />

      <PhotoSourceModal
        visible={photoSourceModalVisible}
        onClose={() => setPhotoSourceModalVisible(false)}
        onSelectCamera={handleCameraLaunch}
        onSelectGallery={handleGalleryLaunch}
      />
    </View>
  );
}