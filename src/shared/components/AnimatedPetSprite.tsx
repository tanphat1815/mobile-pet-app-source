/**
 * AnimatedPetSprite
 *
 * Component render pet sprite với FSM-driven frame animation. Port pattern
 * từ desktop `src/renderer/pet-mount.js` + Reanimated worklets.
 *
 * Approach hiện tại (chưa có PNG asset):
 *   - Render emoji thay cho PNG (Pet.emoji)
 *   - Animate `transform.scale` + `transform.rotate` theo `frameIndex`
 *     → tạo cảm giác "frame loop" mà không cần sprite sheet
 *   - Mỗi animation key có 1 set biến đổi riêng (tương ứng frame N)
 *
 * Khi có PNG asset thật (Step 33 follow-up):
 *   - Thay emoji bằng `expo-image` với frame crops từ sprite sheet
 *   - Function `renderFrame()` chỉ cần đổi implementation
 *   - FSM/animations manifest không cần thay đổi
 *
 * Step 3 — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {
  ALL_SPRITE_ANIM_KEYS,
  SpriteAnimKey,
} from '../../api/spriteConfig';
import {
  resolvePetAnimationWithFallback,
} from '../../api/petFSM';
import type { Pet, PetAction } from '../../api/petTypes';
import { defaultEmoji } from '../../api/petTypes';
import { useReducedMotion } from '../../utils/useReducedMotion';
import { useTheme } from '../../utils/useTheme';

// ============================================================================
// Frame Animation Definitions
// ============================================================================

/**
 * Mỗi animation key khai báo:
 *   - scale pattern: array of [start, end] scales cho mỗi frame segment
 *   - rotate pattern: degrees cho mỗi frame
 *   - duration: tổng thời gian 1 cycle (ms)
 *
 * Tổng frame = scale.length. Emoji + scale + rotate → mô phỏng animation.
 */
interface FrameAnimDef {
  scales: number[];        // length = số frame
  rotates: number[];       // degrees, length = scales.length
  durationMs: number;      // tổng cycle time
}

const ANIM_DEFS: Record<SpriteAnimKey, FrameAnimDef> = {
  idle:      { scales: [1, 1.03, 1, 1.03, 1],         rotates: [0, 0, 0, 0, 0],            durationMs: 1500 },
  walk:      { scales: [1, 1.04, 1, 1.04, 1],         rotates: [-3, 3, -3, 3, -3],        durationMs: 800 },
  sleep:     { scales: [1, 1, 1.02, 1, 1.02, 1],      rotates: [0, 0, -2, 0, -2, 0],       durationMs: 3000 },
  sit:       { scales: [1, 1.02, 1],                   rotates: [0, -1, 0],                durationMs: 1200 },
  dance:     { scales: [1, 1.1, 0.95, 1.1, 1, 1.1],   rotates: [-8, 0, 5, 0, -8, 0],      durationMs: 1200 },
  shocked:   { scales: [1, 1.2, 1.05, 1.15, 1],       rotates: [0, -3, 2, -2, 0],          durationMs: 900 },
  cry:       { scales: [1, 0.96, 1, 0.96, 1],          rotates: [-2, 2, -2, 2, -2],        durationMs: 1800 },
  box_idle:  { scales: [1, 1.03, 1, 1.03, 1],         rotates: [0, 0, 0, 0, 0],            durationMs: 1500 },
  box_play:  { scales: [1, 1.08, 1, 1.08, 1],          rotates: [-5, 5, -5, 5, -5],        durationMs: 700 },
  box_sit:   { scales: [1, 1.02, 1],                   rotates: [0, 1, 0],                 durationMs: 1200 },
  jump:      { scales: [1, 1.15, 1.3, 1.15, 1, 1, 1], rotates: [0, -5, 0, 5, 0, 0, 0],     durationMs: 1000 },
  happy:     { scales: [1, 1.08, 1, 1.08, 1],         rotates: [-3, 3, -3, 3, -3],        durationMs: 800 },
  excited:   { scales: [1, 1.1, 1, 1.1, 1.05],        rotates: [-6, 6, -6, 6, 0],         durationMs: 700 },
  hurt:      { scales: [1, 0.92, 1, 0.92, 1],          rotates: [0, -2, 0, 2, 0],          durationMs: 1100 },
  attack:    { scales: [1, 0.85, 1.2, 1, 1.05, 1],    rotates: [0, 0, 5, -2, 0, 0],       durationMs: 800 },
  tickle:    { scales: [1, 1.05, 0.95, 1.05, 1],      rotates: [-2, 2, -2, 2, -2],        durationMs: 900 },
  eat:       { scales: [1, 1.04, 1, 1.04, 1, 1.02],   rotates: [0, -1, 1, -1, 1, 0],      durationMs: 1300 },
  drink:     { scales: [1, 1.05, 1, 1.05, 1],         rotates: [0, 2, 0, -2, 0],          durationMs: 1400 },
  wave:      { scales: [1, 1.05, 1, 1.05, 1],          rotates: [-8, 8, -8, 8, -8],        durationMs: 1100 },
  dead1:     { scales: [1, 1, 1, 1, 1],                rotates: [90, 90, 90, 90, 90],      durationMs: 1000 },
  dead2:     { scales: [1, 0.95, 1, 0.95, 1],          rotates: [90, 90, 90, 90, 90],      durationMs: 2000 },
};

/** Tất cả species đều có chung animation set nên hasAnim luôn true. */
function hasAnimForAllSpecies(key: SpriteAnimKey): boolean {
  return ALL_SPRITE_ANIM_KEYS.includes(key);
}

// ============================================================================
// Component
// ============================================================================

export interface AnimatedPetSpriteProps {
  pet: Pet | null;
  /** Optional explicit action — sẽ override FSM mood. */
  action?: PetAction;
  /** Size mỗi chiều của pet (vuông). Mặc định 96. */
  size?: number;
  /** Override emoji (nếu không truyền → dùng pet.emoji hoặc default). */
  emojiOverride?: string;
  /** Apply theme accent ring (giống PetAvatar). */
  showMoodRing?: boolean;
  /** Respect reduced motion preference */
  reducedMotion?: boolean;
  /** Style override cho container. */
  style?: ViewStyle;
}

export function AnimatedPetSprite({
  pet,
  action,
  size = 96,
  emojiOverride,
  showMoodRing = true,
  style,
}: AnimatedPetSpriteProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  // Resolve anim qua FSM
  const animKey: SpriteAnimKey = useMemo(() => {
    if (!pet) return 'idle';
    return resolvePetAnimationWithFallback(pet, hasAnimForAllSpecies, action);
  }, [pet, action]);

  // Animation shared values
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Drive animation
  useEffect(() => {
    const def = ANIM_DEFS[animKey] ?? ANIM_DEFS.idle;
    const frameCount = def.scales.length;
    if (frameCount === 0) return;

    cancelAnimation(scale);
    cancelAnimation(rotate);

    if (reducedMotion) {
      scale.value = 1;
      rotate.value = def.rotates[0] ?? 0;
      return;
    }

    const segDuration = def.durationMs / frameCount;

    // Build sequence
    const scaleSequence = def.scales.map((s) =>
      withTiming(s, { duration: segDuration, easing: Easing.inOut(Easing.sin) })
    );
    const rotateSequence = def.rotates.map((r) =>
      withTiming(r, { duration: segDuration, easing: Easing.inOut(Easing.sin) })
    );

    scale.value = withRepeat(withSequence(...scaleSequence), -1, false);
    rotate.value = withRepeat(withSequence(...rotateSequence), -1, false);

    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, [animKey, reducedMotion, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const emoji = emojiOverride ?? pet?.emoji ?? defaultEmoji(pet?.species ?? 'cat');

  // Mood ring color (giữ logic từ PetAvatar)
  const ringColor = pet ? moodRingColor(pet.mood, theme.colors.accent) : theme.colors.borderStrong;

  // Dev debug info — read via __PET_FSM_DEBUG__ từ PetSpriteDebugProvider
  // (mounted ở root, stable across re-renders)

  return (
    <View
      testID="pet-sprite"
      accessibilityLabel={`Pet ${pet?.species ?? 'unknown'} animation ${animKey}`}
      style={[
        styles.root,
        { width: size, height: size },
        showMoodRing && {
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: ringColor,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      <Animated.View
        testID={`pet-sprite-frame-${animKey}`}
        style={[
          styles.frame,
          { width: size - 8, height: size - 8 },
          animatedStyle,
        ]}
      >
        <Text
          style={{ fontSize: size * 0.7, textAlign: 'center', lineHeight: size * 0.85 }}
        >
          {emoji}
        </Text>
      </Animated.View>
      {/* Hidden diagnostic text cho e2e */}
      <Text
        testID="pet-sprite-anim-key"
        style={styles.hidden}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {animKey}
      </Text>
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function moodRingColor(mood: Pet['mood'], accent: string): string {
  switch (mood) {
    case 'happy': return '#FF9F1C';
    case 'sad': return '#FFB6C1';
    case 'eating': return '#FFB627';
    case 'sleeping': return '#B8B0A0';
    case 'playing': return accent;
    case 'idle':
    default: return '#D8D0C2';
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
