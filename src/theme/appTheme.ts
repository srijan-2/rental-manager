import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export function createAppTheme({
  largeText,
  language,
}: {
  largeText: boolean;
  language: 'hi' | 'en';
}): MD3Theme {
  const scale = largeText ? 1.25 : 1;
  const fonts = { ...MD3DarkTheme.fonts };
  (Object.keys(fonts) as Array<Exclude<keyof MD3Theme['fonts'], 'default'>>).forEach((name) => {
    const font = fonts[name];
    const fontSize = font.fontSize * scale;
    const lineHeight = font.lineHeight * scale;
    fonts[name] = {
      ...font,
      fontSize,
      lineHeight: language === 'hi' ? Math.max(lineHeight, fontSize * 1.5) : lineHeight,
    };
  });

  return {
    ...MD3DarkTheme,
    fonts,
    roundness: 16,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#7E9BFF',
      secondary: '#7DD3FC',
      tertiary: '#22D3EE',
      background: '#0B111B',
      surface: '#111827',
      surfaceVariant: '#1A2333',
      backdrop: 'rgba(0, 0, 0, 0.75)',
      outline: '#334155',
      outlineVariant: '#293241',
      error: '#F87171',
      onPrimary: '#06122E',
    },
  };
}

export const appTheme = createAppTheme({ largeText: false, language: 'en' });
