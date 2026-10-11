import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTabs } from './src/navigation/AppTabs';
import { appTheme } from './src/theme/appTheme';

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
