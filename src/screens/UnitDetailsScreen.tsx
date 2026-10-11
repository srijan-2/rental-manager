import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Chip, Divider, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { UnitNotes } from '../components/units/UnitNotes';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import {
  useBuildingsStore,
  useElectricityBillsStore,
  usePaymentsStore,
  useTenantsStore,
  useUnitsStore,
} from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { formatINR, formatIndianDate, getBillStatus, todayISO } from '../utils';

type Props = NativeStackScreenProps<UnitsStackParamList, 'UnitDetails'>;

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export function UnitDetailsScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { unitId } = route.params;
  const unit = useUnitsStore((state) => state.units.find((item) => item.id === unitId));
  const addUnitNote = useUnitsStore((state) => state.addUnitNote);
  const updateUnitNote = useUnitsStore((state) => state.updateUnitNote);
  const deleteUnitNote = useUnitsStore((state) => state.deleteUnitNote);
  const buildings = useBuildingsStore((state) => state.buildings);
  const tenants = useTenantsStore((state) => state.tenants);
  const payments = usePaymentsStore((state) => state.payments);
  const electricityRecords = useElectricityBillsStore((state) => state.records);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const tenant = useMemo(
    () => (unit?.tenantId ? tenants.find((item) => item.id === unit.tenantId) : undefined),
    [tenants, unit?.tenantId]
  );

  const unitPayments = useMemo(
    () => payments.filter((payment) => payment.unitId === unitId),
    [payments, unitId]
  );

  const latestElectricity = useMemo(
    () => electricityRecords.find((record) => record.unitId === unitId),
    [electricityRecords, unitId]
  );

  const currentPaymentStatus = unitPayments[0]
    ? getBillStatus(unitPayments[0], todayISO())
    : 'In progress';

  if (!unit) {
    return (
      <View style={[sharedStyles.screen, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">Unit not found</Text>
      </View>
    );
  }

  const isOccupied = unit.status === 'Occupied';
  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={styles.topBarText}>
          <Text variant="headlineSmall" style={styles.heading}>
            {unit.unitNumber}
          </Text>
          <Text variant="bodyMedium">
            {buildings.find((building) => building.id === unit.buildingId)?.name ??
              'Unknown building'}
          </Text>
          <Chip
            compact
            style={{ backgroundColor: isOccupied ? '#14532d66' : '#78350f66' }}
            textStyle={{ color: isOccupied ? '#86EFAC' : '#FCD34D', fontWeight: '700' }}
          >
            {unit.status}
          </Chip>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <CollapsibleSection title="Current Tenant" icon="account-outline" defaultExpanded>
          {isOccupied && tenant ? (
            <>
              <DetailRow label="Name" value={tenant.name} />
              <DetailRow label="Phone" value={tenant.phone} />
              <DetailRow label="Move-in Date" value={formatIndianDate(tenant.moveInDate)} />
            </>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No active tenant assigned to this unit.
            </Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Rent Information" icon="currency-inr">
          <DetailRow label="Monthly Rent" value={`${formatINR(unit.monthlyRent)}/month`} />
          <DetailRow label="Payment Status" value={currentPaymentStatus} />
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Payment History
          </Text>
          {unitPayments.length > 0 ? (
            unitPayments.map((payment) => (
              <View key={payment.id} style={styles.historyItem}>
                <Text variant="bodyMedium">{formatINR(payment.rentAmount)}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {getBillStatus(payment, todayISO())} · {formatIndianDate(payment.dueDate)}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              No rent payment records yet.
            </Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Electricity" icon="flash-outline">
          <DetailRow
            label="Current Prepaid Balance"
            value={formatINR(unit.prepaidElectricityBalance ?? 0, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
          {tenant ? (
            <>
              <DetailRow label="Electricity Advance" value={formatINR(tenant.electricityAdvance)} />
              <DetailRow label="Opening Meter Reading" value={String(tenant.openingMeterReading)} />
              <DetailRow
                label="Billing Start Date"
                value={formatIndianDate(tenant.billingStartDate)}
              />
            </>
          ) : null}
          <DetailRow
            label="Last Meter Reading"
            value={
              latestElectricity
                ? `${latestElectricity.currentMeterReading} (${latestElectricity.monthLabel})`
                : 'No reading recorded'
            }
          />
        </CollapsibleSection>

        <CollapsibleSection title="Security Deposit" icon="shield-check-outline">
          <DetailRow label="Deposit Collected" value={formatINR(unit.securityDeposit ?? 0)} />
        </CollapsibleSection>

        <CollapsibleSection title="Notes" icon="note-text-outline">
          <UnitNotes
            notes={unit.notes ?? []}
            onAdd={(text) => addUnitNote(unit.id, text)}
            onUpdate={(noteId, text) => updateUnitNote(unit.id, noteId, text)}
            onDelete={(noteId) => deleteUnitNote(unit.id, noteId)}
            onMessage={(message) => {
              setSnackbarMessage(message);
              setSnackbarVisible(true);
            }}
          />
        </CollapsibleSection>
      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  topBarText: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.xl,
  },
  heading: {
    fontWeight: '700',
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  detailRow: {
    gap: spacing.xxs,
  },
  detailValue: {
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.xs,
  },
  historyItem: {
    gap: 2,
    marginBottom: spacing.xs,
  },
});
