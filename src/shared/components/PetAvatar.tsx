/**
 * PetAvatar
 *
 * Wrapper cho AnimatedPetSprite. Giữ prop interface cũ để các caller không
 * cần thay đổi. Step 3 — dùng AnimatedPetSprite cho multi-species FSM animation.
 *
 * Fallback: nếu không có pet → render mood emoji đơn.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { AnimatedPetSprite } from './AnimatedPetSprite';
import type { Pet } from '../../api/petTypes';

export interface PetAvatarProps {
  pet: Pet | null;
  size?: number;
  reducedMotion?: boolean;
  /** Override default action — sẽ force 1 FSM animation */
  action?: 'feed' | 'play' | 'sleep' | 'pet';
  /** Tắt mood ring */
  noRing?: boolean;
}

export function PetAvatar({ pet, size = 140, reducedMotion, action, noRing }: PetAvatarProps) {
  const theme = useTheme();

  if (!pet) {
    return (
      <View
        testID="pet-avatar-empty"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: size * 0.5 }}>🐾</Text>
      </View>
    );
  }

  return (
    <AnimatedPetSprite
      pet={pet}
      size={size}
      action={action}
      showMoodRing={!noRing}
      reducedMotion={reducedMotion}
    />
  );
}
