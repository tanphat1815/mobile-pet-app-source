/**
 * FriendSearchBar
 *
 * Search field for finding new friends. Local-only state; the parent
 * (FriendsScreen) listens to the FriendStore.searchQuery and runs
 * search() as the user types.
 */

import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';

export interface FriendSearchBarProps {
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
}

export function FriendSearchBar({
  value,
  onChange,
  placeholder = 'Search friends...',
}: FriendSearchBarProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.isDark ? '#1C1C1E' : '#F2F2F7',
          borderRadius: theme.radius.md,
          borderColor: focused ? theme.colors.accent : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.icon,
          { color: theme.colors.textSecondary },
        ]}
      >
        🔍
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: theme.typography.size.body,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={8}
          style={styles.clearBtn}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 14,
            }}
          >
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 4,
  },
});