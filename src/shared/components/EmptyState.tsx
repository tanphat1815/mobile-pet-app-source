/**
 * EmptyState
 *
 * Step 14 — "No results" + "Did you mean…" suggestions.
 *
 * When the user query yields no matches, we surface:
 *   1. A clear "no results" headline
 *   2. Up to 3 closest fuzzy matches (from Fuse extended search)
 *   3. A couple of hand-picked popular suggestions for empty queries
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SearchResult } from '../../api/searchIndex';
import { useTheme } from '../../utils/useTheme';

export interface EmptyStateProps {
  query: string;
  suggestions: SearchResult[];
  testID?: string;
  onPickSuggestion: (result: SearchResult) => void;
}

export function EmptyState({
  query,
  suggestions,
  testID,
  onPickSuggestion,
}: EmptyStateProps) {
  const theme = useTheme();
  const hasQuery = query.trim().length > 0;

  return (
    <View style={styles.root} testID={testID}>
      <Text style={[styles.headline, { color: theme.colors.textDim }]}>
        {hasQuery
          ? `No results for "${query.trim()}"`
          : 'Type to search across screens, friends, and more'}
      </Text>

      {hasQuery && suggestions.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            Did you mean…
          </Text>
          {suggestions.slice(0, 3).map((s) => (
            <Pressable
              key={s.id}
              testID={`didyoumean-${s.id}`}
              onPress={() => onPickSuggestion(s)}
              style={({ pressed }) => [
                styles.suggestionRow,
                {
                  backgroundColor: pressed
                    ? theme.colors.bgAlt
                    : 'transparent',
                },
              ]}
            >
              <Text style={styles.suggestionIcon}>{s.icon ?? '📄'}</Text>
              <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!hasQuery ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textDim }]}>
            Try: meditation · ai · friends · achievements
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 24,
    alignItems: 'flex-start',
  },
  headline: {
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  suggestionIcon: {
    fontSize: 18,
  },
  suggestionText: {
    fontSize: 14,
  },
});
