/**
 * BannerBackground
 *
 * Cover banner phía trên profile. Falls back về gradient khi không
 * có bannerUrl. Gradient pattern lấy cảm hứng từ desktop cover.
 * Step 7 — xem docs/steps/step-07-rich-profile.md.
 */

import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';

export interface BannerBackgroundProps {
  bannerUrl?: string | null;
  /** Seed cho gradient khi không có URL — ví dụ userId */
  seed: string;
  height?: number;
}

interface GradientStop {
  color: string;
  stop: number;
}

function hashStringToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

function buildGradient(seed: string, height: number): GradientStop[] {
  const hue = hashStringToHue(seed);
  return [
    { color: `hsl(${hue}, 70%, 55%)`, stop: 0 },
    { color: `hsl(${(hue + 40) % 360}, 65%, 45%)`, stop: height * 0.6 },
    { color: `hsl(${(hue + 80) % 360}, 60%, 35%)`, stop: height },
  ];
}

export function BannerBackground({
  bannerUrl,
  seed,
  height = 160,
}: BannerBackgroundProps) {
  const stops = useMemo(() => buildGradient(seed, height), [seed, height]);

  if (bannerUrl) {
    return (
      <Image
        testID="profile-banner"
        source={{ uri: bannerUrl }}
        style={[styles.image, { height }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View testID="profile-banner" style={[styles.root, { height }]}>
      {stops.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: s.stop - 1,
            height: 2,
            backgroundColor: s.color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
});
