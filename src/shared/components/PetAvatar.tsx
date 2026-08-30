/**
 * PetAvatar
 *
 * Big circular display of the pet's avatar (emoji or image URL) with
 * a mood ring around it. Mood color changes the ring color.
 */

import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { Pet, defaultEmoji } from '../../api/petTypes';

export interface PetAvatarProps {
  pet: Pet;
  size?: number;
  reducedMotion?: boolean;
}

function moodColor(mood: Pet['mood'], theme: ReturnType<typeof useTheme>): string {
  switch (mood) {
    case 'happy':
      return theme.colors.success;
    case 'sad':
      return theme.colors.danger;
    case 'eating':
      return theme.colors.warning;
    case 'sleeping':
      return '#8E8E93';
    case 'playing':
      return theme.colors.accent;
    case 'idle':
    default:
      return theme.colors.border;
  }
}

function moodEmoji(mood: Pet['mood']): string {
  switch (mood) {
    case 'happy':
      return '😊';
    case 'sad':
      return '😢';
    case 'eating':
      return '😋';
    case 'sleeping':
      return '😴';
    case 'playing':
      return '🥳';
    case 'idle':
    default:
      return '😐';
  }
}

export function PetAvatar({ pet, size = 140, reducedMotion = false }: PetAvatarProps) {
  const theme = useTheme();
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      wobble.value = 0;
      return;
    }
    wobble.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reducedMotion, wobble]);

  const ringColor = moodColor(pet.mood, theme);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value * 3 - 1.5}deg` }],
  }));

  const ringWidth = 6;
  const ringPadding = 6;

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size + ringWidth * 2 + ringPadding * 2,
            height: size + ringWidth * 2 + ringPadding * 2,
            borderRadius: (size + ringWidth * 2 + ringPadding * 2) / 2,
            borderColor: ringColor,
            borderWidth: ringWidth,
            backgroundColor: theme.colors.surface,
          },
          animatedStyle,
        ]}
      >
        {pet.avatarUrl ? (
          <Image
            source={{ uri: pet.avatarUrl }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          />
        ) : (
          <Text style={{ fontSize: size * 0.55 }}>
            {pet.emoji ?? defaultEmoji(pet.species)}
          </Text>
        )}
      </Animated.View>
      <View
        style={[
          styles.moodBadge,
          {
            backgroundColor: ringColor,
            borderColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{moodEmoji(pet.mood)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});