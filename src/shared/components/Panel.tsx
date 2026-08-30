/**
 * Panel Component
 *
 * Bottom sheet / panel that slides up from the bottom.
 * Uses usePanelTransition. Includes backdrop tap to dismiss.
 */

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { usePanelTransition } from '../transitions/usePanelTransition';

interface PanelProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  dismissOnBackdropPress?: boolean;
  maxHeight?: number | string;
}

export function Panel({
  visible,
  onRequestClose,
  children,
  contentStyle,
  dismissOnBackdropPress = true,
  maxHeight = '80%',
}: PanelProps) {
  const theme = useTheme();
  const { containerStyle, animateIn, animateOut } = usePanelTransition();

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => animateIn());
    }
  }, [visible, animateIn]);

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      animateOut(onRequestClose);
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => animateOut(onRequestClose)}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={handleBackdropPress}
        />
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              paddingBottom: theme.spacing.xxxl,
              ...theme.shadows.elevation4,
              maxHeight: typeof maxHeight === 'number' ? maxHeight : undefined,
            },
            containerStyle,
            contentStyle,
          ]}
        >
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.border, marginBottom: theme.spacing.md },
            ]}
          />
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    position: 'absolute',
  },
  content: {
    width: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
});