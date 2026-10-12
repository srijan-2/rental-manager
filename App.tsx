import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTabs } from './src/navigation/AppTabs';
import { createAppTheme } from './src/theme/appTheme';
import { useBillScheduleSync } from './src/hooks/useBillScheduleSync';
import { useSettingsStore } from './src/store';
import { WhatsAppShareProvider } from './src/whatsapp/WhatsAppShareProvider';

export default function App() {
  useBillScheduleSync();
  const language = useSettingsStore((state) => state.language);
  const largeText = useSettingsStore((state) => state.largeText);
  const appTheme = useMemo(() => createAppTheme({ language, largeText }), [language, largeText]);
  const navigationTheme = useMemo(
    () => ({
      ...NavigationDefaultTheme,
      colors: {
        ...NavigationDefaultTheme.colors,
        background: appTheme.colors.background,
        card: appTheme.colors.elevation.level2,
        text: appTheme.colors.onSurface,
        border: appTheme.colors.outlineVariant,
        primary: appTheme.colors.primary,
      },
    }),
    [appTheme]
  );

  useEffect(() => {
    void AsyncStorage.removeItem('rm-electricity');
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <WhatsAppShareProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="light" />
            <AppTabs />
          </NavigationContainer>
        </WhatsAppShareProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
