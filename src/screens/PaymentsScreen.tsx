import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { PaymentCard } from '../components/payments/PaymentCard';
import { useBuildingsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { formatINR, todayISO } from '../utils';

export function PaymentsScreen() {
  const theme = useTheme();
  const payments = usePaymentsStore((state) => state.payments);
  const updatePayment = usePaymentsStore((state) => state.updatePayment);
  const tenants = useTenantsStore((state) => state.tenants);
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);

  const tenantDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach((tenant) => {
      map.set(tenant.id, tenant.name);
    });
    return map;
  }, [tenants]);

  const sortedPayments = useMemo(
    () =>
      [...payments].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateB - dateA;
      }),
    [payments]
  );

  const outstandingBalance = useMemo(
    () =>
      payments
        .filter((payment) => payment.status !== 'Paid')
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const paidCount = payments.filter((payment) => payment.status === 'Paid').length;
  const unpaidCount = payments.length - paidCount;

  const markAsPaid = (paymentId: string) => {
    updatePayment(paymentId, {
      status: 'Paid',
      paidDate: todayISO(),
    });
  };

  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Rent Payments
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Monthly rent tracking, status, and rent collection history.
        </Text>
      </View>

      <Surface
        style={[
          styles.summaryCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
      >
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Outstanding Balance
        </Text>
        <Text variant="headlineSmall" style={styles.outstanding}>
          {formatINR(outstandingBalance)}
        </Text>
        <View style={styles.summaryMeta}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Paid: {paidCount}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Unpaid: {unpaidCount}
          </Text>
        </View>
      </Surface>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Payment History
      </Text>

      <FlatList
        data={sortedPayments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            tenantDisplayName={tenantDisplayNameById.get(item.tenantId) ?? 'Unknown Tenant'}
            unit={units.find((unit) => unit.id === item.unitId)}
            building={buildings.find(
              (building) =>
                building.id === units.find((unit) => unit.id === item.unitId)?.buildingId
            )}
            onMarkAsPaid={markAsPaid}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  outstanding: {
    fontWeight: '700',
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
