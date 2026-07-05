import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { UnitDetailsScreen } from '../screens/UnitDetailsScreen';
import { UnitsScreen } from '../screens/UnitsScreen';

export type UnitsStackParamList = {
  UnitsList: undefined;
  UnitDetails: { unitId: string };
};

const Stack = createNativeStackNavigator<UnitsStackParamList>();

export function UnitsStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="UnitsList" component={UnitsScreen} />
      <Stack.Screen name="UnitDetails" component={UnitDetailsScreen} />
    </Stack.Navigator>
  );
}
