/**
 * Sync Status Badge
 *
 * Pill that shows realtime connection status.
 * - open: green "Live"
 * - connecting / reconnecting: amber with attempt count
 * - closed / idle: gray "Offline"
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useSyncStore } from '../../stores/SyncStore';
import { Badge } from './Badge';

export function SyncStatusBadge() {
  const theme = useTheme();
  const status = useSyncStore((s: any) => s.status);
  const attempt = useSyncStore((s: any) => s.reconnectAttempt);

  let label = 'Unknown';
  let variant: 'success' | 'warning' | 'danger' = 'success';
  switch (status) {
    case 'open':
      label = 'Live';
      variant = 'success';
      break;
    case 'connecting':
      label = 'Connecting';
      variant = 'warning';
      break;
    case 'reconnecting':
      label = `Retry ${attempt}`;
      variant = 'warning';
      break;
    case 'closed':
      label = 'Offline';
      variant = 'danger';
      break;
    case 'idle':
      label = 'Idle';
      variant = 'danger';
      break;
  }

  return (
    <View style={styles.container}>
      <Badge label={label} variant={variant} size="sm" />
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.caption2,
          marginLeft: 6,
        }}
      >
        realtime
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});