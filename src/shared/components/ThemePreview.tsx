/**
 * ThemePreviewCard
 *
 * Card hiển thị preview 1 theme trong Settings → Appearance → Themes picker.
 * Tap → setAppTheme(id).
 *
 * Step 2 — xem docs/steps/step-02-seasonal-premium-themes.md.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { AppTheme, getThemeMeta } from '../../utils/appThemes';
import { hapticLight } from '../../utils/haptics';

interface ThemePreviewCardProps {
  theme: AppTheme;
  selected: boolean;
  locked: boolean;
  onPress: (id: AppTheme['id']) => void;
}

export function ThemePreviewCard({
  theme,
  selected,
  locked,
  onPress,
}: ThemePreviewCardProps) {
  const appTheme = useTheme();
  const meta = getThemeMeta(theme.id);

  const handlePress = () => {
    if (locked) return;
    hapticLight();
    onPress(theme.id);
  };

  // Sample swatches từ theme tokens
  const swatches = [
    theme.tokens.bg,
    theme.tokens.surface,
    theme.tokens.accent,
    theme.tokens.text,
  ];

  return (
    <Pressable
      testID={`theme-card-${theme.id}`}
      onPress={handlePress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityLabel={`${meta.name}${locked ? ' (locked)' : ''}${selected ? ' (selected)' : ''}`}
      accessibilityState={{ disabled: locked, selected }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: appTheme.colors.surface,
          borderColor: selected ? appTheme.colors.accent : appTheme.colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: locked ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Preview swatches */}
      <View
        style={[
          styles.preview,
          { backgroundColor: theme.tokens.bg, borderColor: theme.tokens.border },
        ]}
      >
        {swatches.map((c, i) => (
          <View
            key={i}
            style={[styles.swatch, { backgroundColor: c }]}
          />
        ))}
        <Text
          style={[styles.previewLabel, { color: theme.tokens.text }]}
          numberOfLines={1}
        >
          Aa
        </Text>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={[styles.title, { color: appTheme.colors.text }]} numberOfLines={1}>
          {meta.icon} {meta.name}
        </Text>
        <View style={styles.tagRow}>
          {meta.isPremium ? (
            <Text style={[styles.tag, { color: '#FFD700' }]}>
              💎 {meta.price}
            </Text>
          ) : meta.isSeasonal ? (
            <Text style={[styles.tag, { color: appTheme.colors.accent }]}>🎉 Seasonal</Text>
          ) : meta.isPersonal ? (
            <Text style={[styles.tag, { color: appTheme.colors.accent }]}>🎂 Personal</Text>
          ) : (
            <Text style={[styles.tag, { color: appTheme.colors.textSecondary }]}>Free</Text>
          )}
          {selected ? (
            <Text style={[styles.tag, { color: appTheme.colors.success }]}>✓ Selected</Text>
          ) : null}
          {locked ? (
            <Text style={[styles.tag, { color: appTheme.colors.danger }]}>🔒 Locked</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  swatch: {
    width: 14,
    height: 14,
    margin: 1,
    borderRadius: 2,
  },
  previewLabel: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
  },
});
