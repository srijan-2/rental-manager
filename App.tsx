import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTabs } from './src/navigation/AppTabs';
import { appTheme } from './src/theme/appTheme';
import { useBillScheduleSync } from './src/hooks/useBillScheduleSync';

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: appTheme.colors.background,
    card: appTheme.colors.elevation.level2,
    text: appTheme.colors.onSurface,
    border: appTheme.colors.outlineVariant,
    primary: appTheme.colors.primary,
  },
};

export default function App() {
  useBillScheduleSync();

  useEffect(() => {
    void AsyncStorage.removeItem('rm-electricity');
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <AppTabs />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
