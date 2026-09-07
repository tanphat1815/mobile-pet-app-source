/**
 * SettingsRow
 *
 * Single row in the SettingsScreen. Supports:
 *   - toggle (right-aligned Switch)
 *   - navigation (right chevron)
 *   - destructive (red label)
 *   - value picker (current value shown)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { Toggle } from './Toggle';

export interface SettingsRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  variant?: 'default' | 'destructive';
  type?: 'toggle' | 'navigation' | 'value';
  value?: string;
  onPress?: () => void;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  icon,
  label,
  subtitle,
  variant = 'default',
  type = 'navigation',
  value,
  onPress,
  toggleValue,
  onToggle,
  disabled,
  isLast,
}: SettingsRowProps) {
  const theme = useTheme();
  const labelColor =
    variant === 'destructive' ? theme.colors.danger : theme.colors.text;

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        if (type === 'toggle') onToggle?.(!toggleValue);
        else onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.separator,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.4 : pressed && type !== 'toggle' ? 0.7 : 1,
        },
      ]}
      accessibilityRole={type === 'toggle' ? 'switch' : 'button'}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: theme.colors.surfaceMuted },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            { color: labelColor, fontSize: theme.typography.size.body },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.caption1,
              },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {type === 'toggle' ? (
        <Toggle value={!!toggleValue} onValueChange={(v) => onToggle?.(v)} disabled={disabled} />
      ) : type === 'value' && value ? (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
          }}
        >
          {value}
        </Text>
      ) : (
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontSize: 18,
          }}
        >
          ›
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontWeight: '500',
  },
  subtitle: {
    marginTop: 2,
  },
});