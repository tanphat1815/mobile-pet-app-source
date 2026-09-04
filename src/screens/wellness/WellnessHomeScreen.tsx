/**
 * Wellness Home Screen
 *
 * Step 12a — entry with 6 cards (Meditation / Breathing / Pomodoro /
 * Ambient / Gratitude / Mood). Tapping a card navigates to the
 * dedicated screen.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useWellnessStore, selectStreak, selectTodayMinutes } from '../../stores/WellnessStore';
import { hapticLight } from '../../utils/haptics';
// Side-effect: install dev exposes for e2e tests (Step 12a)
import '../../api/wellnessDev';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'WellnessHome'>;

interface WellnessCard {
  id: keyof WellnessStackParamList;
  emoji: string;
  label: string;
  description: string;
  accent: string;
}

const CARDS: WellnessCard[] = [
  { id: 'Meditation', emoji: '🧘', label: 'Meditation', description: 'Guided timer', accent: '#A78BFA' },
  { id: 'Breathing', emoji: '🌬️', label: 'Breathing', description: '4-7-8 / box', accent: '#60A5FA' },
  { id: 'Pomodoro', emoji: '🍅', label: 'Pomodoro', description: 'Focus cycles', accent: '#F87171' },
  { id: 'Ambient', emoji: '🌧', label: 'Ambient', description: 'Sound mixer', accent: '#34D399' },
  { id: 'Gratitude', emoji: '💌', label: 'Gratitude', description: 'Daily journal', accent: '#FBBF24' },
  { id: 'Mood', emoji: '💗', label: 'Mood', description: 'Track + history', accent: '#F472B6' },
];

export function WellnessHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const hydrate = useWellnessStore((s) => s.hydrate);
  const streak = useWellnessStore(selectStreak);
  const todayMinutes = useWellnessStore(selectTodayMinutes);
  const hydrated = useWellnessStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title1,
            fontWeight: '700',
          }}
        >
          Wellness
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 4,
          }}
        >
          A moment for yourself
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        {/* Streak + today minutes */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
          testID="wellness-summary"
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: theme.colors.text }]}>
              {streak}
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
              testID="wellness-streak"
            >
              day streak
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: theme.colors.text }]}>
              {todayMinutes}
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
              testID="wellness-today-minutes"
            >
              minutes today
            </Text>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={styles.grid}>
          {CARDS.map((card) => (
            <Pressable
              key={card.id}
              testID={`card-${card.id.toLowerCase()}`}
              onPress={() => {
                hapticLight();
                navigation.navigate(card.id);
              }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.separator,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[styles.cardIcon, { backgroundColor: card.accent + '20' }]}
              >
                <Text style={{ fontSize: 28 }}>{card.emoji}</Text>
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.text },
                ]}
              >
                {card.label}
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {card.description}
              </Text>
            </Pressable>
          ))}
        </View>

        {!hydrated ? (
          <Text
            style={[
              styles.hydrateHint,
              { color: theme.colors.textSecondary },
            ]}
          >
            Loading your wellness history…
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 8,
  },
  summaryNum: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    justifyContent: 'flex-end',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 12,
    marginTop: 1,
  },
  hydrateHint: {
    marginTop: 24,
    fontSize: 12,
    textAlign: 'center',
  },
});
