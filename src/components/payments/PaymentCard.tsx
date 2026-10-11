import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import { Building } from '../../types/building';
import { Payment } from '../../types/payment';
import { RentalUnit } from '../../types/unit';
import { formatINR, formatIndianDate, formatUnitLabel } from '../../utils';
import {
  describeOutstanding,
  getBillAmounts,
  getBillStatus,
  isReadingWindowOpen,
} from '../../utils/payments';
import { radius, spacing } from '../../styles/layout';
import { getStatusColors } from '../../theme/statusColors';

interface PaymentCardProps {
  bill: Payment;
  unit?: RentalUnit;
  building?: Building;
  todayIso: string;
  canEditReading: boolean;
  onCollectRent: (id: string) => void;
  onCollectElectricity: (id: string) => void;
  onCollectAll: (id: string) => void;
  onEnterReading: (id: string) => void;
  onMarkRentUnpaid: (id: string) => void;
  onMarkElectricityUnpaid: (id: string) => void;
  onDeleteBill: (id: string) => void;
}

export const PaymentCard = memo(
  ({
    bill,
    unit,
    building,
    todayIso,
    canEditReading,
    onCollectRent,
    onCollectElectricity,
    onCollectAll,
    onEnterReading,
    onMarkRentUnpaid,
    onMarkElectricityUnpaid,
    onDeleteBill,
  }: PaymentCardProps) => {
    const theme = useTheme();
    const status = getBillStatus(bill, todayIso);
    const amounts = getBillAmounts(bill);
    const statusColor = getStatusColors(status);
    const readingWindowOpen = isReadingWindowOpen(bill, todayIso);

    return (
      <Surface
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
      >
        <View style={styles.header}>
          <View style={styles.details}>
            <Text variant="titleMedium" style={styles.unitLabel}>
              {unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
            </Text>
            <Text variant="bodyMedium">{bill.tenantName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {bill.periodLabel}
            </Text>
          </View>
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor.background }]}
            textStyle={{ color: statusColor.text, fontWeight: '700' }}
          >
            {status}
          </Chip>
        </View>

        <Text variant="bodyMedium">{describeOutstanding(bill, todayIso)}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Due {formatIndianDate(bill.dueDate)} · Rent {formatINR(bill.rentAmount)}
        </Text>
        {bill.electricity ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Electricity: {bill.electricity.unitsConsumed} ×{' '}
            {formatINR(bill.electricity.ratePerUnit)} = {formatINR(bill.electricity.amount)}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            disabled={!readingWindowOpen || (Boolean(bill.electricity) && !canEditReading)}
            onPress={() => onEnterReading(bill.id)}
          >
            {bill.electricity
              ? 'Edit reading'
              : readingWindowOpen
                ? 'Enter reading'
                : `Available from ${formatIndianDate(bill.cycleEnd)}`}
          </Button>
          {!bill.rentPaidDate ? (
            <Button mode="contained-tonal" onPress={() => onCollectRent(bill.id)}>
              Collect rent
            </Button>
          ) : bill.rentPaidDate ? (
            <Button mode="text" onPress={() => onMarkRentUnpaid(bill.id)}>
              Mark rent unpaid
            </Button>
          ) : null}
          {bill.electricity && !bill.electricityPaidDate ? (
            <Button mode="contained-tonal" onPress={() => onCollectElectricity(bill.id)}>
              Collect electricity
            </Button>
          ) : bill.electricityPaidDate ? (
            <Button mode="text" onPress={() => onMarkElectricityUnpaid(bill.id)}>
              Mark electricity unpaid
            </Button>
          ) : null}
          {bill.electricity && !bill.rentPaidDate && !bill.electricityPaidDate ? (
            <Button mode="contained" onPress={() => onCollectAll(bill.id)}>
              Collect all
            </Button>
          ) : null}
          {!bill.rentPaidDate && !bill.electricity ? (
            <Button mode="text" onPress={() => onDeleteBill(bill.id)}>
              Delete bill
            </Button>
          ) : null}
        </View>
        {bill.rentPaidDate ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Rent paid {formatIndianDate(bill.rentPaidDate)} · {bill.rentMethod}
          </Text>
        ) : null}
        {bill.electricityPaidDate ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Electricity paid {formatIndianDate(bill.electricityPaidDate)} · {bill.electricityMethod}
          </Text>
        ) : null}
        {status === 'Paid' ? (
          <Text variant="titleMedium">Total collected {formatINR(amounts.totalBilled)}</Text>
        ) : null}
      </Surface>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  details: { flex: 1 },
  unitLabel: { fontWeight: '700' },
  statusChip: { borderRadius: radius.sm },
  actions: { gap: spacing.xs },
});
