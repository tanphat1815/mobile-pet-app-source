/**
 * OnboardingScreen
 *
 * 6-slide onboarding carousel shown on the user's very first launch.
 * Uses a horizontal FlatList, dot pagination, and `usePageTransition`
 * for a soft fade/slide on each slide change.
 *
 * Slides:
 *   1. Welcome
 *   2. Feed
 *   3. Play
 *   4. Chat
 *   5. Pair
 *   6. Ready
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { usePageTransition } from '../shared/transitions/usePageTransition';
import { Button } from '../shared/components/Button';
import { hapticLight, hapticSuccess } from '../utils/haptics';

export interface OnboardingSlide {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: 'welcome',
    emoji: '👋',
    title: 'Welcome to Mobile Pet',
    subtitle:
      'A pocket-sized friend that travels with you across all your devices.',
    cta: 'Get started',
  },
  {
    key: 'feed',
    emoji: '🍖',
    title: 'Feed and care',
    subtitle:
      'Keep your pet happy, healthy and clean with quick daily check-ins.',
    cta: 'Next',
  },
  {
    key: 'play',
    emoji: '🎮',
    title: 'Play and explore',
    subtitle:
      'Train, dress up, and take your pet on walks through a tiny park.',
    cta: 'Next',
  },
  {
    key: 'chat',
    emoji: '💬',
    title: 'Stay connected',
    subtitle:
      'Add friends, swap messages, and visit each other\'s pets any time.',
    cta: 'Next',
  },
  {
    key: 'pair',
    emoji: '🔗',
    title: 'Pair your devices',
    subtitle:
      'Use a 6-digit code to keep your pet in sync across phones, tablets and the web.',
    cta: 'Next',
  },
  {
    key: 'ready',
    emoji: '🚀',
    title: 'Ready to go!',
    subtitle:
      'Sign in to start the adventure. We\'ll save your progress as you go.',
    cta: 'Let\'s go',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnboardingScreenProps {
  /** Called when the user finishes the last slide. */
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const theme = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useSharedValue(0);

  const handleNext = useCallback(() => {
    if (index < ONBOARDING_SLIDES.length - 1) {
      hapticLight();
      const next = index + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      hapticSuccess();
      completeOnboarding().then(onDone);
    }
  }, [index, completeOnboarding, onDone]);

  const handleSkip = useCallback(() => {
    hapticLight();
    completeOnboarding().then(onDone);
  }, [completeOnboarding, onDone]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = e.nativeEvent.contentOffset.x;
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(idx);
  };

  const renderSlide = ({ item }: ListRenderItemInfo<OnboardingSlide>) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <OnboardingSlideContent slide={item} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* Skip button in the top-right */}
      <Pressable
        onPress={handleSkip}
        hitSlop={12}
        style={({ pressed }) => [
          styles.skipBtn,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            fontWeight: '500',
          }}
        >
          Skip
        </Text>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
      />

      <View
        style={[
          styles.footer,
          { paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Dots count={ONBOARDING_SLIDES.length} activeIndex={index} scrollX={scrollX} />
        <Button
          title={ONBOARDING_SLIDES[index].cta}
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={{ alignSelf: 'stretch' }}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Slide content
// ============================================================================

interface SlideProps {
  slide: OnboardingSlide;
}

function OnboardingSlideContent({ slide }: SlideProps) {
  const theme = useTheme();
  const { containerStyle } = usePageTransition({
    pageIndex: 0,
    totalPages: 1,
    screenWidth: SCREEN_WIDTH,
  });
  return (
    <Animated.View
      style={[
        styles.slideContent,
        {
          paddingHorizontal: theme.spacing.lg,
        },
        containerStyle,
      ]}
    >
      <View
        style={[
          styles.emojiCircle,
          {
            backgroundColor: theme.isDark ? '#1C1C1E' : '#F2F2F7',
            borderRadius: 80,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={{ fontSize: 80 }}>{slide.emoji}</Text>
      </View>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.title1,
          fontWeight: '700',
          marginTop: 32,
          textAlign: 'center',
        }}
      >
        {slide.title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.subhead,
          marginTop: 12,
          textAlign: 'center',
          maxWidth: 320,
        }}
      >
        {slide.subtitle}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Pagination dots
// ============================================================================

interface DotsProps {
  count: number;
  activeIndex: number;
  scrollX: SharedValue<number>;
}

function Dots({ count, activeIndex, scrollX }: DotsProps) {
  const theme = useTheme();
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} index={i} activeIndex={activeIndex} scrollX={scrollX} />
      ))}
    </View>
  );
}

interface DotProps {
  index: number;
  activeIndex: number;
  scrollX: SharedValue<number>;
}

function Dot({ index, activeIndex, scrollX }: DotProps) {
  const theme = useTheme();
  const animatedStyle = useAnimatedStyle(() => {
    const input = scrollX.value / SCREEN_WIDTH;
    const distance = Math.abs(input - index);
    const scale = 1 - Math.min(0.5, distance * 0.5);
    const opacity =
      index === activeIndex
        ? 1
        : Math.max(0.3, 1 - Math.abs(input - index) * 0.6);
    return {
      transform: [{ scale }],
      opacity,
      backgroundColor:
        Math.abs(input - index) < 0.5
          ? theme.colors.accent
          : theme.colors.border,
    };
  });
  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
  },
  emojiCircle: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footer: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});