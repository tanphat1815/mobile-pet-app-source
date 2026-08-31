/**
 * SettingsSection
 *
 * Section header + grouped content for the SettingsScreen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';

export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  /** Optional caption under the section header */
  description?: string;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  const theme = useTheme();
  const childrenArr = React.Children.toArray(children);
  return (
    <View style={styles.root}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.caption1,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontSize: theme.typography.size.caption1,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            marginHorizontal: theme.spacing.lg,
            overflow: 'hidden',
          },
        ]}
      >
        {childrenArr.map((child, i) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{ isLast?: boolean }>,
                { isLast: i === childrenArr.length - 1 }
              )
            : child
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 8,
  },
  group: {
    borderWidth: 0,
  },
});