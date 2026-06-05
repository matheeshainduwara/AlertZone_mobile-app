import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../config/authConfig';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// Keep the native splash visible while we set up
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, loading, isProfileComplete } = useAuth();
  const [isOffline, setIsOffline] = useState(false);

  // ── Animation values ──────────────────────────────────────────────────────
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.6)).current;
  const pulseScale     = useRef(new Animated.Value(1)).current;
  const pulseOpacity   = useRef(new Animated.Value(0.6)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // ── Routing state (refs avoid stale closure issues) ───────────────────────
  const minTimeElapsed = useRef(false);
  const navigated      = useRef(false);
  // Mirror latest values in refs so timer callbacks always read current state
  const loadingRef     = useRef(loading);
  const userRef        = useRef(user);
  const profileCompleteRef = useRef(isProfileComplete);

  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { userRef.current    = user;    }, [user]);
  useEffect(() => { profileCompleteRef.current = isProfileComplete; }, [isProfileComplete]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const tryNavigate = async () => {
    // Both conditions must be met: auth resolved + min display time elapsed
    if (navigated.current || loadingRef.current || !minTimeElapsed.current) return;
    navigated.current = true;

    try {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!seen) {
        router.replace('/onboarding');
      } else if (!userRef.current) {
        router.replace('/(auth)/loginScreen');
      } else if (!profileCompleteRef.current) {
        router.replace('/(auth)/completeProfile' as any);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch {
      router.replace('/onboarding');
    }
  };

  // After minimum display time → attempt navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryNavigate();
    }, 2200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever auth state resolves → attempt navigation
  useEffect(() => {
    if (!loading) {
      tryNavigate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Listen to network status on startup
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      // Always attempt navigation once loaded (online or offline)
      tryNavigate();
    });
    return () => unsubscribe();
  }, []);

  const retryConnection = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      setIsOffline(false);
      tryNavigate();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Still Offline',
        text2: 'Please check your internet connection and try again.',
      });
    }
  };

  // ── Animations ────────────────────────────────────────────────────────────
  useEffect(() => {
    SplashScreen.hideAsync();

    // Logo fade + scale in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // "AlertZone" text fades in after logo
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline fades in after text
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing ring — looping
    const pulse = () => {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.9,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) pulse();
      });
    };

    const pulseTimer = setTimeout(pulse, 400);
    return () => clearTimeout(pulseTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {/* Subtle radial glow behind logo */}
      <View style={styles.glowOuter}>
        <View style={styles.glowInner} />
      </View>

      {/* Pulsing ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      />

      {/* Second pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          styles.pulseRing2,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../assets/images/iconAlerZone-Bg-none.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, marginTop: 16, flexDirection: 'row' }}>
        <Text style={styles.titleWhite}>Alert</Text>
        <Text style={styles.titleTeal}>Zone</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Stay Aware. Stay Safe.
      </Animated.Text>

      {isOffline ? (
        <Animated.View style={[styles.offlineContainer, { opacity: taglineOpacity }]}>
          <Ionicons name="cloud-offline-outline" size={28} color="#E05C5C" />
          <Text style={styles.offlineText}>No internet connection detected.</Text>
          <Pressable onPress={retryConnection} style={styles.retryButton} className="active:opacity-80">
            <Ionicons name="refresh" size={14} color="#071318" style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </Animated.View>
      ) : (
        /* Loading dots */
        <Animated.View style={[styles.dotsContainer, { opacity: taglineOpacity }]}>
          <LoadingDots />
        </Animated.View>
      )}
    </View>
  );
}

// ── Animated loading dots ────────────────────────────────────────────────────
function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1F2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#30A89C',
    opacity: 0.07,
  },
  glowInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4CC2D1',
    opacity: 0.07,
    alignSelf: 'center',
    top: 60,
    left: 60,
  },
  pulseRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: '#30A89C',
  },
  pulseRing2: {
    borderColor: '#4CC2D1',
    borderWidth: 1.5,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleWhite: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleTeal: {
    color: '#30A89C',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    color: '#7BA8B5',
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#30A89C',
  },
  offlineContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  offlineText: {
    color: '#7BA8B5',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#4CC2D1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#4CC2D1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  retryButtonText: {
    color: '#071318',
    fontSize: 12,
    fontWeight: '700',
  },
});