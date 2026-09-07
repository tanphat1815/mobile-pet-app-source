/**
 * AmbientScreen
 *
 * Hosts the AmbientPlayer (sound mixer).
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { AmbientPlayer } from '../../shared/components/AmbientPlayer';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Ambient'>;

export function AmbientScreen({ navigation }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>← Back</Text>
        </Pressable>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title2,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          Ambient
        </Text>
      </View>
      <AmbientPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
});
