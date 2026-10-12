import { useState, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { UnitNotes } from '../components/units/UnitNotes';
import { UnitFormModal } from '../components/units/UnitFormModal';
import { useToday } from '../hooks/useToday';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import { useBuildingsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { formatINR, formatIndianDate, getBillStatus } from '../utils';
import { describeOutstanding, getBillAmounts } from '../utils/payments';
import { formatUnitLabel } from '../utils/unitLabel';
import { archiveUnit, deleteUnit, updateUnitDetails } from '../store/actions';
import { parseCurrencyInput } from '../utils';

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
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const today = useToday();

  const tenant = useMemo(
    () => (unit?.tenantId ? tenants.find((item) => item.id === unit.tenantId) : undefined),
    [tenants, unit?.tenantId]
  );

  const unitPayments = useMemo(
    () =>
      payments
        .filter((payment) => payment.unitId === unitId)
        .sort((a, b) => b.cycleStart.localeCompare(a.cycleStart)),
    [payments, unitId]
  );

  const latestElectricityBill = useMemo(
    () => unitPayments.find((payment) => payment.electricity),
    [unitPayments]
  );

  const currentPaymentStatus = unitPayments[0]
    ? getBillStatus(unitPayments[0], today)
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
            {formatUnitLabel(
              unit,
              buildings.find((building) => building.id === unit.buildingId)
            )}
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
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            title="Edit unit"
            onPress={() => {
              setMenuVisible(false);
              setEditVisible(true);
            }}
          />
          {unit.tenantId ? <Menu.Item disabled title="Remove the tenant first" /> : null}
          <Menu.Item
            disabled={Boolean(unit.tenantId)}
            title={unitPayments.length ? 'Archive unit' : 'Delete unit'}
            onPress={() => {
              setMenuVisible(false);
              const label = formatUnitLabel(
                unit,
                buildings.find((item) => item.id === unit.buildingId)
              );
              if (unitPayments.length) {
                Alert.alert(
                  `Archive ${label}?`,
                  'The unit will be hidden from lists, but its history will be kept and it can be restored.',
                  [
                    { text: 'Cancel' },
                    {
                      text: 'Archive',
                      onPress: () => {
                        navigation.goBack();
                        archiveUnit(unit.id);
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  `Delete ${label}?`,
                  'Its notes will also be deleted. This cannot be undone.',
                  [
                    { text: 'Cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        navigation.goBack();
                        deleteUnit(unit.id);
                      },
                    },
                  ]
                );
              }
            }}
          />
          {unit.tenantId ? (
            <Button compact disabled>
              Remove the tenant first
            </Button>
          ) : null}
        </Menu>
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
                <Text variant="bodyMedium">{payment.periodLabel}</Text>
                <Text variant="bodyMedium">{formatINR(getBillAmounts(payment).totalBilled)}</Text>
                <Chip compact>{getBillStatus(payment, today)}</Chip>
                {payment.rentMethod === 'Settlement' ||
                payment.electricityMethod === 'Settlement' ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Settled at move-out
                  </Text>
                ) : null}
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {describeOutstanding(payment, today)}
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
            label="Last meter reading"
            value={
              unit.lastMeterReading === undefined
                ? 'No reading recorded'
                : String(unit.lastMeterReading)
            }
          />
          <DetailRow
            label="Current rate"
            value={
              latestElectricityBill
                ? formatINR(latestElectricityBill.electricity!.ratePerUnit, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '-'
            }
          />
          <DetailRow
            label="Latest charge"
            value={
              latestElectricityBill
                ? `${formatINR(latestElectricityBill.electricity!.amount, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} · ${latestElectricityBill.periodLabel}`
                : '-'
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
      <UnitFormModal
        visible={editVisible}
        unit={unit}
        onDismiss={() => setEditVisible(false)}
        onSubmitUnit={(values) =>
          updateUnitDetails(unit.id, {
            buildingId: values.buildingId,
            unitNumber: values.unitNumber,
            monthlyRent: parseCurrencyInput(values.monthlyRent),
            securityDeposit: values.securityDeposit
              ? parseCurrencyInput(values.securityDeposit)
              : undefined,
            subMeterId: values.subMeterId,
          })
        }
      />
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
