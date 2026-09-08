/**
 * EqualizerPanel — 3-band EQ + presets (Step 12b)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CustomSlider } from './CustomSlider';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';
import { useMusicStore } from '../../stores/MusicStore';
import { EQ_PRESETS } from '../../api/music';

const EQ_BANDS = ['bass', 'mid', 'treble'] as const;
const BAND_LABELS: Record<typeof EQ_BANDS[number], string> = {
  bass: 'Bass',
  mid: 'Mid',
  treble: 'Treble',
};

export function EqualizerPanel({ testID }: { testID?: string }) {
  const theme = useTheme();
  const eq = useMusicStore((s) => s.eq);
  const setEQ = useMusicStore((s) => s.setEQ);
  const applyEQPreset = useMusicStore((s) => s.applyEQPreset);

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: 16,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Equalizer</Text>

      {EQ_BANDS.map((band) => (
        <View key={band} style={styles.bandRow}>
          <Text style={[styles.bandLabel, { color: theme.colors.text }]}>{BAND_LABELS[band]}</Text>
          <View style={styles.slider}>
            <CustomSlider
              value={(eq[band] + 12) / 24}
              onChange={(v) => setEQ(band, Math.round(v * 24 - 12))}
              fillColor={theme.colors.accent}
              trackColor={theme.colors.border}
              testID={`eq-${band}-slider`}
            />
          </View>
          <Text style={[styles.bandValue, { color: theme.colors.text }]}>
            {eq[band] > 0 ? `+${eq[band]}` : eq[band]}
          </Text>
        </View>
      ))}

      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Presets</Text>
      <View style={styles.presetGrid}>
        {Object.entries(EQ_PRESETS).map(([key, p]) => {
          const active =
            p.bass === eq.bass && p.mid === eq.mid && p.treble === eq.treble;
          return (
            <Pressable
              key={key}
              onPress={() => {
                hapticLight();
                applyEQPreset(key);
              }}
              style={[
                styles.presetChip,
                {
                  backgroundColor: active ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor: active ? theme.colors.accent : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
              testID={`eq-preset-${key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  color: active ? theme.colors.onAccent : theme.colors.text,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  bandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bandLabel: { width: 64, fontSize: 13, fontWeight: '600' },
  slider: { flex: 1 },
  bandValue: { width: 36, textAlign: 'right', fontSize: 12, fontVariant: ['tabular-nums'] },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
});
