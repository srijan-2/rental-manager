import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import { Building } from '../../types/building';
import { Payment } from '../../types/payment';
import { RentalUnit } from '../../types/unit';
import { Tenant } from '../../types/tenant';
import { formatINR, formatUnitLabel } from '../../utils';
import {
  describeOutstanding,
  getBillAmounts,
  getBillStatus,
  isReadingWindowOpen,
} from '../../utils/payments';
import { radius, spacing } from '../../styles/layout';
import { getStatusColors } from '../../theme/statusColors';
import { getMethodLabel, getStatusLabel, useT } from '../../i18n';
import { useDateFormat } from '../../hooks/useDateFormat';
import { daysSince } from '../../utils/relativeDays';

interface PaymentCardProps {
  bill: Payment;
  unit?: RentalUnit;
  building?: Building;
  tenant?: Tenant;
  todayIso: string;
  canEditReading: boolean;
  onCollectRent: (id: string) => void;
  onCollectElectricity: (id: string) => void;
  onCollectAll: (id: string) => void;
  onChangeRentPayment: (id: string) => void;
  onChangeElectricityPayment: (id: string) => void;
  onEnterReading: (id: string) => void;
  onMarkRentUnpaid: (id: string) => void;
  onMarkElectricityUnpaid: (id: string) => void;
  onDeleteBill: (id: string) => void;
  onSendBill: (id: string) => void;
  onSendReceipt: (id: string, components: ('rent' | 'electricity')[]) => void;
  onRemind: (id: string) => void;
}

export const PaymentCard = memo(
  ({
    bill,
    unit,
    building,
    tenant,
    todayIso,
    canEditReading,
    onCollectRent,
    onCollectElectricity,
    onCollectAll,
    onChangeRentPayment,
    onChangeElectricityPayment,
    onEnterReading,
    onMarkRentUnpaid,
    onMarkElectricityUnpaid,
    onDeleteBill,
    onSendBill,
    onSendReceipt,
    onRemind,
  }: PaymentCardProps) => {
    const theme = useTheme();
    const { t } = useT();
    const { formatIndianDate } = useDateFormat();
    const status = getBillStatus(bill, todayIso);
    const amounts = getBillAmounts(bill);
    const statusColor = getStatusColors(status);
    const readingWindowOpen = isReadingWindowOpen(bill, todayIso);
    const receiptComponents = [
      ...(bill.rentPaidDate && bill.rentMethod !== 'Settlement' && !bill.rentReceiptSentAt
        ? (['rent'] as const)
        : []),
      ...(bill.electricityPaidDate &&
      bill.electricityMethod !== 'Settlement' &&
      !bill.electricityReceiptSentAt
        ? (['electricity'] as const)
        : []),
    ];
    const canRemind =
      tenant &&
      bill.electricity &&
      amounts.outstanding > 0 &&
      (status === 'Due' || status === 'Overdue');

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
            {getStatusLabel(status, t)}
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
          ) : bill.rentPaidDate && bill.rentMethod !== 'Settlement' ? (
            <Button mode="text" onPress={() => onMarkRentUnpaid(bill.id)}>
              Mark rent unpaid
            </Button>
          ) : null}
          {bill.electricity && !bill.electricityPaidDate ? (
            <Button mode="contained-tonal" onPress={() => onCollectElectricity(bill.id)}>
              Collect electricity
            </Button>
          ) : bill.electricityPaidDate && bill.electricityMethod !== 'Settlement' ? (
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
            {bill.rentMethod === 'Settlement'
              ? 'Settled at move-out'
              : `Rent paid ${formatIndianDate(bill.rentPaidDate)} · ${getMethodLabel(bill.rentMethod ?? 'Cash', t)}`}
          </Text>
        ) : null}
        {bill.rentPaidDate && bill.rentMethod !== 'Settlement' ? (
          <Button mode="text" compact onPress={() => onChangeRentPayment(bill.id)}>
            Change date / method
          </Button>
        ) : null}
        {bill.electricityPaidDate ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {bill.electricityMethod === 'Settlement'
              ? 'Settled at move-out'
              : `Electricity paid ${formatIndianDate(bill.electricityPaidDate)} · ${getMethodLabel(bill.electricityMethod ?? 'Cash', t)}`}
          </Text>
        ) : null}
        {bill.electricityPaidDate && bill.electricityMethod !== 'Settlement' ? (
          <Button mode="text" compact onPress={() => onChangeElectricityPayment(bill.id)}>
            Change date / method
          </Button>
        ) : null}
        {status === 'Paid' ? (
          <Text variant="titleMedium">Total collected {formatINR(amounts.totalBilled)}</Text>
        ) : null}
        {tenant && receiptComponents.length ? (
          <Button mode="outlined" onPress={() => onSendReceipt(bill.id, receiptComponents)}>
            {t('whatsapp.sendReceipt')}
          </Button>
        ) : null}
        {canRemind ? (
          <>
            <Button mode="text" onPress={() => onRemind(bill.id)}>
              {t('whatsapp.remind')}
            </Button>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {reminderHistory(bill.lastReminderAt, todayIso, t)}
            </Text>
          </>
        ) : null}
        {receiptComponents.length === 0 &&
        (bill.rentReceiptSentAt || bill.electricityReceiptSentAt) ? (
          <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
            {t('whatsapp.receiptSent')}
          </Text>
        ) : null}
        {tenant &&
        bill.electricity &&
        status !== 'In progress' &&
        status !== 'Calculation pending' ? (
          <>
            <Button mode="outlined" onPress={() => onSendBill(bill.id)}>
              {status === 'Paid' ? t('whatsapp.sendAgain') : t('whatsapp.sendBill')}
            </Button>
            {bill.sharedAt && bill.sharedTotal === amounts.totalBilled ? (
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                {t('whatsapp.sent', { date: formatIndianDate(bill.sharedAt.slice(0, 10)) })}
              </Text>
            ) : bill.sharedAt ? (
              <Text variant="bodySmall" style={{ color: theme.colors.tertiary }}>
                {t('whatsapp.changedSinceSent')}
              </Text>
            ) : null}
          </>
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

function reminderHistory(
  timestamp: string | undefined,
  todayIso: string,
  t: ReturnType<typeof useT>['t']
) {
  if (!timestamp) return t('whatsapp.neverReminded');
  const days = daysSince(timestamp, todayIso);
  if (days === 0) return t('whatsapp.remindedToday');
  if (days === 1) return t('whatsapp.remindedYesterday');
  return t('whatsapp.remindedDaysAgo', { count: days });
}
