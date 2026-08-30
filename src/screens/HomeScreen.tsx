/**
 * Home Screen
 *
 * Post-auth landing screen for Step M-4.
 * Shows the logged-in user and a logout button.
 * Will be expanded in Step M-6 with pet stats.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';

export function HomeScreen() {
  const theme = useTheme();
  const { user, status, logout } = useAuthStore();

  const isLoggingOut = status === 'logging_out';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.separator,
            paddingTop: theme.spacing.xxxl,
            paddingBottom: theme.spacing.lg,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[
                styles.greeting,
                { color: theme.colors.textSecondary, fontSize: theme.typography.size.subhead },
              ]}
            >
              Welcome back,
            </Text>
            <Text
              style={[
                styles.displayName,
                { color: theme.colors.text, fontSize: theme.typography.size.title2, fontWeight: '700' },
              ]}
            >
              {user?.displayName ?? user?.email ?? 'User'}
            </Text>
          </View>
          <Badge label="AUTH" variant="success" size="sm" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontSize: theme.typography.size.headline, fontWeight: '600' },
            ]}
          >
            Account
          </Text>
          <View style={{ height: theme.spacing.md }} />
          <InfoRow label="Email" value={user?.email ?? '-'} theme={theme} />
          <InfoRow label="User ID" value={user?.id ?? '-'} theme={theme} mono />
          <InfoRow
            label="Created"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            theme={theme}
          />
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontSize: theme.typography.size.headline, fontWeight: '600' },
            ]}
          >
            Auth State
          </Text>
          <View style={{ height: theme.spacing.md }} />
          <InfoRow label="Status" value={status} theme={theme} />
          <InfoRow label="Token stored" value={user ? 'Yes' : 'No'} theme={theme} />
        </Card>

        <View style={{ height: theme.spacing.xl }} />

        <Button
          title={isLoggingOut ? 'Signing out...' : 'Sign out'}
          onPress={logout}
          loading={isLoggingOut}
          variant="danger"
          disabled={isLoggingOut}
        />
      </View>
    </View>
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
        style={[
          styles.infoLabel,
          { color: theme.colors.textSecondary, fontSize: theme.typography.size.subhead },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          {
            color: theme.colors.text,
            fontSize: theme.typography.size.subhead,
            fontFamily: mono ? 'monospace' : undefined,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {},
  displayName: {},
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {},
  infoValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});