import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  BackHandler,
  Pressable,
  DeviceEventEmitter,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 240;

export default function NetworkStatusGate() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleManualCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(connected);
      if (connected) {
        Toast.show({
          type: 'success',
          text1: 'Connected',
          text2: 'Internet connection detected successfully.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Still Offline',
          text2: 'Could not connect. Please check your network settings.',
        });
      }
    } catch (err) {
      console.error('Network check error:', err);
    } finally {
      setChecking(false);
    }
  };

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Monitor Network & Listen to test triggers
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(connected);
    });

    const testSubscription = DeviceEventEmitter.addListener('testOfflineGate', () => {
      setIsConnected(false);
      setWasOffline(true);
      setVisible(true);
    });

    return () => {
      unsubscribe();
      testSubscription.remove();
    };
  }, []);

  // Handle Visibility and Transitions based on connection state
  useEffect(() => {
    if (isConnected === false) {
      // Connection dropped
      setWasOffline(true);
      setVisible(true);
    } else if (isConnected === true && wasOffline) {
      // Reconnected after being offline
      // Wait 1.5 seconds showing success screen, then animate out
      const timeout = setTimeout(() => {
        animateOut();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isConnected, wasOffline]);

  // Trigger animations when visibility changes
  useEffect(() => {
    if (visible) {
      animateIn();
      startSpinning();
    }
  }, [visible]);

  // Block back button on Android when offline gate is active
  useEffect(() => {
    const onBackPress = () => {
      if (visible && isConnected === false) {
        return true; // prevent going back
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, isConnected]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0.65,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.back(0.8)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HEIGHT,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        setWasOffline(false);
        stopSpinning();
      }
    });
  };

  const startSpinning = () => {
    spinValue.setValue(0);
    spinAnimation.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.current.start();
  };

  const stopSpinning = () => {
    if (spinAnimation.current) {
      spinAnimation.current.stop();
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  const isReconnecting = isConnected === false;
  const sheetBg = isReconnecting ? '#7F1D1D' : '#14532D'; // Crimson Red vs Forest Green
  const sheetBorder = isReconnecting ? '#B91C1C' : '#16A34A';
  const subtitleColor = isReconnecting ? '#FCA5A5' : '#A7F3D0';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Darkened backdrop screen cover */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
      />

      {/* Bottom sliding notification card */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: sheetTranslateY }],
            backgroundColor: sheetBg,
            borderColor: sheetBorder,
          },
        ]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.content}>
          {isReconnecting ? (
            // Reconnecting State
            <>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
              <Text style={styles.title}>Looking for Connection</Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                Your internet connection dropped. Reconnecting to AlertZone...
              </Text>
              <Pressable
                onPress={handleManualCheck}
                disabled={checking}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Ionicons name="refresh" size={14} color="#7F1D1D" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>
                  {checking ? 'Checking...' : 'Check Connection'}
                </Text>
              </Pressable>
            </>
          ) : (
            // Reconnected State (Green Theme)
            <>
              <View style={styles.successIconBg}>
                <Ionicons name="checkmark-circle" size={44} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Connection Restored</Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                You are back online. Resuming activity...
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#071318',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 24,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.25,
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3.5,
    borderColor: '#FFFFFF', // White spinner on red background
    borderTopColor: 'transparent',
    marginBottom: 16,
  },
  successIconBg: {
    marginBottom: 12,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '85%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#7F1D1D',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
