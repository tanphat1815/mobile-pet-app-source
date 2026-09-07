/**
 * ThemeDecorations
 *
 * Render overlay particle effect + corner emojis theo theme. Đặt absolute
 * trên root, pointerEvents='none' để không chặn tap. Số particle giới hạn
 * theo MAX_PARTICLES để giữ performance.
 *
 * Reference: desktop `app-themes.js` decorations (snowflakes/ghost/confetti/...).
 *
 * Step 2 (Seasonal + Premium themes parity) — xem docs/steps/step-02-seasonal-premium-themes.md.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  AppThemeDecorations,
  ParticleKind,
} from '../../utils/appThemes';
import { useReducedMotion } from '../../utils/useReducedMotion';

const MAX_PARTICLES = 16;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ============================================================================
// Particle glyphs per kind
// ============================================================================

const PARTICLE_GLYPHS: Record<Exclude<ParticleKind, 'none'>, string[]> = {
  snowflakes: ['❄', '❅', '✻', '❆'],
  ghost: ['👻', '👻', '👻'],
  confetti: ['🎊', '🎉', '🎈', '✨', '🎀'],
  fireworks: ['✨', '🎆', '🎇', '✺'],
  matrix: ['0', '1', 'ア', 'カ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ'],
  hearts: ['💖', '💗', '💕', '💝'],
};

interface ParticleConfig {
  glyph: string;
  startX: number;
  endY: number;
  duration: number;
  delay: number;
  rotation?: number;
}

function generateParticles(kind: Exclude<ParticleKind, 'none'>): ParticleConfig[] {
  const glyphs = PARTICLE_GLYPHS[kind];
  const count = MAX_PARTICLES;
  return Array.from({ length: count }, (_, i) => {
    const glyph = glyphs[i % glyphs.length];
    return {
      glyph,
      startX: Math.random() * SCREEN_W,
      endY: SCREEN_H + 60,
      duration: kind === 'fireworks' ? 1500 + Math.random() * 1500 : 6000 + Math.random() * 6000,
      delay: Math.random() * 4000,
      rotation: kind === 'matrix' ? 0 : (Math.random() - 0.5) * 30,
    };
  });
}

// ============================================================================
// Single Particle
// ============================================================================

interface ParticleProps {
  config: ParticleConfig;
  color: string;
  size: number;
  reducedMotion: boolean;
}

function Particle({ config, color, size, reducedMotion }: ParticleProps) {
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(reducedMotion ? 0.6 : 0);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = SCREEN_H * 0.5;
      opacity.value = 0.6;
      return;
    }
    translateY.value = -40;
    opacity.value = 0;
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.endY, {
          duration: config.duration,
          easing: Easing.in(Easing.linear),
        }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(0.7, { duration: config.duration / 2 }),
        -1,
        true
      )
    );
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [reducedMotion, config, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${config.rotation ?? 0}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      testID="theme-particle"
      style={[
        styles.particle,
        { left: config.startX, color, fontSize: size },
        animatedStyle,
      ]}
    >
      {config.glyph}
    </Animated.Text>
  );
}

// ============================================================================
// Corner decorations
// ============================================================================

interface CornerProps {
  glyph: string;
  corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  color: string;
  size: number;
  reducedMotion: boolean;
}

function Corner({ glyph, corner, color, size, reducedMotion }: CornerProps) {
  const scale = useSharedValue(reducedMotion ? 1 : 0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(0.5, { duration: 800 });
    if (!reducedMotion) {
      scale.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [reducedMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const cornerStyle = {
    topLeft: { top: themeSpacing.xl, left: themeSpacing.lg },
    topRight: { top: themeSpacing.xl, right: themeSpacing.lg },
    bottomLeft: { bottom: themeSpacing.xxl, left: themeSpacing.lg },
    bottomRight: { bottom: themeSpacing.xxl, right: themeSpacing.lg },
  }[corner];

  return (
    <Animated.Text
      testID={`theme-corner-${corner}`}
      style={[styles.corner, cornerStyle, { color, fontSize: size }, animatedStyle]}
    >
      {glyph}
    </Animated.Text>
  );
}

// ============================================================================
// Main Decorations
// ============================================================================

const themeSpacing = { xl: 20, lg: 16, xxl: 24 }; // Mirror theme.spacing

interface ThemeDecorationsProps {
  decorations: AppThemeDecorations;
  textColor: string; // Particle tint from theme tokens
}

export function ThemeDecorations({ decorations, textColor }: ThemeDecorationsProps) {
  const reducedMotion = useReducedMotion();
  const particles = useMemo(() => {
    if (decorations.particles === 'none') return [];
    return generateParticles(decorations.particles);
  }, [decorations.particles]);

  const corners = decorations.corners;
  if (particles.length === 0 && !corners) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {particles.map((p, i) => (
        <Particle
          key={i}
          config={p}
          color={textColor}
          size={20}
          reducedMotion={reducedMotion}
        />
      ))}
      {corners ? (
        <>
          <Corner glyph={corners[0]} corner="topLeft" color={textColor} size={32} reducedMotion={reducedMotion} />
          <Corner glyph={corners[1]} corner="topRight" color={textColor} size={32} reducedMotion={reducedMotion} />
          <Corner glyph={corners[2]} corner="bottomLeft" color={textColor} size={32} reducedMotion={reducedMotion} />
          <Corner glyph={corners[3]} corner="bottomRight" color={textColor} size={32} reducedMotion={reducedMotion} />
        </>
      ) : null}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  corner: {
    position: 'absolute',
  },
});
