import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, SectionList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Chip, Searchbar, SegmentedButtons, Surface, Text, useTheme } from 'react-native-paper';
import { PaymentCard } from '../components/payments/PaymentCard';
import { PaymentMethodDialog } from '../components/payments/PaymentMethodDialog';
import { useReadingEntry } from '../hooks/useReadingEntry';
import { ensureBillSchedule } from '../store/paymentSchedule';
import { useBuildingsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { Payment, PaymentMethod } from '../types/payment';
import { getBillAmounts, getBillStatus, getPaymentsSummary } from '../utils/payments';
import { formatINR, formatUnitLabel } from '../utils';
import { useToday } from '../hooks/useToday';
import { canEditReading } from '../utils/readings';

interface PaymentSection {
  title: string;
  data: Payment[];
  totalCollected?: number;
}

type CollectionAction = 'rent' | 'electricity' | 'all';

export function PaymentsScreen() {
  const theme = useTheme();
  const payments = usePaymentsStore((state) => state.payments);
  const markRentPaid = usePaymentsStore((state) => state.markRentPaid);
  const markRentUnpaid = usePaymentsStore((state) => state.markRentUnpaid);
  const markElectricityPaid = usePaymentsStore((state) => state.markElectricityPaid);
  const markElectricityUnpaid = usePaymentsStore((state) => state.markElectricityUnpaid);
  const markAllPaid = usePaymentsStore((state) => state.markAllPaid);
  const deletePayment = usePaymentsStore((state) => state.deletePayment);
  const tenants = useTenantsStore((state) => state.tenants);
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [collection, setCollection] = useState<{ id: string; action: CollectionAction } | null>(
    null
  );
  const today = useToday();
  const { openReading, readingModal } = useReadingEntry();

  useFocusEffect(
    useCallback(() => {
      ensureBillSchedule();
    }, [])
  );

  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const buildingById = useMemo(
    () => new Map(buildings.map((building) => [building.id, building])),
    [buildings]
  );

  const summary = useMemo(() => getPaymentsSummary(payments, today), [payments, today]);

  const upcomingSections = useMemo<PaymentSection[]>(() => {
    const sections = new Map<string, Payment[]>();
    ['Overdue', 'Due', 'Calculation pending', 'In progress'].forEach((title) =>
      sections.set(title, [])
    );
    payments
      .filter((bill) => getBillStatus(bill, today) !== 'Paid')
      .forEach((bill) => sections.get(getBillStatus(bill, today))?.push(bill));
    return Array.from(sections.entries())
      .filter(([, data]) => data.length > 0)
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      }));
  }, [payments, today]);

  const historySections = useMemo<PaymentSection[]>(() => {
    const query = search.trim().toLowerCase();
    const grouped = new Map<string, Payment[]>();
    payments
      .filter((bill) => getBillStatus(bill, today) === 'Paid')
      .filter((bill) => {
        const unit = unitById.get(bill.unitId);
        const building = unit ? buildingById.get(unit.buildingId) : undefined;
        const matchesBuilding = !buildingFilter || building?.id === buildingFilter;
        const searchable = [
          bill.tenantName,
          unit ? formatUnitLabel(unit, building) : '',
          building?.name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return matchesBuilding && searchable.includes(query);
      })
      .forEach((bill) => {
        const bills = grouped.get(bill.unitId) ?? [];
        bills.push(bill);
        grouped.set(bill.unitId, bills);
      });

    return Array.from(grouped.entries())
      .map(([unitId, data]) => {
        const unit = unitById.get(unitId);
        const building = unit ? buildingById.get(unit.buildingId) : undefined;
        const sortedData = data.sort((a, b) => b.cycleStart.localeCompare(a.cycleStart));
        return {
          title: `${unit ? formatUnitLabel(unit, building) : 'Unknown unit'} · ${sortedData[0].tenantName}`,
          data: sortedData,
          totalCollected: sortedData.reduce(
            (sum, bill) => sum + getBillAmounts(bill).totalBilled,
            0
          ),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [buildingById, buildingFilter, payments, search, today, unitById]);

  const collectionBill = collection
    ? payments.find((bill) => bill.id === collection.id)
    : undefined;

  const openCollection = (id: string, action: CollectionAction) => setCollection({ id, action });
  const confirmCollection = (method: PaymentMethod) => {
    if (collection) {
      if (collection.action === 'rent') markRentPaid(collection.id, method);
      if (collection.action === 'electricity') markElectricityPaid(collection.id, method);
      if (collection.action === 'all') markAllPaid(collection.id, method);
    }
    setCollection(null);
  };
  const confirmUnpaid = (id: string, kind: 'rent' | 'electricity') => {
    Alert.alert('Mark payment unpaid?', 'This will remove its paid date and method.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark unpaid',
        style: 'destructive',
        onPress: () => (kind === 'rent' ? markRentUnpaid(id) : markElectricityUnpaid(id)),
      },
    ]);
  };
  const confirmDelete = (id: string) => {
    Alert.alert('Delete bill?', 'This bill has no paid rent or electricity reading.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePayment(id) },
    ]);
  };

  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Payments
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Rent and electricity bills by billing cycle.
        </Text>
      </View>
      <Surface
        style={[
          styles.summaryCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
      >
        <SummaryItem label="Pending to collect" value={formatINR(summary.pendingToCollect)} />
        <SummaryItem
          label="Awaiting calculation"
          value={String(summary.awaitingCalculationCount)}
        />
        <SummaryItem label="Collected this month" value={formatINR(summary.collectedThisMonth)} />
      </Surface>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'history', label: 'History' },
        ]}
        style={styles.tabs}
      />
      {tab === 'history' ? (
        <>
          <Searchbar
            placeholder="Search unit, building, or tenant"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          <FlatList
            horizontal
            data={buildings}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            ListHeaderComponent={
              <Chip compact selected={!buildingFilter} onPress={() => setBuildingFilter('')}>
                All
              </Chip>
            }
            renderItem={({ item }) => (
              <Chip
                compact
                selected={buildingFilter === item.id}
                onPress={() => setBuildingFilter(buildingFilter === item.id ? '' : item.id)}
              >
                {item.name}
              </Chip>
            )}
          />
        </>
      ) : null}
      <SectionList<Payment, PaymentSection>
        sections={tab === 'upcoming' ? upcomingSections : historySections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {section.title} ({section.data.length})
            </Text>
            {section.totalCollected !== undefined ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Total collected {formatINR(section.totalCollected)}
              </Text>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <PaymentCard
            bill={item}
            unit={unitById.get(item.unitId)}
            building={
              unitById.get(item.unitId)
                ? buildingById.get(unitById.get(item.unitId)?.buildingId ?? '')
                : undefined
            }
            todayIso={today}
            canEditReading={canEditReading(item, payments, today)}
            onCollectRent={(id) => openCollection(id, 'rent')}
            onCollectElectricity={(id) => openCollection(id, 'electricity')}
            onCollectAll={(id) => openCollection(id, 'all')}
            onEnterReading={openReading}
            onMarkRentUnpaid={(id) => confirmUnpaid(id, 'rent')}
            onMarkElectricityUnpaid={(id) => confirmUnpaid(id, 'electricity')}
            onDeleteBill={confirmDelete}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            {tab === 'upcoming'
              ? 'No bills yet. They appear once a tenant is added.'
              : 'No payment history yet.'}
          </Text>
        }
      />
      {readingModal}
      <PaymentMethodDialog
        visible={Boolean(collectionBill)}
        onDismiss={() => setCollection(null)}
        onConfirm={confirmCollection}
      />
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text variant="labelSmall">{label}</Text>
      <Text variant="titleMedium">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: spacing.xs, marginBottom: spacing.sm, marginTop: spacing.xs },
  title: { fontWeight: '700' },
  summaryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  summaryItem: { flex: 1, gap: spacing.xxs },
  tabs: { marginBottom: spacing.sm },
  search: { marginBottom: spacing.xs },
  chips: { gap: spacing.xs, paddingBottom: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  sectionHeader: { gap: spacing.xxs, marginBottom: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { fontWeight: '700' },
  emptyText: { padding: spacing.lg, textAlign: 'center' },
});
