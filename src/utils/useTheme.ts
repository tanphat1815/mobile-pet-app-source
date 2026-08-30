/**
 * useTheme Hook
 *
 * Returns the appropriate theme based on the system color scheme.
 * When system is in dark mode, returns darkTheme; otherwise lightTheme.
 *
 * Usage:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.colors.bg }} />
 */

import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './theme';

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
