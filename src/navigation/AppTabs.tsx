import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ElectricityScreen } from '../screens/ElectricityScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { TenantsScreen } from '../screens/TenantsScreen';
import { UnitsStack } from './UnitsStack';
import { useT } from '../i18n';

export type RootTabParamList = {
  Dashboard: undefined;
  Units: undefined;
  Tenants: undefined;
  Payments: undefined;
  ElectricityBalance: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppTabs() {
  const theme = useTheme();
  const { t } = useT();
  const titles: Record<keyof RootTabParamList, string> = {
    Dashboard: t('tab.dashboard'),
    Units: t('tab.units'),
    Tenants: t('tab.tenants'),
    Payments: t('tab.payments'),
    ElectricityBalance: t('tab.electricity'),
  };

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: titles[route.name],
        tabBarLabelStyle: {
          fontSize: theme.fonts.labelMedium.fontSize,
          lineHeight: theme.fonts.labelMedium.lineHeight,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<
            keyof RootTabParamList,
            React.ComponentProps<typeof MaterialCommunityIcons>['name']
          > = {
            Dashboard: 'view-dashboard-outline',
            Units: 'office-building-outline',
            Tenants: 'account-group-outline',
            Payments: 'cash-multiple',
            ElectricityBalance: 'flash-outline',
          };

          return <MaterialCommunityIcons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Units" component={UnitsStack} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="ElectricityBalance" component={ElectricityScreen} />
    </Tab.Navigator>
  );
}
