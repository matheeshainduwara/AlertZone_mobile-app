import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/themeContext';

interface PhotoSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export default function PhotoSourceModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: PhotoSourceModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-2 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70 p-2">
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>Add Photo</Text>
          </View>

          <View className="px-5 mt-4 mb-6">
            <Text className="text-xl font-bold mb-1" style={{ color: colors.text }}>Select Photo Source</Text>
            <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
              Choose a source to add photo evidence to your report.
            </Text>
          </View>

          <View className="px-5">
            {/* Camera Option */}
            <Pressable
              onPress={() => {
                onSelectCamera();
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                marginBottom: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
              className="active:opacity-75"
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  backgroundColor: colors.border,
                }}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-bold text-base" style={{ color: colors.text }}>Take Photo</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Use camera to capture live evidence</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            {/* Gallery Option */}
            <Pressable
              onPress={() => {
                onSelectGallery();
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                marginBottom: 24,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
              className="active:opacity-75"
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  backgroundColor: colors.border,
                }}
              >
                <Ionicons name="image" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-bold text-base" style={{ color: colors.text }}>Choose from Gallery</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Select existing photos from library</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
            
            <View className="p-4 rounded-2xl flex-row gap-3"
              style={{ backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.successText} />
              <Text className="text-xs flex-1 leading-5" style={{ color: colors.textSecondary }}>
                <Text style={{ color: colors.successText, fontWeight: 'bold' }}>Privacy Note:</Text> Only the photos you explicitly select will be uploaded and attached to your public report.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
