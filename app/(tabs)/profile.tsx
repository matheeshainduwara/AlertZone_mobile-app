import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import { BADGE_DEFINITIONS } from '../../services/gamification.service';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../config/toastConfig';
import SelectionModal from '../../components/SelectionModal';
import { useAuth } from '../../config/authConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sriLankaGeographics } from '../../config/sriLankaRegions';
import { useScrollContext } from '../../config/tabBarScrollContext';
import { db, storage } from '../../services/firebase';
import { useTheme } from '../../config/themeContext';
import { compressImage, isUnderSizeLimit, uploadFile } from '../../services/storage.service';
import { registerForPushNotificationsAsync, unregisterPushNotificationsAsync } from '../../services/notification.service';

const DEFAULT_COORDS = { latitude: 6.9271, longitude: 79.8612 }; // Colombo default

import { DARK_MAP_STYLE } from '../../config/mapStyle';


// ─────────────────────────────────────────────
// Sub-components (unchanged from original)
// ─────────────────────────────────────────────

function StatCard({ label, value, trend, icon }: { label: string; value: string | number; trend?: string; icon: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 rounded-2xl p-3.5"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>{label}</Text>
        <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: colors.border }}>
          <Ionicons name={icon as any} size={14} color={colors.primary} />
        </View>
      </View>
      <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>{value}</Text>
      {trend && <Text className="text-[#059669] text-[11px] mt-1 font-medium">{trend}</Text>}
    </View>
  );
}

function BadgeChip({ badge, earned = true }: { badge: typeof BADGE_DEFINITIONS[0]; earned?: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View className="items-center" style={{ width: 76 }}>
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5"
        style={{
          backgroundColor: earned ? (isDark ? badge.color + '1A' : badge.bg) : colors.cardUnearned,
          borderWidth: 1,
          borderColor: earned ? badge.color + '50' : colors.border,
          opacity: earned ? 1 : 0.4,
        }}
      >
        <Ionicons name={badge.icon as any} size={26} color={earned ? badge.color : colors.border} />
      </View>
      <Text
        className="text-[10px] text-center leading-3"
        style={{ color: colors.textSecondary }}
      >
        {badge.name}
      </Text>
    </View>
  );
}

function SettingsRow({ icon, iconBg, iconColor, label, subtitle, onPress, danger }: {
  icon: string; iconBg: string; iconColor: string;
  label: string; subtitle: string; onPress?: () => void; danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3.5 active:opacity-70">
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3.5"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold" style={{ color: danger ? '#DC2626' : colors.text }}>{label}</Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{subtitle}</Text>
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.border} />}
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Personal Information Modal
// ─────────────────────────────────────────────
function PersonalInfoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();

  // Local form state — initialised from real profile data
  const [phone, setPhone] = useState(profile?.phoneNumber ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving]           = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const [nic, setNic] = useState(profile?.nic ?? '');
  const [province, setProvince] = useState(profile?.province ?? '');
  const [district, setDistrict] = useState(profile?.district ?? '');
  const [lga, setLga] = useState(profile?.localGovernmentArea ?? '');

  // Map & autocomplete states
  const [homeLocation, setHomeLocation] = useState<{ latitude: number; longitude: number } | null>(profile?.homeLocation ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [gpsGranted, setGpsGranted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Selectors visibility
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [lgaModalVisible, setLgaModalVisible] = useState(false);

  // Reusable Field Editor states
  const [fieldEditVisible, setFieldEditVisible] = useState(false);
  const [editingFieldName, setEditingFieldName] = useState('');
  const [editingFieldKey, setEditingFieldKey] = useState<'phone' | 'nic' | 'address' | ''>('');
  const [tempFieldValue, setTempFieldValue] = useState('');
  const [editorError, setEditorError] = useState('');

  const openFieldEditor = (name: string, key: 'phone' | 'nic' | 'address', currentVal: string) => {
    setEditingFieldName(name);
    setEditingFieldKey(key);
    setTempFieldValue(currentVal);
    setEditorError('');
    setFieldEditVisible(true);
  };

  const saveFieldEditor = () => {
    if (editingFieldKey === 'phone') {
      const cleaned = tempFieldValue.replace(/\s+/g, '');
      const regex = /^(?:\+94|0)?7[0-9]{8}$/;
      if (!cleaned || !regex.test(cleaned)) {
        setEditorError('Please enter a valid Sri Lankan phone number (e.g. 07XXXXXXXX).');
        return;
      }
      setPhone(tempFieldValue);
      Toast.show({
        type: 'success',
        text1: 'Phone Number Updated',
        text2: 'Change updated locally.',
      });
    } else if (editingFieldKey === 'nic') {
      const cleaned = tempFieldValue.trim().toUpperCase();
      const oldFormat = /^[0-9]{9}[vVxX]$/;
      const newFormat = /^[0-9]{12}$/;
      if (!cleaned || (!oldFormat.test(cleaned) && !newFormat.test(cleaned))) {
        setEditorError('Enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).');
        return;
      }
      setNic(cleaned);
      Toast.show({
        type: 'success',
        text1: 'NIC Number Updated',
        text2: 'Change updated locally.',
      });
    } else if (editingFieldKey === 'address') {
      if (!tempFieldValue.trim()) {
        setEditorError('Please enter a valid address.');
        return;
      }
      setAddress(tempFieldValue);
      Toast.show({
        type: 'success',
        text1: 'Address Updated',
        text2: 'Change updated locally.',
      });
    }
    setFieldEditVisible(false);
  };

  // Sync form fields if profile loads after modal mounts
  useEffect(() => {
    if (profile) {
      setPhone(profile.phoneNumber ?? '');
      setAddress(profile.address ?? '');
      setNic(profile.nic ?? '');
      setProvince(profile.province ?? '');
      setDistrict(profile.district ?? '');
      setLga(profile.localGovernmentArea ?? '');
      setHomeLocation(profile.homeLocation ?? null);
    }
  }, [profile]);

  // Check GPS and center map on mount/visible
  useEffect(() => {
    if (visible) {
      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setGpsGranted(status === 'granted');
      })();

      if (homeLocation) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              ...homeLocation,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            600
          );
        }, 300);
      }
    }
  }, [visible]);

  // ── Fetch suggestions (Photon API) ──
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5&lang=en&lat=6.9271&lon=79.8612`
        );
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

  // ── Reverse geocode coordinates ──
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city, r.region].filter(Boolean);
        setAddress(parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (e) {
      console.error('❌ Reverse geocode error:', e);
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const selectSuggestion = async (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name || '';
    const city = feature.properties.city || '';
    const street = feature.properties.street || '';
    const fullAddress = [name, street, city].filter(Boolean).join(', ');

    const newCoords = { latitude: lat, longitude: lng };
    setHomeLocation(newCoords);
    setSearchQuery('');
    setSuggestions([]);

    mapRef.current?.animateToRegion(
      { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      600
    );
    await reverseGeocode(lat, lng);
  };

  const handleMarkerDragEnd = async (coordinate: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = coordinate;
    const newCoords = { latitude, longitude };
    setHomeLocation(newCoords);
    setAddress('Updating address…');
    await reverseGeocode(latitude, longitude);
  };

  const handleMapPress = async (coordinate: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = coordinate;
    const newCoords = { latitude, longitude };
    setHomeLocation(newCoords);
    setAddress('Updating address…');
    await reverseGeocode(latitude, longitude);
    mapRef.current?.animateToRegion(
      { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      600
    );
  };

  const recenter = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsGranted(false);
      Toast.show({ type: 'info', text1: 'Permission Denied', text2: 'Location permission is required.' });
      return;
    }
    setGpsGranted(true);
    try {
      setLocLoading(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const newCoords = { latitude, longitude };
      setHomeLocation(newCoords);
      mapRef.current?.animateToRegion(
        { ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        600
      );
      await reverseGeocode(latitude, longitude);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get current position.' });
    } finally {
      setLocLoading(false);
    }
  };

  // ── Save to Firestore ──
  const handleSave = async () => {
    if (!user) return;
    if (!phone || !nic || !province || !district || !lga) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in phone, NIC, and region fields.' });
      return;
    }
    const validateNIC = (nicValue: string) => {
      const oldFormat = /^[0-9]{9}[vVxX]$/;
      const newFormat = /^[0-9]{12}$/;
      return oldFormat.test(nicValue) || newFormat.test(nicValue);
    };
    if (!validateNIC(nic)) {
      Toast.show({ type: 'error', text1: 'Invalid NIC', text2: 'Please enter a valid Sri Lankan NIC.' });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: phone,
        address,
        nic,
        province,
        district,
        localGovernmentArea: lga,
        homeLocation,
      });
      await refreshProfile(); // re-fetch so profile screen updates immediately
      Toast.show({ type: 'success', text1: 'Profile Updated!', text2: 'Your changes have been saved.' });
      onClose();
    } catch (e) {
      console.error('Update error:', e);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: 'Could not save changes. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const processAndUploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploadLoading(true);
    try {
      // Compress avatar before upload
      const compressedUri = await compressImage(uri);
      // Use reports/{uid}/ path — same as incident images, which is known to be authorized
      const path = `reports/${user.uid}/avatar_${Date.now()}.jpg`;
      console.log('⬆️ Uploading avatar to path:', path);
      const downloadUrl = await uploadFile(compressedUri, path);

      await updateDoc(doc(db, 'users', user.uid), {
        avatarUrl: downloadUrl,
      });

      await refreshProfile();

      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded!',
        text2: 'Your profile picture has been updated.',
      });
    } catch (e: any) {
      console.error('❌ Upload avatar error:', e?.code, e?.message, e);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: e?.message ?? 'Could not upload profile picture. Try again.',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setShowImageOptions(false);
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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;

      const sizeOk = await isUnderSizeLimit(uri, 10);
      if (!sizeOk) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: 'Maximum photo size allowed is 10MB.',
        });
        return;
      }

      await processAndUploadAvatar(uri);
    } catch (e) {
      console.error('Camera launch error:', e);
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: 'Could not open camera.',
      });
    }
  };

  const handleUploadGallery = async () => {
    setShowImageOptions(false);
    try {
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!galleryPermission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Gallery access is required to choose a photo.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;

      const sizeOk = await isUnderSizeLimit(uri, 10);
      if (!sizeOk) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: 'Maximum photo size allowed is 10MB.',
        });
        return;
      }

      await processAndUploadAvatar(uri);
    } catch (e) {
      console.error('Gallery launch error:', e);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Could not open gallery.',
      });
    }
  };

  const handleDeletePhoto = async () => {
    setShowImageOptions(false);
    if (!user) return;
    if (!profile?.avatarUrl) {
      Toast.show({
        type: 'info',
        text1: 'No Photo',
        text2: 'You do not have a profile picture to delete.',
      });
      return;
    }

    setUploadLoading(true);
    try {
      const currentUrl = profile.avatarUrl;
      if (currentUrl.includes('firebasestorage.googleapis.com')) {
        try {
          // Extract the storage path from the download URL
          // Download URLs look like: .../o/avatars%2F<uid>%2Favatarfile.jpg?alt=media&token=...
          const match = currentUrl.match(/\/o\/(.+?)\?/);
          if (match) {
            const storagePath = decodeURIComponent(match[1]);
            console.log('🗑️ Deleting storage file at path:', storagePath);
            const fileRef = storageRef(storage, storagePath);
            await deleteObject(fileRef);
          }
        } catch (storageErr: any) {
          // Non-fatal: storage file may have already been deleted
          console.warn('Storage deletion warning:', storageErr?.code, storageErr?.message);
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        avatarUrl: null,
      });

      await refreshProfile();

      Toast.show({
        type: 'success',
        text1: 'Photo Removed',
        text2: 'Your profile picture has been deleted.',
      });
    } catch (e: any) {
      console.error('❌ Delete avatar error:', e?.code, e?.message);
      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: 'Could not remove profile picture. Try again.',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row justify-between items-center">
            <Text className="text-[#1A1A1A] text-xl font-bold">Personal Information</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Avatar */}
          <View className="items-center mb-6">
            <Pressable onPress={() => setShowImageOptions(true)} className="active:opacity-80">
              <Image
                source={
                  profile?.avatarUrl
                    ? { uri: profile.avatarUrl }
                    : require('../../assets/images/iconAlerZone-Bg-none.png')
                }
                className="w-32 h-32 rounded-full"
                style={{ borderWidth: 3, borderColor: '#0D8A72' }}
                resizeMode={profile?.avatarUrl ? 'cover' : 'contain'}
              />
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0D8A72] items-center justify-center"
                style={{ borderWidth: 2, borderColor: '#1A1A1A' }}
              >
                <Ionicons name="camera" size={14} color="#1A1A1A" />
              </View>
            </Pressable>
            <Text className="text-[#1A1A1A] font-bold text-lg mt-3">{profile?.fullName}</Text>
            <Text className="text-[#6B7280] text-sm">{profile?.role} • Level {profile?.level ?? 1}</Text>
          </View>

          {/* Image Options */}
          {showImageOptions && (
            <View className="mx-5 mb-4 bg-white rounded-2xl overflow-hidden"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}
            >
              <View className="px-4 py-3 bg-[#11232B] flex-row justify-between items-center border-b border-[#E8E8E8]">
                <Text className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider">Photo Options</Text>
                <Text className="text-[#0D8A72] text-[10px] font-bold">MAX SIZE: 10MB</Text>
              </View>
              <Pressable onPress={handleTakePhoto} className="flex-row items-center px-4 py-4 active:bg-[#E8E8E8]">
                <Ionicons name="camera-outline" size={20} color="#0D8A72" />
                <Text className="text-[#1A1A1A] ml-3 font-medium">Take Photo</Text>
              </Pressable>
              <View className="h-px bg-[#E8E8E8]" />
              <Pressable onPress={handleUploadGallery} className="flex-row items-center px-4 py-4 active:bg-[#E8E8E8]">
                <Ionicons name="image-outline" size={20} color="#0D8A72" />
                <Text className="text-[#1A1A1A] ml-3 font-medium">Upload From Gallery</Text>
              </Pressable>
              {profile?.avatarUrl ? (
                <>
                  <View className="h-px bg-[#E8E8E8]" />
                  <Pressable onPress={handleDeletePhoto} className="flex-row items-center px-4 py-4 active:bg-[#E8E8E8]">
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text className="text-[#DC2626] ml-3 font-medium">Delete Photo</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          )}

          {/* Personal Information */}
          <View className="px-5 mb-5">
            <Text className="text-[#1A1A1A] font-bold text-base mb-3">Personal Information</Text>
            <View className="bg-white rounded-2xl px-4 py-1"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}
            >
              {/* Email — read only */}
              <View className="flex-row items-center py-3">
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="mail-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">Email</Text>
                  <Text className="text-[#6B7280] text-sm mt-0.5">{profile?.email}</Text>
                </View>
                <View className="px-2 py-0.5 rounded-md bg-[#E8E8E8]">
                  <Text className="text-[#9CA3AF] text-[10px]">locked</Text>
                </View>
              </View>

              <View className="h-px bg-[#E8E8E8]" />

              {/* Phone */}
              <Pressable
                onPress={() => openFieldEditor('Phone Number', 'phone', phone)}
                className="flex-row items-center py-3 active:opacity-80"
              >
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="call-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">Phone Number</Text>
                  <Text className={`text-sm mt-0.5 ${phone ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
                    {phone || 'Add phone number'}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={16} color="#0D8A72" className="mr-2" />
              </Pressable>

              <View className="h-px bg-[#E8E8E8]" />

              {/* NIC */}
              <Pressable
                onPress={() => openFieldEditor('NIC Number', 'nic', nic)}
                className="flex-row items-center py-3 active:opacity-80"
              >
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="card-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">NIC Number</Text>
                  <Text className={`text-sm mt-0.5 ${nic ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
                    {nic || 'Add NIC number'}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={16} color="#0D8A72" className="mr-2" />
              </Pressable>

              <View className="h-px bg-[#E8E8E8]" />

              {/* Address */}
              <Pressable
                onPress={() => openFieldEditor('Address', 'address', address)}
                className="flex-row items-center py-3 active:opacity-80"
              >
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="location-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">Address</Text>
                  <Text className={`text-sm mt-0.5 ${address ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`} numberOfLines={2}>
                    {address || 'Add address'}
                  </Text>
                </View>
                <Ionicons name="create-outline" size={16} color="#0D8A72" className="mr-2" />
              </Pressable>

              <View className="h-px bg-[#E8E8E8]" />

              {/* Province */}
              <Pressable onPress={() => setProvinceModalVisible(true)} className="flex-row items-center py-3 active:opacity-80">
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="map-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">Province</Text>
                  <Text className={`text-sm mt-0.5 ${province ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
                    {province || 'Select Province'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#E8E8E8" />
              </Pressable>

              <View className="h-px bg-[#E8E8E8]" />

              {/* District */}
              <Pressable
                onPress={() => {
                  if (!province) {
                    Toast.show({ type: 'info', text1: 'Province Required', text2: 'Please select a province first.' });
                    return;
                  }
                  setDistrictModalVisible(true);
                }}
                className={`flex-row items-center py-3 active:opacity-80 ${!province ? 'opacity-50' : ''}`}
              >
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="navigate-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">District</Text>
                  <Text className={`text-sm mt-0.5 ${district ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
                    {district || 'Select District'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#E8E8E8" />
              </Pressable>

              <View className="h-px bg-[#E8E8E8]" />

              {/* LGA */}
              <Pressable
                onPress={() => {
                  if (!district) {
                    Toast.show({ type: 'info', text1: 'District Required', text2: 'Please select a district first.' });
                    return;
                  }
                  setLgaModalVisible(true);
                }}
                className={`flex-row items-center py-3 active:opacity-80 ${!district ? 'opacity-50' : ''}`}
              >
                <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center mr-3">
                  <Ionicons name="business-outline" size={16} color="#0D8A72" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide">Local Government Area</Text>
                  <Text className={`text-sm mt-0.5 ${lga ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}`}>
                    {lga || 'Select Local Government'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#E8E8E8" />
              </Pressable>
            </View>
          </View>

          {/* Home Location Map */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#1A1A1A] font-bold text-base">Home Location</Text>
              <View className="flex-row items-center gap-1.5">
                {locLoading ? (
                  <ActivityIndicator size="small" color="#059669" />
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
            <View style={{ zIndex: 10 }}>
              <View className="flex-row gap-2 mb-1">
                <View className="flex-1 bg-white rounded-xl px-4 py-2 flex-row items-center border border-[#E8E8E8]">
                  <Ionicons name="search" size={16} color="#9CA3AF" />
                  <TextInput
                    placeholder="Search home location..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 text-[#1A1A1A] text-sm ml-2 py-2"
                  />
                  {isSuggesting && <ActivityIndicator size="small" color="#0D8A72" />}
                </View>
              </View>

              {/* Suggestions Dropdown overlay */}
              {suggestions.length > 0 && (
                <View className="bg-white rounded-xl overflow-hidden border border-[#E8E8E8] mt-1 shadow-2xl absolute top-12 left-0 right-0 z-50">
                  {suggestions.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => selectSuggestion(item)}
                      className="flex-row items-center p-3 active:bg-[#E8E8E8] border-b border-[#E8E8E8]"
                    >
                      <Ionicons name="location-outline" size={16} color="#6B7280" className="mr-3" />
                      <View className="flex-1">
                        <Text className="text-[#1A1A1A] text-sm font-medium" numberOfLines={1}>{item.properties.name}</Text>
                        <Text className="text-[#9CA3AF] text-[10px]" numberOfLines={1}>
                          {[item.properties.city, item.properties.country].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Interactive MapView */}
            <View className="rounded-2xl overflow-hidden my-3" style={{ height: 220, borderWidth: 1, borderColor: colors.border }}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: homeLocation?.latitude ?? DEFAULT_COORDS.latitude,
                  longitude: homeLocation?.longitude ?? DEFAULT_COORDS.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
                customMapStyle={isDark ? DARK_MAP_STYLE : []}
                showsUserLocation={gpsGranted}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={homeLocation ?? DEFAULT_COORDS}
                  draggable
                  onDragEnd={(e) => handleMarkerDragEnd(e.nativeEvent.coordinate)}
                  pinColor="#c50000a7"
                />
              </MapView>

              {/* Recenter button */}
              <View className="absolute bottom-3 right-3">
                <Pressable
                  onPress={recenter}
                  style={{ backgroundColor: colors.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}
                  className="active:opacity-80"
                >
                  <Ionicons name="locate" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-5 flex-row gap-3">
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl items-center active:opacity-80"
              style={{ backgroundColor: saving ? 'rgba(76,194,209,0.4)' : '#0D8A72' }}
            >
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text className="text-[#F5F5F5] font-bold text-base">Save</Text>
              }
            </Pressable>
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl items-center active:opacity-70"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}
            >
              <Text className="text-[#4A4A4A] font-semibold text-base">Cancel</Text>
            </Pressable>
          </View>

          {/* Reusable Selector Modals inside PersonalInfoModal */}
          <SelectionModal
            visible={provinceModalVisible}
            onClose={() => setProvinceModalVisible(false)}
            title="Select Province"
            options={Object.keys(sriLankaGeographics)}
            onSelect={(selectedProvince) => {
              setProvince(selectedProvince);
              setDistrict('');
              setLga('');
            }}
            selectedValue={province}
          />

          <SelectionModal
            visible={districtModalVisible}
            onClose={() => setDistrictModalVisible(false)}
            title="Select District"
            options={province ? Object.keys(sriLankaGeographics[province]) : []}
            onSelect={(selectedDistrict) => {
              setDistrict(selectedDistrict);
              setLga('');
            }}
            selectedValue={district}
          />

          <SelectionModal
            visible={lgaModalVisible}
            onClose={() => setLgaModalVisible(false)}
            title="Select Local Government"
            options={province && district ? sriLankaGeographics[province][district] : []}
            onSelect={(selectedLga) => {
              setLga(selectedLga);
            }}
            selectedValue={lga}
          />

          {/* Reusable Field Editor Modal */}
          <Modal visible={fieldEditVisible} transparent animationType="fade">
            <View className="flex-1 items-center justify-center bg-black/75 px-6">
              <View className="bg-white w-full max-w-sm rounded-3xl p-6 border border-[#E8E8E8] items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20 }}
              >
                <View className="w-12 h-12 rounded-full bg-white items-center justify-center mb-4 border border-[#0D8A72]/30">
                  <Ionicons 
                    name={
                      editingFieldKey === 'phone' ? 'call-outline' :
                      editingFieldKey === 'nic' ? 'card-outline' : 'location-outline'
                    } 
                    size={24} 
                    color="#0D8A72" 
                  />
                </View>
                <Text className="text-[#1A1A1A] text-lg font-bold text-center mb-2">Edit {editingFieldName}</Text>
                <Text className="text-[#6B7280] text-xs text-center leading-4 mb-5">
                  Update your {editingFieldName.toLowerCase()} below. This will not be saved permanently until you save the main profile.
                </Text>

                {!!editorError && (
                  <View className="w-full bg-[#FEE2E2] border border-[#DC2626]/30 rounded-xl px-4 py-2.5 mb-4 flex-row items-center gap-2">
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                    <Text className="text-[#DC2626] text-xs font-semibold flex-1 leading-4">
                      {editorError}
                    </Text>
                  </View>
                )}

                <TextInput
                  value={tempFieldValue}
                  onChangeText={(text) => {
                    setTempFieldValue(text);
                    if (editorError) setEditorError('');
                  }}
                  placeholder={`Enter ${editingFieldName.toLowerCase()}`}
                  placeholderTextColor="#6B7280"
                  keyboardType={editingFieldKey === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize={editingFieldKey === 'nic' ? 'characters' : 'none'}
                  multiline={editingFieldKey === 'address'}
                  numberOfLines={editingFieldKey === 'address' ? 3 : 1}
                  className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm mb-5 text-center"
                  style={editingFieldKey === 'address' ? { textAlign: 'left', minHeight: 80 } : undefined}
                  autoFocus
                />
                <View className="w-full flex-row gap-3">
                  <Pressable
                    onPress={() => setFieldEditVisible(false)}
                    className="flex-1 py-3 bg-white border border-[#E8E8E8] rounded-xl items-center active:opacity-75"
                  >
                    <Text className="text-[#6B7280] font-semibold text-sm">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveFieldEditor}
                    className="flex-1 py-3 bg-[#0D8A72] rounded-xl items-center active:opacity-75"
                  >
                    <Text className="text-[#F5F5F5] font-bold text-sm">Done</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

        </ScrollView>

        {/* Loading Overlay */}
        {(uploadLoading || saving) && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
          >
            <View
              className="bg-white border border-[#059669] rounded-3xl p-8 items-center shadow-2xl"
              style={{ width: '80%', maxWidth: 320 }}
            >
              <ActivityIndicator size="large" color="#0D8A72" className="mb-4" />
              <Text className="text-[#1A1A1A] text-base font-bold text-center">
                {uploadLoading ? 'Uploading Photo...' : 'Saving Changes...'}
              </Text>
              <Text className="text-[#6B7280] text-xs text-center mt-2 leading-4">
                Please wait while we update your AlertZone profile.
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Alert Preferences Modal
// ─────────────────────────────────────────────
function AlertPreferencesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user, profile, refreshProfile } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notificationsEnabled ?? true);
  const [alertRadius, setAlertRadius] = useState(profile?.alertRadius ?? '10 Km');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
      setAlertRadius(profile.alertRadius ?? '10 Km');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled,
        alertRadius,
      });

      if (notificationsEnabled) {
        await registerForPushNotificationsAsync(user.uid);
      } else {
        await unregisterPushNotificationsAsync(user.uid);
      }

      await refreshProfile();
      Toast.show({
        type: 'success',
        text1: 'Preferences Saved!',
        text2: 'Your alert preferences have been updated.',
      });
      onClose();
    } catch (e) {
      console.error('Alert preferences update error:', e);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not save preferences. Try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row justify-between items-center">
            <Text className="text-[#1A1A1A] text-xl font-bold">Alert Preferences</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Description */}
          <View className="px-5 mb-6">
            <Text className="text-[#6B7280] text-sm leading-5">
              Customize how and when you want to receive alerts on AlertZone.
            </Text>
          </View>

          {/* Alert Preferences Form */}
          <View className="px-5 mb-8">
            <View className="bg-white rounded-2xl px-4"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}
            >
              {/* Notifications Toggle */}
              <View className="flex-row items-center justify-between py-4">
                <View className="flex-1 pr-4">
                  <Text className="text-[#1A1A1A] text-sm font-semibold">Enable Notifications</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-0.5 leading-4">
                    Receive real-time push alerts.
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E8E8E8', true: '#0D8A72' }}
                  thumbColor="white"
                />
              </View>

              <View className="h-px bg-[#E8E8E8]" />

              {/* Alert Radius */}
              <View className="flex-row items-center justify-between py-4">
                <View className="flex-1 pr-4">
                  <Text className="text-[#1A1A1A] text-sm font-semibold">Alert Radius</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-0.5 leading-4">
                    Only receive notifications for incidents within this range (1–15 Km).
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => {
                      const current = parseInt(alertRadius.replace(/[^0-9]/g, '')) || 5;
                      const next = Math.max(1, current - 1);
                      setAlertRadius(`${next} Km`);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center active:opacity-70"
                  >
                    <Ionicons name="remove" size={16} color="#0D8A72" />
                  </Pressable>
                  <TextInput
                    value={alertRadius.replace(/[^0-9]/g, '')}
                    onChangeText={(val) => {
                      const num = parseInt(val.replace(/[^0-9]/g, ''));
                      if (!isNaN(num)) {
                        const capped = Math.min(15, num);
                        setAlertRadius(`${capped} Km`);
                      } else {
                        setAlertRadius(` Km`);
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(alertRadius.replace(/[^0-9]/g, ''));
                      if (isNaN(num) || num < 1) setAlertRadius('1 Km');
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    className="text-[#0D8A72] text-base font-semibold w-8 text-center p-0 m-0"
                  />
                  <Pressable
                    onPress={() => {
                      const current = parseInt(alertRadius.replace(/[^0-9]/g, '')) || 5;
                      const next = Math.min(15, current + 1);
                      setAlertRadius(`${next} Km`);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center active:opacity-70"
                  >
                    <Ionicons name="add" size={16} color="#0D8A72" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-5 flex-row gap-3">
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl items-center active:opacity-80"
              style={{ backgroundColor: saving ? 'rgba(76,194,209,0.4)' : '#0D8A72' }}
            >
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text className="text-[#F5F5F5] font-bold text-base">Save Preferences</Text>
              }
            </Pressable>
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl items-center active:opacity-70"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}
            >
              <Text className="text-[#4A4A4A] font-semibold text-base">Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
        <Toast config={toastConfig} />
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Security Modal
// ─────────────────────────────────────────────
function SecurityModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  
  // Biometrics States
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [confirmPasswordText, setConfirmPasswordText] = useState('');

  // Animation states for Password Confirmation Modal
  const confirmScaleAnim = useRef(new Animated.Value(0.85)).current;
  const confirmOpacityAnim = useRef(new Animated.Value(0)).current;
  const [activePasswordConfirm, setActivePasswordConfirm] = useState(false);

  useEffect(() => {
    if (showPasswordConfirm) {
      setActivePasswordConfirm(true);
      Animated.parallel([
        Animated.spring(confirmScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(confirmOpacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(confirmScaleAnim, {
          toValue: 0.85,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
        Animated.timing(confirmOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActivePasswordConfirm(false);
      });
    }
  }, [showPasswordConfirm]);

  // Password Reset States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Forgot Password States
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Check if provider is password (email/password login)
  const isEmailUser = user?.providerData.some(p => p.providerId === 'password');

  useEffect(() => {
    if (visible) {
      (async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricSupported(compatible && enrolled);

        const stored = await SecureStore.getItemAsync('biometricCredentials');
        setBiometricsEnabled(!!stored);
      })();
      
      // Reset validation states
      setPasswordError('');
      setPasswordSuccess('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }, [visible]);

  const handleBiometricsToggle = async (value: boolean) => {
    if (!value) {
      await SecureStore.deleteItemAsync('biometricCredentials');
      setBiometricsEnabled(false);
      Toast.show({
        type: 'success',
        text1: 'Biometrics Disabled',
        text2: 'Fingerprint / Face ID login has been turned off.',
      });
    } else {
      setConfirmPasswordText('');
      setShowPasswordConfirm(true);
    }
  };

  const handleConfirmPassword = async () => {
    if (!user || !user.email) return;
    if (!confirmPasswordText.trim()) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter your password.' });
      return;
    }
    
    try {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const { auth: firebaseAuth } = require('../../services/firebase');
      await signInWithEmailAndPassword(firebaseAuth, user.email, confirmPasswordText);

      await SecureStore.setItemAsync(
        'biometricCredentials',
        JSON.stringify({ email: user.email, password: confirmPasswordText })
      );
      setBiometricsEnabled(true);
      setShowPasswordConfirm(false);
      Toast.show({
        type: 'success',
        text1: 'Biometrics Enabled!',
        text2: 'You can now log in using Fingerprint / Face ID.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Incorrect Password',
        text2: 'Please enter your correct current password.',
      });
    }
  };

  const handlePasswordResetSubmit = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!user || !user.email) return;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    setPasswordResetLoading(true);
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = require('firebase/auth');
      const { auth: firebaseAuth } = require('../../services/firebase');
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      await updatePassword(firebaseAuth.currentUser, newPassword);
      
      // Multi-device sync: update password version in Firestore and AsyncStorage
      const newTimestamp = new Date().toISOString();
      await AsyncStorage.setItem('lastPasswordChangeLocal', newTimestamp);
      await updateDoc(doc(db, 'users', user.uid), {
        lastPasswordChange: newTimestamp
      });
      
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: 'Your password has been changed.',
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Incorrect current password.');
      } else {
        setPasswordError(err.message || 'Could not update password. Try again.');
      }
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!user || !user.email) return;
    
    Alert.alert(
      "Send Reset Link",
      `Are you sure you want to send a password reset link to ${user.email}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Send Link",
          style: "default",
          onPress: async () => {
            setForgotPasswordLoading(true);
            try {
              const { sendPasswordResetEmail } = require('firebase/auth');
              const { auth: firebaseAuth } = require('../../services/firebase');
              
              await sendPasswordResetEmail(firebaseAuth, user.email);
              setPasswordSuccess('Reset email sent! Please check your inbox.');
              Toast.show({
                type: 'success',
                text1: 'Email Sent',
                text2: 'Password reset link sent to your email.',
              });
            } catch (err: any) {
              console.error('Forgot password error:', err);
              setPasswordError(err.message || 'Could not send reset email. Try again.');
            } finally {
              setForgotPasswordLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row justify-between items-center">
            <Text className="text-[#1A1A1A] text-xl font-bold">Security Settings</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Biometrics Segment */}
          {biometricSupported && (
            <View className="px-5 mb-6">
              <Text className="text-[#1A1A1A] font-bold text-base mb-3">Biometrics</Text>
              <View className="bg-white rounded-2xl px-4 py-4 border border-[#E8E8E8]">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-[#1A1A1A] text-sm font-semibold">Biometric Login</Text>
                    <Text className="text-[#9CA3AF] text-xs mt-0.5 leading-4">
                      Use Fingerprint or Face ID for fast and secure login.
                    </Text>
                  </View>
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={handleBiometricsToggle}
                    trackColor={{ false: '#E8E8E8', true: '#0D8A72' }}
                    thumbColor="white"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Password Settings Segment */}
          <View className="px-5 mb-8">
            <Text className="text-[#1A1A1A] font-bold text-base mb-3">Password & Security</Text>
            
            {isEmailUser ? (
              <View className="bg-white rounded-2xl p-4 border border-[#E8E8E8]">
                {/* Feedback Alerts */}
                {!!passwordError && (
                  <View className="w-full bg-[#FEE2E2] border border-[#DC2626]/30 rounded-xl px-4 py-2.5 mb-4 flex-row items-center gap-2">
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                    <Text className="text-[#DC2626] text-xs font-semibold flex-1 leading-4">
                      {passwordError}
                    </Text>
                  </View>
                )}

                {!!passwordSuccess && (
                  <View className="w-full bg-white/60 border border-[#059669]/30 rounded-xl px-4 py-2.5 mb-4 flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#0D8A72" />
                    <Text className="text-[#0D8A72] text-xs font-semibold flex-1 leading-4">
                      {passwordSuccess}
                    </Text>
                  </View>
                )}

                <Text className="text-[#6B7280] text-xs mb-4">
                  To change your password, please fill in the details below.
                </Text>

                {/* Current Password */}
                <View className="mb-4">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-1.5">Current Password</Text>
                  <TextInput
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm"
                  />
                </View>

                {/* New Password */}
                <View className="mb-4">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-1.5">New Password</Text>
                  <TextInput
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm"
                  />
                </View>

                {/* Confirm New Password */}
                <View className="mb-5">
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-1.5">Confirm New Password</Text>
                  <TextInput
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#6B7280"
                    className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm"
                  />
                </View>

                <Pressable
                  onPress={handlePasswordResetSubmit}
                  disabled={passwordResetLoading}
                  className="w-full py-3.5 bg-[#0D8A72] rounded-xl items-center active:opacity-75 mb-3"
                >
                  {passwordResetLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-[#F5F5F5] font-bold text-sm">Update Password</Text>
                  )}
                </Pressable>

                <View className="h-px bg-[#E8E8E8] my-3" />

                {/* Forgot Password Action */}
                <View className="items-center py-2">
                  <Text className="text-[#9CA3AF] text-xs mb-2">Forgot your password?</Text>
                  <Pressable
                    onPress={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="active:opacity-70"
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator size="small" color="#0D8A72" />
                    ) : (
                      <Text className="text-[#0D8A72] font-semibold text-sm">Send Password Reset Link</Text>
                    )}
                  </Pressable>
                </View>

              </View>
            ) : (
              <View className="bg-white rounded-2xl p-4 border border-[#E8E8E8] items-center">
                <Ionicons name="logo-google" size={36} color="#0D8A72" className="mb-2" />
                <Text className="text-[#1A1A1A] text-sm font-semibold mb-1 text-center">Google Authentication Linked</Text>
                <Text className="text-[#9CA3AF] text-xs text-center leading-4">
                  You are logged in with Google. Password configuration and reset operations are managed by Google.
                </Text>
              </View>
            )}
          </View>

          {/* Close Button */}
          <View className="px-5">
            <Pressable
              onPress={onClose}
              className="w-full py-4 bg-white border border-[#E8E8E8] rounded-2xl items-center active:opacity-75"
            >
              <Text className="text-[#4A4A4A] font-semibold text-base">Close</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Password Confirmation Modal for Biometrics */}
        <Modal visible={activePasswordConfirm} transparent animationType="none">
          <Animated.View 
            className="flex-1 items-center justify-center bg-black/75 px-6"
            style={{ opacity: confirmOpacityAnim }}
          >
            <Animated.View 
              className="bg-white w-full max-w-sm rounded-3xl p-6 border border-[#E8E8E8] items-center"
              style={{ 
                shadowColor: '#000', 
                shadowOffset: { width: 0, height: 10 }, 
                shadowOpacity: 0.5, 
                shadowRadius: 15, 
                elevation: 20,
                transform: [{ scale: confirmScaleAnim }]
              }}
            >
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center mb-4 border border-[#0D8A72]/30">
                <Ionicons name="key-outline" size={24} color="#0D8A72" />
              </View>
              <Text className="text-[#1A1A1A] text-lg font-bold text-center mb-2">Verify Password</Text>
              <Text className="text-[#6B7280] text-xs text-center leading-4 mb-5">
                Confirm your password to securely link your credentials for fingerprint and Face ID login.
              </Text>
              <TextInput
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                placeholder="Enter current password"
                placeholderTextColor="#6B7280"
                value={confirmPasswordText}
                onChangeText={setConfirmPasswordText}
                className="w-full bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm mb-5 text-center"
              />
              <View className="w-full flex-row gap-3">
                <Pressable
                  onPress={() => setShowPasswordConfirm(false)}
                  className="flex-1 py-3 bg-white border border-[#E8E8E8] rounded-xl items-center active:opacity-75"
                >
                  <Text className="text-[#6B7280] font-semibold text-sm">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmPassword}
                  className="flex-1 py-3 bg-[#0D8A72] rounded-xl items-center active:opacity-75"
                >
                  <Text className="text-[#F5F5F5] font-bold text-sm">Confirm</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
        <Toast config={toastConfig} />
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Logout Confirmation Modal
// ─────────────────────────────────────────────
function LogoutModal({
  visible,
  onCancel,
  onConfirm,
  loggingOut,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loggingOut: boolean;
}) {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in — spring scale up + fade in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next open
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleCancel = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 150,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onCancel());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={{ flex: 1, backgroundColor: colors.modalBackdrop, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, opacity: opacityAnim }}
      >
        {/* Card */}
        <Animated.View
          style={{
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 28,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          {/* Icon */}
          <View className="w-16 h-16 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: colors.dangerBg }}
          >
            <Ionicons name="log-out-outline" size={32} color={colors.dangerText} />
          </View>

          {/* Text */}
          <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
            Log Out?
          </Text>
          <Text className="text-sm text-center leading-5 mb-8" style={{ color: colors.textSecondary }}>
            Are you sure you want to log out of your AlertZone account?
          </Text>

          {/* Buttons */}
          <Pressable
            onPress={onConfirm}
            disabled={loggingOut}
            className="w-full py-4 rounded-2xl items-center mb-3 active:opacity-80"
            style={{ backgroundColor: loggingOut ? (isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.4)') : colors.dangerText }}
          >
            {loggingOut ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Confirm Logout</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleCancel}
            disabled={loggingOut}
            className="w-full py-4 rounded-2xl items-center active:opacity-70"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="font-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Profile Screen
// ─────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollContext();
  const { user, profile, logout } = useAuth();
  const { theme, isDark, colors, toggleTheme } = useTheme();
  const [personalInfoVisible, setPersonalInfoVisible] = useState(false);
  const [alertPreferencesVisible, setAlertPreferencesVisible] = useState(false);
  const [securityVisible, setSecurityVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count in real-time
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
      console.error("Profile unread count listener error:", err);
    });
    return unsub;
  }, [user?.uid]);

  // ── Show logout confirmation modal ──
  const handleLogoutPress = () => setLogoutVisible(true);

  // ── Confirmed logout ──
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'See you soon!', text2: 'You have been successfully logged out from AlertZone account.' });
    } catch (e) {
      setLoggingOut(false);
      setLogoutVisible(false);
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: 'Please try again.' });
    }
  };

  // Show spinner while profile is loading
  if (!profile) {
    return (
      <LinearGradient colors={isDark ? ['#0D1F2D', '#111E27', '#0D1F2D'] : ['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="mt-4 text-sm" style={{ color: colors.textMuted }}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={isDark ? ['#0D1F2D', '#111E27', '#0D1F2D'] : ['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        decelerationRate="normal"
      >

        {/* ── 1. Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>AlertZone</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications' as any)} className="active:opacity-70">
            <View className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            </View>
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] items-center justify-center">
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── 2. Avatar + Name ── */}
        <View className="items-center mb-6 px-5">
          <Pressable onPress={() => setPersonalInfoVisible(true)} className="active:opacity-80">
            <Image
              source={
                profile.avatarUrl
                  ? { uri: profile.avatarUrl }
                  : require('../../assets/images/iconAlerZone-Bg-none.png')
              }
              className="w-32 h-32 rounded-full"
              style={{ borderWidth: 3, borderColor: colors.primary }}
              resizeMode={profile.avatarUrl ? 'cover' : 'contain'}
            />
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
              style={{ borderWidth: 2, borderColor: colors.card, backgroundColor: colors.primary }}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* ✅ Real data from Firestore via AuthContext */}
          <Text className="text-2xl font-bold mt-3" style={{ color: colors.text }}>{profile.fullName}</Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {profile.role === 'citizen' ? 'Safety Contributor' : profile.role} • Level {profile.level ?? 1}
          </Text>
          {profile.localGovernmentArea && (
            <View className="flex-row items-center mt-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: colors.card + '70', borderColor: colors.border }}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text className="text-xs ml-1 font-medium" style={{ color: colors.textSecondary }}>
                {profile.localGovernmentArea} • {profile.district}
              </Text>
            </View>
          )}
        </View>

        {/* ── 3. Stats ── */}
        <View className="px-5 flex-row gap-3 mb-6">
          <StatCard
            label="Contribution Points"
            value={(profile.contributionPoints ?? 0).toLocaleString()}
            trend={profile.contributionPoints ? '+15% this month' : undefined}
            icon="star-outline"
          />
          <StatCard
            label="Reports Validated"
            value={profile.reportsValidated ?? 0}
            icon="checkmark-circle-outline"
          />
        </View>

        {/* ── 4. Earned Badges ── */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>Earned Badges</Text>
            <Pressable onPress={() => router.push('/badges' as any)} className="active:opacity-70">
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>View All</Text>
            </Pressable>
          </View>
          {(() => {
            const earnedIds = profile.badges ?? [];
            const earnedBadges = BADGE_DEFINITIONS.filter(b => earnedIds.includes(b.id)).slice(0, 4);
            if (earnedBadges.length === 0) {
              return (
                <View
                  className="rounded-2xl items-center py-5"
                  style={{ backgroundColor: colors.cardUnearned, borderWidth: 1, borderColor: colors.border }}
                >
                  <Ionicons name="ribbon-outline" size={28} color={colors.border} />
                  <Text className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>
                    No badges yet — get reports accepted to earn your first one!
                  </Text>
                </View>
              );
            }
            return (
              <View className="flex-row gap-3">
                {earnedBadges.map((badge) => (
                  <BadgeChip key={badge.id} badge={badge} earned />
                ))}
              </View>
            );
          })()}
        </View>

        {/* ── 5. Account Settings ── */}
        <View className="px-5">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>Account Settings</Text>
          <View className="rounded-2xl px-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
          >
            <SettingsRow
              icon="person-outline"
              iconBg={colors.border}
              iconColor={colors.primary}
              label="Personal Information"
              subtitle="Email, phone, and address"
              onPress={() => setPersonalInfoVisible(true)}
            />
            <View className="h-px" style={{ backgroundColor: colors.border }} />
            <SettingsRow
              icon="notifications-outline"
              iconBg={colors.border}
              iconColor={colors.primary}
              label="Alert Preferences"
              subtitle="Notification status and radius"
              onPress={() => setAlertPreferencesVisible(true)}
            />
            <View className="h-px" style={{ backgroundColor: colors.border }} />
            <SettingsRow
              icon="shield-checkmark-outline"
              iconBg={colors.border}
              iconColor={colors.primary}
              label="Security"
              subtitle="Password management and biometrics"
              onPress={() => setSecurityVisible(true)}
            />
            <View className="h-px" style={{ backgroundColor: colors.border }} />
            
            {/* Theme Toggle Button */}
            <View className="flex-row items-center py-3.5">
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3.5"
                style={{ backgroundColor: colors.border }}
              >
                <Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>App Theme</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Toggle app color mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="white"
              />
            </View>

            <View className="h-px" style={{ backgroundColor: colors.border }} />
            <SettingsRow
              icon="log-out-outline"
              iconBg="#FEE2E2"
              iconColor="#DC2626"
              label="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogoutPress}
              danger
            />
          </View>
        </View>

      </ScrollView>

      {/* Personal Info Modal */}
      <PersonalInfoModal visible={personalInfoVisible} onClose={() => setPersonalInfoVisible(false)} />

      {/* Alert Preferences Modal */}
      <AlertPreferencesModal visible={alertPreferencesVisible} onClose={() => setAlertPreferencesVisible(false)} />

      {/* Security Modal */}
      <SecurityModal visible={securityVisible} onClose={() => setSecurityVisible(false)} />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
        loggingOut={loggingOut}
      />
    </LinearGradient>
  );
}