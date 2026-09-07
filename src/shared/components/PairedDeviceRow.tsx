/**
 * PairedDeviceRow
 *
 * One row in the paired-device list. Shows:
 *   - Platform emoji (iOS / Android / Web)
 *   - Device name + platform subtitle
 *   - "This device" badge if isCurrent
 *   - Last-seen relative timestamp
 *   - Unpair button (with confirmation)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useAvatarHover } from '../transitions/useAvatarHover';
import { PairedDevice } from '../../api/pairingTypes';
import { formatRelativeTime } from '../../api/chatTypes';
import { Badge } from './Badge';

export interface PairedDeviceRowProps {
  device: PairedDevice;
  onUnpair: () => void;
}

const PLATFORM_EMOJI: Record<PairedDevice['platform'], string> = {
  ios: '📱',
  android: '🤖',
  web: '💻',
};

const PLATFORM_LABEL: Record<PairedDevice['platform'], string> = {
  ios: 'iOS',
  android: 'Android',
  web: 'Web',
};

export function PairedDeviceRow({ device, onUnpair }: PairedDeviceRowProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useAvatarHover({
    pressedScale: 0.95,
  });

  const handleUnpair = () => {
    Alert.alert(
      'Unpair device?',
      `${device.deviceName} will need to re-enter the code to pair again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpair', style: 'destructive', onPress: onUnpair },
      ]
    );
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.separator,
        },
      ]}
    >
      <Animated.View
        style={[styles.avatarWrap, animatedStyle]}
        onTouchStart={onPressIn}
        onTouchEnd={onPressOut}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.surfaceMuted,
              borderRadius: 24,
            },
          ]}
        >
          <Text style={{ fontSize: 22 }}>{PLATFORM_EMOJI[device.platform]}</Text>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
                fontSize: theme.typography.size.headline,
                fontWeight: '600',
              },
            ]}
            numberOfLines={1}
          >
            {device.deviceName}
          </Text>
          {device.isCurrent && (
            <View style={{ marginLeft: 8 }}>
              <Badge label="This device" variant="success" size="sm" />
            </View>
          )}
        </View>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
            },
          ]}
        >
          {PLATFORM_LABEL[device.platform]}
          {device.lastSeen ? ' • ' : ''}
          {device.lastSeen ? formatRelativeTime(device.lastSeen) : ''}
        </Text>
      </View>

      {!device.isCurrent && (
        <Pressable
          onPress={handleUnpair}
          hitSlop={8}
          style={({ pressed }) => [
            styles.unpairBtn,
            {
              opacity: pressed ? 0.5 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Unpair ${device.deviceName}`}
        >
          <Text style={{ color: theme.colors.danger, fontSize: 18 }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flexShrink: 1,
  },
  subtitle: {},
  unpairBtn: {
    padding: 8,
    marginLeft: 8,
  },
});