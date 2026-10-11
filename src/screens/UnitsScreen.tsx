import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import { AddUnitModal } from '../components/units/AddUnitModal';
import { UnitCard } from '../components/units/UnitCard';
import { useBuildingsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { AddUnitFormValues, RentalUnit } from '../types/unit';
import { parseCurrencyInput } from '../utils';
type Props = NativeStackScreenProps<UnitsStackParamList, 'UnitsList'>;
export function UnitsScreen({ navigation }: Props) {
  const theme = useTheme();
  const units = useUnitsStore((s) => s.units);
  const addUnit = useUnitsStore((s) => s.addUnit);
  const buildings = useBuildingsStore((s) => s.buildings);
  const tenants = useTenantsStore((s) => s.tenants);
  const [buildingId, setBuildingId] = useState('');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const handleAdd = (v: AddUnitFormValues) => {
    const unit: RentalUnit = {
      id: `unit-${Date.now()}`,
      buildingId: v.buildingId,
      unitNumber: v.unitNumber.trim(),
      monthlyRent: parseCurrencyInput(v.monthlyRent),
      status: 'Vacant',
      securityDeposit: v.securityDeposit ? parseCurrencyInput(v.securityDeposit) : undefined,
      subMeterId: v.subMeterId.trim() || undefined,
      prepaidElectricityBalance: v.prepaidElectricityBalance
        ? parseCurrencyInput(v.prepaidElectricityBalance)
        : 0,
    };
    addUnit(unit);
  };
  const shown = units.filter((u) => {
    const b = buildings.find((x) => x.id === u.buildingId);
    const t = tenants.find((x) => x.id === u.tenantId);
    return (
      (!buildingId || u.buildingId === buildingId) &&
      `${u.unitNumber} ${b?.name ?? ''} ${t?.name ?? ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  });
  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={shown}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            buildingName={
              buildings.find((b) => b.id === item.buildingId)?.name ?? 'Unknown building'
            }
            tenantDisplayName={tenants.find((t) => t.id === item.tenantId)?.name}
            onPress={(u) => navigation.navigate('UnitDetails', { unitId: u.id })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Flats & Units
            </Text>
            <Text variant="bodyMedium">
              Manage buildings, units, occupancy, tenants, and monthly rent.
            </Text>
            <Searchbar
              placeholder="Search unit, building, or tenant"
              value={query}
              onChangeText={setQuery}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip selected={!buildingId} onPress={() => setBuildingId('')}>
                All
              </Chip>
              {buildings.map((b) => (
                <Chip key={b.id} selected={buildingId === b.id} onPress={() => setBuildingId(b.id)}>
                  {b.name}
                </Chip>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">
              {buildings.length ? 'No units yet' : 'No buildings yet'}
            </Text>
            <Text>Add a building while creating your first unit.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <FAB icon="plus" label="Add Unit" style={styles.fab} onPress={() => setVisible(true)} />
      <AddUnitModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        onSubmitUnit={handleAdd}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { position: 'relative' },
  list: { paddingBottom: 88 },
  header: { gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.xs },
  title: { fontWeight: '700' },
  chips: { gap: spacing.xs, paddingVertical: spacing.sm },
  empty: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  fab: { bottom: spacing.lg, position: 'absolute', right: spacing.md },
});
