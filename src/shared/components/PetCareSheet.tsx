/**
 * PetCareSheet
 *
 * Bottom sheet listing pet care actions (Bath, Medicine, Vitamin). Used
 * as an alternative to the Home screen action grid when more detail is
 * needed (cooldown timers, disabled reasons).
 *
 * Step 10 — xem docs/steps/step-10-pet-care-actions.md.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  PetAction,
  PET_CARE_EFFECTS,
  cooldownRemaining,
  cooldownLabel,
  actionDisabledReason,
} from '../../api/petTypes';
import { usePetStore } from '../../stores/PetStore';
import { hapticLight } from '../../utils/haptics';

export interface PetCareActionItem {
  action: PetAction;
  label: string;
  emoji: string;
  description: string;
}

export const PET_CARE_ITEMS: PetCareActionItem[] = [
  { action: 'bath',     label: 'Bath',     emoji: '🛁', description: 'Wash away dirt + boost happiness' },
  { action: 'medicine', label: 'Medicine', emoji: '💊', description: 'Restore health when sick' },
  { action: 'vitamin',  label: 'Vitamin',  emoji: '🌿', description: 'Temporary energy boost' },
];

export interface PetCareSheetProps {
  onClose: () => void;
}

export function PetCareSheet({ onClose }: PetCareSheetProps) {
  const theme = useTheme();
  const pet = usePetStore((s) => s.pet);
  const pending = usePetStore((s) => s.pendingActions);
  const performAction = usePetStore((s) => s.performAction);

  // Force a re-render once per minute so cooldowns visibly tick down.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const handleAction = useCallback(
    async (action: PetAction) => {
      hapticLight();
      try {
        await performAction(action);
      } catch {
        /* error already in store */
      }
    },
    [performAction]
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>
          Pet Care
        </Text>
        <Pressable hitSlop={12} onPress={onClose}>
          <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>✕</Text>
        </Pressable>
      </View>

      {PET_CARE_ITEMS.map((item) => {
        const remaining = cooldownRemaining(pet, item.action);
        const disabledReason = actionDisabledReason(pet, item.action);
        const isPending = pending.has(item.action);
        const isDisabled = remaining > 0 || !!disabledReason || isPending;
        const effect = PET_CARE_EFFECTS[item.action];

        return (
          <Pressable
            key={item.action}
            testID={`care-action-${item.action}`}
            onPress={() => handleAction(item.action)}
            disabled={isDisabled}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? theme.colors.surfacePressed
                  : theme.colors.surface,
                borderColor: theme.colors.separator,
                opacity: isDisabled ? 0.45 : 1,
              },
            ]}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.textBlock}>
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.text },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
              {remaining > 0 ? (
                <Text
                  testID={`cooldown-${item.action}`}
                  style={[styles.cooldown, { color: theme.colors.warning }]}
                >
                  ⏱ {cooldownLabel(remaining)}
                </Text>
              ) : disabledReason ? (
                <Text style={[styles.cooldown, { color: theme.colors.textSecondary }]}>
                  {disabledReason}
                </Text>
              ) : null}
              {effect.message ? (
                <Text
                  style={[styles.message, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {effect.message}
                </Text>
              ) : null}
            </View>
            {isPending ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : (
              <Text style={{ fontSize: 24, color: theme.colors.textSecondary }}>›</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    gap: 12,
  },
  emoji: {
    fontSize: 32,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    marginTop: 1,
  },
  cooldown: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  message: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
