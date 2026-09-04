/**
 * CustomSlider
 *
 * Lightweight horizontal slider using Pressable + View widths. Avoids
 * pulling in @react-native-community/slider which isn't installed in
 * this repo.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

export interface CustomSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  testID?: string;
  height?: number;
}

export function CustomSlider({
  value,
  min = 0,
  max = 1,
  step = 0,
  onChange,
  trackColor = '#D1D5DB',
  fillColor = '#3B82F6',
  thumbColor = '#FFFFFF',
  testID,
  height = 28,
}: CustomSliderProps) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);

  // Compute pixel offset from value
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const valueToOffset = (v: number): number => {
    if (width <= 0) return 0;
    return ((clamp(v) - min) / (max - min)) * width;
  };
  const offsetToValue = (x: number): number => {
    if (width <= 0) return min;
    const ratio = Math.max(0, Math.min(1, x / width));
    let next = min + ratio * (max - min);
    if (step > 0) next = Math.round(next / step) * step;
    return clamp(next);
  };

  // Initialize on first render
  React.useEffect(() => {
    offset.value = valueToOffset(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const emit = (x: number) => onChange(offsetToValue(x));

  const pan = Gesture.Pan()
    .onBegin(() => {
      // no-op; just capture
    })
    .onChange((e) => {
      const next = Math.max(0, Math.min(width, offset.value + e.changeX));
      offset.value = next;
      runOnJS(emit)(next);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: offset.value,
  }));

  return (
    <View
      testID={testID}
      style={[styles.root, { height }]}
      onLayout={handleLayout}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            height: 4,
            borderRadius: 2,
            top: height / 2 - 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            height: 4,
            borderRadius: 2,
            top: height / 2 - 2,
          },
          fillStyle,
        ]}
      />
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              borderColor: fillColor,
              top: height / 2 - 9,
              left: 0,
              transform: [{ translateX: offset.value - 9 }],
            },
          ]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  fill: {
    position: 'absolute',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
});
