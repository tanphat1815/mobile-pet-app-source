/**
 * SegmentedTabs
 *
 * A simple horizontal segmented control: pill-shaped tabs that slide the
 * active indicator. Used for tab-style navigation within a screen
 * (e.g. Friends / Suggestions).
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';
import { theme as defaultTheme } from '../../utils/theme';

export interface TabItem {
  key: string;
  label: string;
  /** Optional badge (e.g. unread count) */
  badge?: string | number;
}

export interface SegmentedTabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function SegmentedTabs({ items, activeKey, onChange }: SegmentedTabsProps) {
  const theme = useTheme();
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [containerWidth, setContainerWidth] = useState(0);

  const offsetX = useSharedValue(0);
  const baseDuration = defaultTheme.duration.fast;
  const duration = useReducedMotionDuration(baseDuration);

  const activeWidth = widths[activeKey] ?? 0;
  const activeOffset = positions[activeKey] ?? 0;

  React.useEffect(() => {
    offsetX.value = withSpring(activeOffset, {
      damping: defaultTheme.easing.spring.damping,
      stiffness: defaultTheme.easing.spring.stiffness,
      mass: defaultTheme.easing.spring.mass,
    });
  }, [activeOffset, offsetX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
    width: activeWidth,
  }));

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.md,
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 8,
        },
      ]}
      onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            shadowColor: '#1E2024',
          },
          indicatorStyle,
        ]}
      />
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          style={styles.tab}
          onLayout={(e: LayoutChangeEvent) => {
            const w = e.nativeEvent.layout.width;
            setWidths((prev) => ({ ...prev, [item.key]: w }));
            // Compute offset: sum of widths of preceding tabs
            const idx = items.findIndex((i) => i.key === item.key);
            let offset = 0;
            for (let i = 0; i < idx; i += 1) {
              offset += widths[items[i].key] ?? 0;
            }
            setPositions((prev) => ({ ...prev, [item.key]: offset }));
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: item.key === activeKey }}
        >
          <Text
            style={{
              color: item.key === activeKey ? theme.colors.text : theme.colors.textSecondary,
              fontWeight: item.key === activeKey ? '600' : '500',
              fontSize: theme.typography.size.subhead,
            }}
          >
            {item.label}
            {item.badge !== undefined && item.badge !== null && (
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>
                {' '}
                {String(item.badge)}
              </Text>
            )}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});