/**
 * ImagePickerSheet
 *
 * Bottom sheet chọn image source: Camera / Library. Trả về URI + dims
 * cho caller gửi qua store.
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (uri: string, width: number, height: number) => void;
}

export function ImagePickerSheet({
  visible,
  onClose,
  onPick,
}: ImagePickerSheetProps) {
  const theme = useTheme();

  const handleCamera = () => {
    hapticLight();
    Alert.alert(
      'Camera',
      'Trên web (Playwright test) sẽ dùng mock image. Trên mobile native, sẽ mở expo-image-picker.launchCameraAsync() và trả về URI.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pick mock',
          onPress: () => {
            onPick('https://placekitten.com/400/300', 400, 300);
            onClose();
          },
        },
      ]
    );
  };

  const handleLibrary = () => {
    hapticLight();
    Alert.alert(
      'Library',
      'Trên web sẽ dùng mock image. Trên mobile native sẽ mở expo-image-picker.launchImageLibraryAsync().',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pick mock',
          onPress: () => {
            onPick('https://placekitten.com/500/400', 500, 400);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      title="Send an image"
      contentStyle={{ maxWidth: 480, width: '100%' }}
    >
      <View style={{ padding: 4 }}>
        <Pressable
          testID="image-source-camera"
          onPress={handleCamera}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed
                ? theme.colors.surfaceMuted
                : theme.colors.surface2,
            },
          ]}
        >
          <Text style={styles.icon}>📷</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
              Camera
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              Take a new photo
            </Text>
          </View>
        </Pressable>

        <Pressable
          testID="image-source-library"
          onPress={handleLibrary}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed
                ? theme.colors.surfaceMuted
                : theme.colors.surface2,
            },
          ]}
        >
          <Text style={styles.icon}>🖼️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
              Library
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              Choose from your photos
            </Text>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginVertical: 4,
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
});
