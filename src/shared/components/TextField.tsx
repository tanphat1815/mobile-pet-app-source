/**
 * TextField Component
 *
 * Text input with label, optional error, focus state.
 * Uses useInputShake for error state.
 */

import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useInputShake } from '../transitions/useInputShake';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  shakeOnError?: boolean;
  containerStyle?: ViewStyle;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, shakeOnError = true, containerStyle, onFocus, onBlur, ...rest },
  ref
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const { animatedStyle, shake } = useInputShake();

  React.useEffect(() => {
    if (error && shakeOnError) {
      shake();
    }
  }, [error, shakeOnError, shake]);

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.accent
    : theme.colors.border;

  return (
    <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: focused ? theme.colors.accent : theme.colors.textSecondary,
              fontSize: theme.typography.size.footnote,
              fontWeight: theme.typography.weight.medium,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radius.md,
            borderWidth: focused || error ? 2 : 1,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.size.body,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text
          style={[
            styles.errorText,
            { color: theme.colors.danger, fontSize: theme.typography.size.footnote },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
});