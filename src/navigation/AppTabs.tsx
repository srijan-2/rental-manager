import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ElectricityBillsScreen } from '../screens/ElectricityBillsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { TenantsScreen } from '../screens/TenantsScreen';
import { UnitsScreen } from '../screens/UnitsScreen';

type RootTabParamList = {
  Dashboard: undefined;
  Units: undefined;
  Tenants: undefined;
  Payments: undefined;
  ElectricityBalance: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof RootTabParamList, React.ComponentProps<typeof MaterialCommunityIcons>['name']> =
            {
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
      <Tab.Screen name="Units" component={UnitsScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen
        name="ElectricityBalance"
        component={ElectricityBillsScreen}
        options={{ title: 'Electricity' }}
      />
    </Tab.Navigator>
  );
}
