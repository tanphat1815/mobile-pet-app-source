/**
 * ChatImageRenderer
 *
 * Render 1 image attachment cho chat bubble. Tự co dãn theo container
 * width, giữ aspect ratio. Tap → placeholder (full-screen mở rộng).
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';

interface ChatImageRendererProps {
  uri: string;
  width?: number;
  height?: number;
  maxWidth?: number;
}

export function ChatImageRenderer({
  uri,
  width,
  height,
  maxWidth = 240,
}: ChatImageRendererProps) {
  const theme = useTheme();
  const aspectRatio = width && height ? width / height : 4 / 3;
  const renderWidth = Math.min(maxWidth, width ?? maxWidth);
  const renderHeight = renderWidth / aspectRatio;

  return (
    <Pressable
      testID="chat-image"
      accessibilityRole="image"
      accessibilityLabel="Chat image attachment"
      style={[
        styles.root,
        {
          width: renderWidth,
          height: renderHeight,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceMuted,
        },
      ]}
    >
      <Image
        source={{ uri }}
        style={{
          width: renderWidth,
          height: renderHeight,
          borderRadius: theme.radius.md,
        }}
        resizeMode="cover"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
