/**
 * NotificationCenter
 *
 * Slide-down panel listing notifications grouped by day:
 * Today / Yesterday / Earlier.
 *
 * Step 9 — xem docs/steps/step-09-notification-center.md.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../utils/useTheme';
import { useNotificationStore } from '../../stores/NotificationStore';
import { NotificationItemRow } from './NotificationItem';
import {
  groupByDay,
  deeplinkFor,
  type NotificationItem,
  type NotificationGroup,
} from '../../api/notificationCenter';
import { hapticLight } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.65);
const SLIDE_IN_MS = 300;
const SLIDE_OUT_MS = 250;

export interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({
  visible,
  onClose,
}: NotificationCenterProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const history = useNotificationStore((s) => s.history);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const unreadCount = useNotificationStore((s) => s.history.filter((n) => n.readAt === null).length);

  const slideAnim = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      slideAnim.value = withTiming(1, {
        duration: SLIDE_IN_MS,
        easing: Easing.out(Easing.quad),
      });
    } else {
      slideAnim.value = withTiming(0, {
        duration: SLIDE_OUT_MS,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [visible, slideAnim]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - slideAnim.value) * -(PANEL_HEIGHT + 40) },
    ],
    opacity: slideAnim.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: slideAnim.value * 0.4,
    pointerEvents: slideAnim.value > 0.1 ? 'auto' : 'none',
  }));

  const groups = useMemo(() => groupByDay(history), [history]);

  const handleItemPress = useCallback(
    (item: NotificationItem) => {
      // Mark read
      if (item.readAt === null) markRead(item.id);
      // Navigate to deeplink
      const { screen } = deeplinkFor(item);
      try {
        navigation.navigate(screen);
      } catch {
        // screen might not exist in param list
        navigation.navigate('Home');
      }
      onClose();
    },
    [markRead, navigation, onClose]
  );

  const handleMarkAllRead = useCallback(() => {
    hapticLight();
    markAllRead();
  }, [markAllRead]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderGroup = useCallback(
    ({ item }: { item: NotificationGroup }) => (
      <View style={styles.group}>
        <Text
          style={[
            styles.groupLabel,
            { color: theme.colors.textSecondary },
          ]}
          testID={`group-${item.label.toLowerCase()}`}
        >
          {item.label}
        </Text>
        {item.items.map((n) => (
          <NotificationItemRow
            key={n.id}
            item={n}
            onPress={handleItemPress}
          />
        ))}
      </View>
    ),
    [theme.colors.textSecondary, handleItemPress]
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={styles.backdropPress} onPress={handleClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        testID="notification-center"
        style={[
          styles.panel,
          panelStyle,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Notifications
          </Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Pressable
                testID="mark-all-read"
                onPress={handleMarkAllRead}
                style={styles.markAllBtn}
              >
                <Text
                  style={[
                    styles.markAllText,
                    { color: theme.colors.accent },
                  ]}
                >
                  Mark all read
                </Text>
              </Pressable>
            )}
            <Pressable onPress={handleClose} hitSlop={12}>
              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>
                ✕
              </Text>
            </Pressable>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={groups}
          keyExtractor={(g) => g.key}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🔔</Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No notifications yet
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  backdropPress: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  group: {
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
