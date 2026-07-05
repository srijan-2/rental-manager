import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { getUnitDetailsExtras } from '../data/mockUnitDetails';
import { UnitsStackParamList } from '../navigation/UnitsStack';
import { useElectricityBillsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { formatINR, formatIndianDate } from '../utils';

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
  const tenants = useTenantsStore((state) => state.tenants);
  const payments = usePaymentsStore((state) => state.payments);
  const electricityRecords = useElectricityBillsStore((state) => state.records);
  const extras = useMemo(() => getUnitDetailsExtras(unitId), [unitId]);
  const [notes, setNotes] = useState(extras.notes);
  const [newReading, setNewReading] = useState('');

  const tenant = useMemo(
    () => tenants.find((item) => item.assignedUnit === unit?.unitNumber),
    [tenants, unit?.unitNumber]
  );

  const unitPayments = useMemo(
    () => payments.filter((payment) => payment.unitNumber === unit?.unitNumber),
    [payments, unit?.unitNumber]
  );

  const latestElectricity = useMemo(
    () => electricityRecords.find((record) => record.unitId === unitId),
    [electricityRecords, unitId]
  );

  const currentPaymentStatus = unitPayments[0]?.status ?? 'Pending';

  if (!unit) {
    return (
      <View style={[sharedStyles.screen, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">Unit not found</Text>
      </View>
    );
  }

  const isOccupied = unit.status === 'Occupied';

  return (
    <View style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={styles.topBarText}>
          <Text variant="headlineSmall" style={styles.heading}>
            {unit.unitNumber}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
          <DetailRow label="Rent Due Date" value={formatIndianDate(unit.dueDate)} />
          <Divider style={styles.divider} />
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Payment History
          </Text>
          {unitPayments.length > 0 ? (
            unitPayments.map((payment) => (
              <View key={payment.id} style={styles.historyItem}>
                <Text variant="bodyMedium">{formatINR(payment.amount)}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {payment.status} · {formatIndianDate(payment.dueDate)}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              No rent payment records yet.
            </Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Documents" icon="file-document-outline">
          {extras.documents.map((doc) => (
            <View key={doc.id} style={styles.historyItem}>
              <Text variant="bodyMedium">{doc.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Uploaded {formatIndianDate(doc.uploadedAt)}
              </Text>
            </View>
          ))}
          <Button mode="outlined" icon="file-upload-outline" style={styles.actionButton}>
            Upload Rent Agreement PDF
          </Button>
          <Button mode="outlined" icon="camera-outline" style={styles.actionButton}>
            Upload Aadhaar / PAN Image
          </Button>
        </CollapsibleSection>

        <CollapsibleSection title="Electricity" icon="flash-outline">
          <DetailRow
            label="Current Prepaid Balance"
            value={formatINR(unit.prepaidElectricityBalance ?? 0, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
          <DetailRow
            label="Last Meter Reading"
            value={
              latestElectricity
                ? `${latestElectricity.currentMeterReading} (${latestElectricity.monthLabel})`
                : 'No reading recorded'
            }
          />
          <TextInput
            label="Add New Reading"
            mode="outlined"
            keyboardType="numeric"
            value={newReading}
            onChangeText={setNewReading}
            placeholder="Enter current sub-meter reading"
          />
          <Button mode="contained-tonal" icon="plus" disabled={!newReading.trim()}>
            Save Reading
          </Button>
        </CollapsibleSection>

        <CollapsibleSection title="Security Deposit" icon="shield-check-outline">
          <DetailRow
            label="Deposit Collected"
            value={formatINR(extras.securityDeposit.collected || unit.securityDeposit || 0)}
          />
          <DetailRow label="Refund Status" value={extras.securityDeposit.refundStatus} />
          {extras.securityDeposit.refundAmount ? (
            <DetailRow
              label="Refund Amount"
              value={formatINR(extras.securityDeposit.refundAmount)}
            />
          ) : null}
          {extras.securityDeposit.refundDate ? (
            <DetailRow
              label="Refund Date"
              value={formatIndianDate(extras.securityDeposit.refundDate)}
            />
          ) : null}
          {extras.securityDeposit.notes ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {extras.securityDeposit.notes}
            </Text>
          ) : null}
        </CollapsibleSection>

        <CollapsibleSection title="Maintenance" icon="tools">
          {extras.maintenanceRecords.length > 0 ? (
            extras.maintenanceRecords.map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {record.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {record.description}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Expense: {formatINR(record.expense)} · {formatIndianDate(record.completedAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              No maintenance records for this unit.
            </Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Notes" icon="note-text-outline">
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add internal notes about this unit or tenant..."
          />
          <Button mode="contained-tonal" onPress={() => undefined}>
            Save Notes
          </Button>
        </CollapsibleSection>
      </ScrollView>
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
  actionButton: {
    marginTop: spacing.xxs,
  },
});
