/**
 * SleepTimerControl — preset buttons to start/cancel sleep timer.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useMusicStore, selectSleepRemainingMs } from '../../stores/MusicStore';
import { hapticLight } from '../../utils/haptics';
import { SLEEP_TIMER_PRESETS } from '../../api/music';
import { formatMusicTime } from '../../api/music';

export function SleepTimerControl({ testID }: { testID?: string }) {
  const theme = useTheme();
  const remainingMs = useMusicStore(selectSleepRemainingMs);
  const setSleepTimer = useMusicStore((s) => s.setSleepTimer);

  const remainingMin = Math.ceil(remainingMs / 60000);

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: 14,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Hẹn giờ tắt nhạc</Text>
        {remainingMin > 0 && (
          <Text style={[styles.remaining, { color: theme.colors.accent }]}>
            Còn {remainingMin} phút
          </Text>
        )}
      </View>

      <View style={styles.chips}>
        {SLEEP_TIMER_PRESETS.map((mins) => {
          const isActive = remainingMin === mins;
          return (
            <Pressable
              key={mins}
              onPress={() => { hapticLight(); setSleepTimer(mins); }}
              testID={`sleep-timer-${mins}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? theme.colors.onAccent : theme.colors.text,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {mins} phút
              </Text>
            </Pressable>
          );
        })}
        {remainingMin > 0 && (
          <Pressable
            onPress={() => { hapticLight(); setSleepTimer(null); }}
            testID="sleep-timer-cancel"
            accessibilityRole="button"
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '600' }}>
              Hủy
            </Text>
          </Pressable>
        )}
      </View>

      {remainingMin > 0 && (
        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          Nhạc sẽ tự dừng sau khoảng {formatMusicTime(remainingMin * 60)}.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700' },
  remaining: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  helper: { fontSize: 11, marginTop: 8 },
});
