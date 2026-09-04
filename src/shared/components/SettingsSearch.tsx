/**
 * SettingsSearch
 *
 * Search bar + filter logic for the Settings screen. Renders a
 * text input with a magnifying glass icon and (optional) clear button.
 * Calls `onChange(query)` with the debounced query string so the
 * parent can filter the rows.
 *
 * Step 11 — xem docs/steps/step-11-settings-restructure.md.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';

export interface SettingsSearchProps {
  onChange: (query: string) => void;
  placeholder?: string;
  /** Debounce delay in ms (default 150). */
  debounceMs?: number;
  testID?: string;
}

export function SettingsSearch({
  onChange,
  placeholder = 'Search settings',
  debounceMs = 150,
  testID,
}: SettingsSearchProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');

  // Debounce the onChange callback
  useEffect(() => {
    if (debounceMs <= 0) {
      onChange(value);
      return;
    }
    const t = setTimeout(() => onChange(value), debounceMs);
    return () => clearTimeout(t);
  }, [value, debounceMs, onChange]);

  const handleClear = useCallback(() => {
    setValue('');
    onChange('');
  }, [onChange]);

  return (
    <View style={styles.root}>
      <View
        testID={testID ?? 'settings-search'}
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.separator,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search settings"
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.size.subhead,
            },
          ]}
        />
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={12}
            testID="settings-search-clear"
            accessibilityLabel="Clear search"
          >
            <Text style={[styles.clear, { color: theme.colors.textSecondary }]}>
              ✕
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  clear: {
    fontSize: 14,
    paddingHorizontal: 6,
  },
});
