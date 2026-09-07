/**
 * AvatarFrame
 *
 * Wrap avatar với border frame + glow effect (optional).
 * Step 7 — xem docs/steps/step-07-rich-profile.md.
 */

import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AvatarFrameDef } from '../../api/avatarFrames';

export interface AvatarFrameProps {
  frame: AvatarFrameDef | undefined;
  size: number;
  source?: ImageSourcePropType;
  fallbackEmoji?: string;
  testID?: string;
  /** Trigger unlock animation khi true */
  celebrate?: boolean;
}

export function AvatarFrame({
  frame,
  size,
  source,
  fallbackEmoji = '🐶',
  testID,
  celebrate = false,
}: AvatarFrameProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (celebrate) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 240, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 360, easing: Easing.inOut(Easing.quad) })
      );
    }
  }, [celebrate, scale]);

  const inner = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const f = frame ?? {
    id: 'none',
    name: 'None',
    price: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    rarity: 'common' as const,
  };

  const total = size + 2 * f.borderWidth;
  const innerSize = size;

  return (
    <Animated.View
      testID={testID ?? `avatar-frame-${f.id}`}
      style={[
        styles.outer,
        {
          width: total,
          height: total,
          borderRadius: total / 2,
          borderWidth: f.borderWidth,
          borderColor: f.borderColor,
          shadowColor: f.glowColor ?? 'transparent',
          shadowOpacity: f.glowColor ? 0.7 : 0,
          shadowRadius: f.glowColor ? 8 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: f.glowColor ? 6 : 0,
        },
        inner,
      ]}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F3F4F6',
        }}
      >
        {source ? (
          <Image
            source={source}
            style={{ width: innerSize, height: innerSize }}
          />
        ) : (
          <Text style={{ fontSize: innerSize * 0.6 }}>{fallbackEmoji}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
