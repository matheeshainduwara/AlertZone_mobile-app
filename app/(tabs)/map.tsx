import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import { db } from '../../services/firebase';

// ─────────────────────────────────────────────
// Types
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
  description: string;
  address: string;
  upvoteCount: number;
  createdAt: any;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',               label: 'All',       icon: 'warning-outline',       color: '#F59E0B' },
  { id: 'road_traffic',      label: 'Roads',     icon: 'car-outline',           color: '#4CC2D1' },
  { id: 'water_drainage',    label: 'Water',     icon: 'water-outline',         color: '#60A5FA' },
  { id: 'waste_environment', label: 'Waste',     icon: 'trash-outline',         color: '#34D399' },
  { id: 'social_safety',     label: 'Safety',    icon: 'shield-outline',        color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Structural',icon: 'git-network-outline',   color: '#F59E0B' },
];

const DEFAULT_REGION = {
  latitude: 6.8900,
  longitude: 79.8950,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

const STATUS_COLOR: Record<string, string> = {
  PENDING:  '#F59E0B',
  ASSIGNED: '#60A5FA',
  FIXING:   '#4CC2D1',
  RESOLVED: '#30A89C',
  REJECTED: '#E05C5C',
};

// ─────────────────────────────────────────────
// Map Screen
// ─────────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [reports, setReports]               = useState<ReportPin[]>([]);
  const [activeFilter, setActiveFilter]     = useState('all');
  const [selectedPin, setSelectedPin]       = useState<ReportPin | null>(null);
  const [searchText, setSearchText]         = useState('');
  const [region, setRegion]                 = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);

  // ── Subscribe to Firestore reports (non-archived, non-resolved) ──
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const pins: ReportPin[] = snap.docs
        .map((d) => {
          const data = d.data();
          if (!data.location?.latitude || !data.location?.longitude) return null;
          return {
            id: d.id,
            title: data.title ?? data.category ?? 'Report',
            categoryId: data.categoryId ?? 'road_traffic',
            categoryIcon: data.categoryIcon ?? 'warning-outline',
            categoryColor: data.categoryColor ?? '#4CC2D1',
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            status: data.status ?? 'PENDING',
            description: data.description ?? '',
            address: data.location.address ?? '',
            upvoteCount: data.upvoteCount ?? 0,
            createdAt: data.createdAt,
          } as ReportPin;
        })
        .filter(Boolean) as ReportPin[];
      setReports(pins);
    }, (err) => {
      console.error('❌ Map Firestore error:', err);
    });

    return unsub;
  }, []);

  // ── Request location permission ──
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const userRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 800);
    })();
  }, []);

  const zoomIn = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const zoomOut = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta * 2, longitudeDelta: region.longitudeDelta * 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const goToMyLocation = async () => {
    if (!locationGranted) return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const r = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setRegion(r);
    mapRef.current?.animateToRegion(r, 800);
  };

  // ── Filter pins by category + search ──
  const filteredPins = reports.filter((pin) => {
    const matchesCategory = activeFilter === 'all' || pin.categoryId === activeFilter;
    const matchesSearch = searchText.trim() === '' ||
      pin.title.toLowerCase().includes(searchText.toLowerCase()) ||
      pin.address.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#071318' }}>

      {/* ── Google Map ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => setSelectedPin(pin)}
          >
            <View style={{
              backgroundColor: pin.categoryColor,
              borderRadius: 20, padding: 6,
              borderWidth: 2, borderColor: 'white',
              shadowColor: pin.categoryColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,
            }}>
              <Ionicons name={pin.categoryIcon as any} size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Search + Filter overlay ── */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16 }}>
        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#111E27', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 10,
          borderWidth: 1, borderColor: '#1E3347', marginBottom: 10,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
        }}>
          <Ionicons name="search-outline" size={18} color="#3A6070" />
          <TextInput
            placeholder="Search location or issue…"
            placeholderTextColor="#3A6070"
            value={searchText}
            onChangeText={setSearchText}
            style={{ flex: 1, color: 'white', fontSize: 14, marginLeft: 10, padding: 0 }}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#3A6070" />
            </Pressable>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => { setActiveFilter(chip.id); setSelectedPin(null); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 7,
                    backgroundColor: isActive ? '#1E3A44' : 'rgba(17,30,39,0.9)',
                    borderRadius: 20, borderWidth: 1,
                    borderColor: isActive ? chip.color : '#1E3347',
                  }}
                >
                  <Ionicons name={chip.icon as any} size={13} color={isActive ? chip.color : '#5A7D8A'} />
                  <Text style={{ color: isActive ? chip.color : '#5A7D8A', fontSize: 12, fontWeight: '600' }}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Report count badge */}
      {reports.length > 0 && (
        <View style={{
          position: 'absolute', top: insets.top + 8, right: 16,
          backgroundColor: '#4CC2D1', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
          display: 'none', // hidden — counts are visible in filter chips
        }} />
      )}

      {/* ── Zoom + locate controls ── */}
      <View style={{ position: 'absolute', right: 16, bottom: selectedPin ? 260 : 130 }}>
        <Pressable onPress={goToMyLocation} style={{
          width: 40, height: 40, backgroundColor: '#4CC2D1',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}>
          <Ionicons name="navigate" size={18} color="#071318" />
        </Pressable>
        <Pressable onPress={zoomIn} style={{
          width: 40, height: 40, backgroundColor: '#111E27',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#1E3347', marginBottom: 8,
        }}>
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
        <Pressable onPress={zoomOut} style={{
          width: 40, height: 40, backgroundColor: '#111E27',
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#1E3347',
        }}>
          <Ionicons name="remove" size={20} color="white" />
        </Pressable>
      </View>

      {/* ── Selected pin popup ── */}
      {selectedPin && (
        <View style={{
          position: 'absolute', bottom: 110, left: 16, right: 16,
          backgroundColor: '#111E27', borderRadius: 20, padding: 16,
          borderWidth: 1, borderColor: '#1E3347',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
        }}>
          {/* Status pill */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{
              backgroundColor: (STATUS_COLOR[selectedPin.status] ?? '#F59E0B') + '22',
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: STATUS_COLOR[selectedPin.status] ?? '#F59E0B',
            }}>
              <Text style={{ color: STATUS_COLOR[selectedPin.status] ?? '#F59E0B', fontSize: 11, fontWeight: '700' }}>
                {selectedPin.status}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedPin(null)}>
              <Ionicons name="close" size={20} color="#3A6070" />
            </Pressable>
          </View>

          {/* Main content row */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: selectedPin.categoryColor + '22',
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <Ionicons name={selectedPin.categoryIcon as any} size={22} color={selectedPin.categoryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                {selectedPin.title}
              </Text>
              <Text style={{ color: '#5A7D8A', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {selectedPin.address}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="arrow-up-circle-outline" size={13} color="#4CC2D1" />
                  <Text style={{ color: '#4CC2D1', fontSize: 11, fontWeight: '600' }}>
                    {selectedPin.upvoteCount} upvotes
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description preview */}
          {selectedPin.description.length > 0 && (
            <Text style={{ color: '#5A7D8A', fontSize: 12, marginTop: 10, lineHeight: 17 }} numberOfLines={2}>
              {selectedPin.description}
            </Text>
          )}
        </View>
      )}

      {/* ── No pin selected hint ── */}
      {!selectedPin && (
        <View style={{
          position: 'absolute', bottom: 110, left: 16, right: 16,
          backgroundColor: 'rgba(17,30,39,0.85)', borderRadius: 16,
          paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          borderWidth: 1, borderColor: '#1E3347',
        }}>
          <Ionicons name="information-circle-outline" size={18} color="#3A6070" />
          <Text style={{ color: '#3A6070', fontSize: 12, flex: 1 }}>
            {reports.length === 0
              ? 'No active reports yet — be the first to report!'
              : `${filteredPins.length} report${filteredPins.length !== 1 ? 's' : ''} shown · Tap a pin for details`}
          </Text>
        </View>
      )}

    </View>
  );
}