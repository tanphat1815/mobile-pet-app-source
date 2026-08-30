/**
 * NotificationCard
 *
 * Compact card showing notification permission status + push token info
 * and a "Send test" button that schedules a local notification 2 seconds
 * in the future. Useful for verifying the notification setup on Android
 * Emulator / iOS Simulator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { useNotificationStore } from '../../stores/NotificationStore';

export function NotificationCard() {
  const theme = useTheme();
  const permission = useNotificationStore((s) => s.permissionStatus);
  const token = useNotificationStore((s) => s.pushToken);
  const registered = useNotificationStore((s) => s.registered);
  const lastReceived = useNotificationStore((s) => s.lastReceived);
  const badgeCount = useNotificationStore((s) => s.badgeCount);
  const register = useNotificationStore((s) => s.requestPermissionsAndRegister);
  const scheduleTest = useNotificationStore((s) => s.scheduleTest);
  const dismissAll = useNotificationStore((s) => s.dismissAll);

  const permissionBadge = (() => {
    switch (permission) {
      case 'granted':
        return <Badge label="Granted" variant="success" size="sm" />;
      case 'denied':
        return <Badge label="Denied" variant="danger" size="sm" />;
      default:
        return <Badge label="Unknown" variant="warning" size="sm" />;
    }
  })();

  return (
    <Card style={styles.root}>
      <View style={styles.header}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.headline,
            fontWeight: '600',
          }}
        >
          Notifications
        </Text>
        {permissionBadge}
      </View>

      <View style={{ height: theme.spacing.sm }} />

      <InfoRow label="Push token" value={token?.token ?? '-'} theme={theme} mono />
      <InfoRow label="Platform" value={token?.platform ?? '-'} theme={theme} />
      <InfoRow
        label="Registered"
        value={registered ? 'yes' : 'no'}
        theme={theme}
      />
      <InfoRow label="Badge" value={String(badgeCount)} theme={theme} />
      <InfoRow
        label="Last received"
        value={lastReceived?.title ?? '-'}
        theme={theme}
      />

      <View style={{ height: theme.spacing.md }} />

      <View style={styles.buttonRow}>
        <Button
          title={token ? 'Re-register' : 'Enable & register'}
          onPress={register}
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
        />
        <View style={{ width: 8 }} />
        <Button
          title="Test push"
          onPress={scheduleTest}
          variant="primary"
          size="sm"
          style={{ flex: 1 }}
        />
      </View>
      {badgeCount > 0 && (
        <View style={{ height: 8 }} />
      )}
      {badgeCount > 0 && (
        <Button
          title={`Dismiss ${badgeCount} notification${badgeCount > 1 ? 's' : ''}`}
          onPress={dismissAll}
          variant="ghost"
          size="sm"
        />
      )}
    </Card>
  );
}

function InfoRow({
  label,
  value,
  theme,
  mono,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  mono?: boolean;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.colors.separator }]}>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.subhead,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.size.subhead,
          fontFamily: mono ? 'monospace' : undefined,
          flex: 1,
          textAlign: 'right',
          marginLeft: 12,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});