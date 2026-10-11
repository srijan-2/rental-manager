import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, FAB, IconButton, Searchbar, Snackbar, Text, useTheme } from 'react-native-paper';
import { ManageBuildingsModal } from '../components/units/ManageBuildingsModal';
import { UnitCard } from '../components/units/UnitCard';
import { UnitFormModal } from '../components/units/UnitFormModal';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import { restoreUnit, updateUnitDetails } from '../store/actions';
import { useBuildingsStore, useTenantsStore, useUnitsStore } from '../store';
import { useUnitsStore as unitsStore } from '../store/unitsStore';
import { sharedStyles, spacing } from '../styles/layout';
import { AddUnitFormValues, RentalUnit } from '../types/unit';
import { parseCurrencyInput } from '../utils';

type Props = NativeStackScreenProps<UnitsStackParamList, 'UnitsList'>;

export function UnitsScreen({ navigation }: Props) {
  const theme = useTheme();
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);
  const tenants = useTenantsStore((state) => state.tenants);
  const [buildingId, setBuildingId] = useState('');
  const [query, setQuery] = useState('');
  const [formUnit, setFormUnit] = useState<RentalUnit | null | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);
  const [manageBuildings, setManageBuildings] = useState(false);
  const [message, setMessage] = useState('');
  const archivedCount = units.filter((unit) => unit.archivedAt).length;

  const handleSubmit = (values: AddUnitFormValues) => {
    if (formUnit) {
      updateUnitDetails(formUnit.id, {
        buildingId: values.buildingId,
        unitNumber: values.unitNumber,
        monthlyRent: parseCurrencyInput(values.monthlyRent),
        securityDeposit: values.securityDeposit
          ? parseCurrencyInput(values.securityDeposit)
          : undefined,
        subMeterId: values.subMeterId,
      });
      return;
    }
    unitsStore.getState().addUnit({
      id: `unit-${Date.now()}`,
      buildingId: values.buildingId,
      unitNumber: values.unitNumber.trim(),
      monthlyRent: parseCurrencyInput(values.monthlyRent),
      status: 'Vacant',
      securityDeposit: values.securityDeposit
        ? parseCurrencyInput(values.securityDeposit)
        : undefined,
      subMeterId: values.subMeterId.trim() || undefined,
    });
  };

  const shown = units.filter((unit) => {
    const building = buildings.find((item) => item.id === unit.buildingId);
    const tenant = tenants.find((item) => item.id === unit.tenantId);
    return (
      Boolean(unit.archivedAt) === showArchived &&
      (!buildingId || unit.buildingId === buildingId) &&
      `${unit.unitNumber} ${building?.name ?? ''} ${tenant?.name ?? ''}`
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
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            buildingName={
              buildings.find((building) => building.id === item.buildingId)?.name ??
              'Unknown building'
            }
            tenantDisplayName={tenants.find((tenant) => tenant.id === item.tenantId)?.name}
            onPress={(unit) => navigation.navigate('UnitDetails', { unitId: unit.id })}
            onRestore={() => {
              try {
                restoreUnit(item.id);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Unable to restore unit');
              }
            }}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text variant="headlineSmall" style={styles.title}>
                  Flats & Units
                </Text>
                <Text variant="bodyMedium">
                  Manage buildings, units, occupancy, tenants, and monthly rent.
                </Text>
              </View>
              <IconButton
                icon="domain"
                accessibilityLabel="Manage buildings"
                onPress={() => setManageBuildings(true)}
              />
            </View>
            <Searchbar
              placeholder="Search unit, building, or tenant"
              value={query}
              onChangeText={setQuery}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chips}
            >
              <Chip
                selected={!showArchived && !buildingId}
                onPress={() => {
                  setShowArchived(false);
                  setBuildingId('');
                }}
              >
                All
              </Chip>
              {archivedCount > 0 ? (
                <Chip
                  selected={showArchived}
                  onPress={() => {
                    setShowArchived(true);
                    setBuildingId('');
                  }}
                >
                  Archived ({archivedCount})
                </Chip>
              ) : null}
              {buildings.map((building) => (
                <Chip
                  key={building.id}
                  selected={buildingId === building.id}
                  onPress={() => setBuildingId(building.id)}
                >
                  {building.name}
                </Chip>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">
              {showArchived
                ? 'No archived units'
                : buildings.length
                  ? 'No units yet'
                  : 'No buildings yet'}
            </Text>
            <Text>Add a building while creating your first unit.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <FAB icon="plus" label="Add Unit" style={styles.fab} onPress={() => setFormUnit(null)} />
      <UnitFormModal
        visible={formUnit !== undefined}
        unit={formUnit}
        onDismiss={() => setFormUnit(undefined)}
        onSubmitUnit={handleSubmit}
      />
      <ManageBuildingsModal visible={manageBuildings} onDismiss={() => setManageBuildings(false)} />
      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={2500}>
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'relative' },
  list: { paddingBottom: 88 },
  header: { gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.xs },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  titleBlock: { flex: 1, gap: spacing.xs },
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
