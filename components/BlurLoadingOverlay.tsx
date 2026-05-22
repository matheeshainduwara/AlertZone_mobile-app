import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface BlurLoadingOverlayProps {
  visible: boolean;
  statusText?: string;
  subStatusText?: string;
}

export default function BlurLoadingOverlay({
  visible,
  statusText = 'Submitting Report',
  subStatusText = 'Uploading details...',
}: BlurLoadingOverlayProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let rotationAnimation: Animated.CompositeAnimation | null = null;
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (visible) {
      // Start rotating animation
      rotationAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();

      // Start pulsing animation
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1.0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    } else {
      // Reset values when hidden
      rotation.setValue(0);
      pulse.setValue(1);
    }

    return () => {
      if (rotationAnimation) rotationAnimation.stop();
      if (pulseAnimation) pulseAnimation.stop();
    };
  }, [visible, rotation, pulse]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={StyleSheet.absoluteFill} className="bg-[#071318]/90">
        {/* Quadruple-layered BlurView for extreme blur density */}
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <BlurView
          intensity={100}
          tint="dark"
          style={StyleSheet.absoluteFill}
          className="justify-center items-center px-8"
        >
          <View className="items-center justify-center">
            {/* Spinning & Pulsing Animation Container */}
            <View className="relative w-32 h-32 items-center justify-center mb-8">
              {/* Glowing background */}
              <View
                className="absolute w-24 h-24 rounded-full bg-[#4CC2D1]/10 border border-[#4CC2D1]/20 shadow-2xl"
                style={{
                  shadowColor: '#4CC2D1',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              />

              {/* Rotating Crescent Ring */}
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
              />

              {/* Pulsing Icon */}
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <Ionicons name="cloud-upload" size={44} color="#4CC2D1" />
              </Animated.View>
            </View>

            {/* Status Text Header */}
            <Text className="text-white text-xl font-bold tracking-wide text-center mb-2">
              {statusText}
            </Text>

            {/* Sub Status Text Description */}
            {subStatusText ? (
              <Text className="text-[#4CC2D1] text-xs font-semibold text-center uppercase tracking-widest px-4">
                {subStatusText}
              </Text>
            ) : null}

            {/* Premium Instruction Label */}
            <Text className="text-gray-400 text-sm text-center leading-5 mt-6 px-6">
              Please keep the app open. We are encrypting and uploading your submission to AlertZone.
            </Text>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  spinner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#4CC2D1',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});
