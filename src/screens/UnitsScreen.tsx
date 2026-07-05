import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FAB, Text, useTheme } from 'react-native-paper';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import { AddUnitModal } from '../components/units/AddUnitModal';
import { UnitCard } from '../components/units/UnitCard';
import { useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { AddUnitFormValues, RentalUnit } from '../types/unit';
import { parseCurrencyInput } from '../utils';

type Props = NativeStackScreenProps<UnitsStackParamList, 'UnitsList'>;

export function UnitsScreen({ navigation }: Props) {
  const theme = useTheme();
  const units = useUnitsStore((state) => state.units);
  const addUnit = useUnitsStore((state) => state.addUnit);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleAddUnit = (values: AddUnitFormValues) => {
    const newUnit: RentalUnit = {
      id: `unit-${Date.now()}`,
      unitNumber: values.unitNumber.trim(),
      tenantName: values.tenantName.trim(),
      monthlyRent: parseCurrencyInput(values.monthlyRent),
      status: values.status,
      dueDate: values.moveInDate.trim(),
      moveInDate: values.moveInDate.trim(),
      securityDeposit: parseCurrencyInput(values.securityDeposit),
      prepaidElectricityBalance: 1500,
    };

    addUnit(newUnit);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="headlineSmall" style={styles.title}>
        Flats & Units
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Manage occupied/vacant status, tenants, rent agreements, and due dates.
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View
      style={[
        styles.emptyContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Text variant="titleMedium">No units yet</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Add your first unit to start tracking occupied/vacant status and monthly rent collection.
      </Text>
    </View>
  );

  return (
    <View style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={units}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            onPress={(unit) => navigation.navigate('UnitDetails', { unitId: unit.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        label="Add Unit"
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      />

      <AddUnitModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        onSubmitUnit={handleAddUnit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  listContent: {
    paddingBottom: 88,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  fab: {
    bottom: spacing.lg,
    position: 'absolute',
    right: spacing.md,
  },
});
