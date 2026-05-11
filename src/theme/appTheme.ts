import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const appTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 16,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7E9BFF',
    secondary: '#7DD3FC',
    tertiary: '#22D3EE',
    background: '#0B111B',
    surface: '#111827',
    surfaceVariant: '#1A2333',
    outline: '#334155',
    outlineVariant: '#293241',
    error: '#F87171',
    onPrimary: '#06122E',
  },
};
