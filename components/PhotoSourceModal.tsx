import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-2 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70 p-2">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Add Photo</Text>
          </View>

          <View className="px-5 mt-4 mb-6">
            <Text className="text-white text-xl font-bold mb-1">Select Photo Source</Text>
            <Text className="text-gray-400 text-sm leading-5">
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
              className="flex-row items-center p-4 mb-4 rounded-2xl bg-[#111E27] active:bg-[#1E3347]/70"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center mr-4">
                <Ionicons name="camera" size={24} color="#4CC2D1" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Take Photo</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Use camera to capture live evidence</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3A6070" />
            </Pressable>

            {/* Gallery Option */}
            <Pressable
              onPress={() => {
                onSelectGallery();
                onClose();
              }}
              className="flex-row items-center p-4 mb-6 rounded-2xl bg-[#111E27] active:bg-[#1E3347]/70"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              <View className="w-12 h-12 rounded-xl bg-[#0D1A3D] items-center justify-center mr-4">
                <Ionicons name="image" size={24} color="#4CC2D1" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Choose from Gallery</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Select existing photos from library</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3A6070" />
            </Pressable>
            
            <View className="p-4 rounded-2xl flex-row gap-3"
              style={{ backgroundColor: '#1A2D1A', borderWidth: 1, borderColor: '#1E4D1E' }}>
              <Ionicons name="information-circle-outline" size={20} color="#34D399" />
              <Text className="text-gray-400 text-xs flex-1 leading-5">
                <Text className="text-[#34D399] font-semibold">Privacy Note:</Text> Only the photos you explicitly select will be uploaded and attached to your public report.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}
