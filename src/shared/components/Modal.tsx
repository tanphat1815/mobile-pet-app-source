/**
 * Modal Component
 *
 * Modal overlay with backdrop, content card.
 * Uses useModalTransition for fade + scale animation.
 */

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useModalTransition } from '../transitions/useModalTransition';

interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  dismissOnBackdropPress?: boolean;
  /** Optional header title rendered at the top of the modal. */
  title?: string;
}

export function Modal({
  visible,
  onRequestClose,
  children,
  contentStyle,
  dismissOnBackdropPress = true,
  title,
}: ModalProps) {
  const theme = useTheme();
  const { overlayStyle, contentStyle: animatedContent, animateIn, animateOut } =
    useModalTransition();

  useEffect(() => {
    if (visible) {
      // small delay so the modal can mount before animating
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
      <View style={[styles.root, { backgroundColor: 'transparent' }]}>
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: theme.colors.overlay },
            overlayStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        </Animated.View>
        <View style={styles.contentWrapper} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.content,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                ...theme.shadows.elevation4,
              },
              animatedContent,
              contentStyle,
            ]}
          >
            {title ? (
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.typography.size.title3,
                  fontWeight: '700',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {title}
              </Text>
            ) : null}
            {children}
          </Animated.View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    position: 'absolute',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    minWidth: 280,
    maxWidth: 480,
    alignSelf: 'center',
  },
});