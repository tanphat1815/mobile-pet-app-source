/**
 * LyricsView — karaoke-style synced lyrics (Step 12b)
 *
 * Shows the current lyric line in large text. Lines within a small
 * window of `currentTime` are highlighted; past lines fade out.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useMusicStore } from '../../stores/MusicStore';
import { getCurrentLyric } from '../../api/music';

export function LyricsView({ testID }: { testID?: string }) {
  const theme = useTheme();
  const track = useMusicStore((s) => s.currentTrack);
  const currentTime = useMusicStore((s) => s.currentTime);

  if (!track || !track.lyrics.length) {
    return (
      <View
        testID={testID}
        style={[
          styles.empty,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Bài hát này không có lời.
        </Text>
      </View>
    );
  }

  const current = getCurrentLyric(track, currentTime);

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Lời bài hát</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {track.lyrics.map((line, idx) => {
          const isCurrent = current?.time === line.time;
          const isPast = !!current && line.time < current.time;
          return (
            <Text
              key={`${line.time}-${idx}`}
              testID={`lyric-${idx}`}
              style={{
                fontSize: isCurrent ? 18 : 15,
                fontWeight: isCurrent ? '700' : '500',
                color: isCurrent
                  ? theme.colors.accent
                  : isPast
                    ? theme.colors.textSecondary
                    : theme.colors.text,
                opacity: isPast && !isCurrent ? 0.55 : 1,
                marginBottom: 10,
              }}
            >
              {line.text}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, maxHeight: 220 },
  empty: { borderWidth: 1, padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  scroll: { flex: 1 },
});
