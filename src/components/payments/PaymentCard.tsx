import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { Payment } from '../../types/payment';
import { formatINR, formatIndianDate } from '../../utils';

interface PaymentCardProps {
  payment: Payment;
  tenantName: string;
  onMarkAsPaid: (paymentId: string) => void;
}

export const PaymentCard = memo(({ payment, tenantName, onMarkAsPaid }: PaymentCardProps) => {
  const theme = useTheme();
  const isPaid = payment.status === 'Paid';

  const badgeColors =
    payment.status === 'Paid'
      ? { background: '#14532d66', text: '#86EFAC' }
      : payment.status === 'Overdue'
        ? { background: '#7f1d1d66', text: '#FCA5A5' }
        : { background: '#78350f66', text: '#FCD34D' };

  return (
    <Surface
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      elevation={2}
    >
      <View style={styles.row}>
        <View style={styles.details}>
          <Text variant="titleMedium" style={styles.name}>
            {tenantName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {payment.unitNumber}
          </Text>
        </View>
        <Chip
          compact
          style={[styles.badge, { backgroundColor: badgeColors.background }]}
          textStyle={{ color: badgeColors.text, fontWeight: '700' }}
        >
          {payment.status}
        </Chip>
      </View>

      <View style={styles.metaRow}>
        <View>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Rent Amount
          </Text>
          <Text variant="titleMedium">{formatINR(payment.amount)}</Text>
        </View>
        <View>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Due Date
          </Text>
          <Text variant="titleMedium">{formatIndianDate(payment.dueDate)}</Text>
        </View>
      </View>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {isPaid ? `Paid on ${formatIndianDate(payment.paidDate ?? '-')}` : 'Awaiting rent payment'}
      </Text>

      {!isPaid ? (
        <Button mode="contained-tonal" icon="check-circle-outline" onPress={() => onMarkAsPaid(payment.id)}>
          Mark as Paid
        </Button>
      ) : null}
    </Surface>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  details: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
  },
  badge: {
    borderRadius: radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
