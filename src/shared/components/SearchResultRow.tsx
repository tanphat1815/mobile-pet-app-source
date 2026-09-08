/**
 * SearchResultRow
 *
 * Step 14 — Single search result row in the QuickSwitcher list.
 * Renders icon, title, optional subtitle, optional pin icon, and chevron.
 *
 * Long-press on the row triggers the pin/unpin callback (used on native).
 * On web, right-click fires the same handler.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { SearchResult } from '../../api/searchIndex';
import { useTheme } from '../../utils/useTheme';

export interface SearchResultRowProps {
  result: SearchResult;
  isActive: boolean;
  isPinned: boolean;
  testID?: string;
  onPress: (result: SearchResult) => void;
  onLongPress?: (result: SearchResult) => void;
}

export function SearchResultRow({
  result,
  isActive,
  isPinned,
  testID,
  onPress,
  onLongPress,
}: SearchResultRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      onPress={() => onPress(result)}
      // @ts-expect-error — web-only mouse event
      onContextMenu={(e) => {
        if (e?.preventDefault) e.preventDefault();
        onLongPress?.(result);
      }}
      onLongPress={onLongPress ? () => onLongPress(result) : undefined}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isActive
            ? theme.colors.accent + '22'
            : pressed
              ? theme.colors.bgAlt
              : 'transparent',
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {result.icon ?? '📄'}
      </Text>
      <View style={styles.body}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {result.title}
        </Text>
        {result.subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.colors.textDim }]}
            numberOfLines={1}
          >
            {result.subtitle}
          </Text>
        ) : null}
      </View>
      {isPinned ? (
        <Text style={styles.pin} accessibilityLabel="Pinned">
          📌
        </Text>
      ) : null}
      <Text style={[styles.chevron, { color: theme.colors.textDim }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  icon: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pin: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 20,
    marginLeft: 4,
  },
});
