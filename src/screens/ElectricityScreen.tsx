import { useMemo, useState } from 'react';
import { FlatList, SectionList, StyleSheet, View } from 'react-native';
import {
  Chip,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';
import { useReadingEntry } from '../hooks/useReadingEntry';
import { useToday } from '../hooks/useToday';
import { useBuildingsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { Payment } from '../types/payment';
import { formatINR, formatIndianDate, formatUnitLabel } from '../utils';
import { getBillStatus, getPaymentsSummary } from '../utils/payments';
import { canEditReading, getReadingContext } from '../utils/readings';

interface BillSection {
  title: string;
  data: Payment[];
}

export function ElectricityScreen() {
  const theme = useTheme();
  const today = useToday();
  const payments = usePaymentsStore((state) => state.payments);
  const tenants = useTenantsStore((state) => state.tenants);
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);
  const [tab, setTab] = useState('readings');
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const { openReading, readingModal } = useReadingEntry();
  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const buildingById = useMemo(
    () => new Map(buildings.map((building) => [building.id, building])),
    [buildings]
  );

  const summary = useMemo(() => {
    const assignedTenantIds = new Set(
      units.flatMap((unit) => (unit.tenantId ? [unit.tenantId] : []))
    );
    const paymentSummary = getPaymentsSummary(payments, today);
    return {
      readingsDue: paymentSummary.awaitingCalculationCount,
      toCollect: paymentSummary.electricityToCollect,
      advanceHeld: tenants
        .filter((tenant) => assignedTenantIds.has(tenant.id))
        .reduce((sum, tenant) => sum + tenant.electricityAdvance, 0),
    };
  }, [payments, tenants, today, units]);

  const readingsSections = useMemo<BillSection[]>(() => {
    const due = payments
      .filter((bill) => getBillStatus(bill, today) === 'Calculation pending')
      .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart));
    const upcoming = payments
      .filter((bill) => getBillStatus(bill, today) === 'In progress' && !bill.electricity)
      .sort((a, b) => a.cycleEnd.localeCompare(b.cycleEnd));
    return [
      ...(due.length ? [{ title: 'Reading due', data: due }] : []),
      ...(upcoming.length ? [{ title: 'Upcoming', data: upcoming }] : []),
    ];
  }, [payments, today]);

  const historySections = useMemo<BillSection[]>(() => {
    const query = search.trim().toLowerCase();
    const grouped = new Map<string, Payment[]>();
    payments
      .filter((bill) => Boolean(bill.electricity))
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

    return Array.from(grouped.entries()).map(([unitId, data]) => {
      const unit = unitById.get(unitId);
      const building = unit ? buildingById.get(unit.buildingId) : undefined;
      const sortedData = data.sort((a, b) => b.cycleStart.localeCompare(a.cycleStart));
      return {
        title: `${unit ? formatUnitLabel(unit, building) : 'Unknown unit'} · ${sortedData[0].tenantName}`,
        data: sortedData,
      };
    });
  }, [buildingById, buildingFilter, payments, search, unitById]);

  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Electricity
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Meter readings and electricity charges by billing cycle.
        </Text>
      </View>
      <Surface
        style={[
          styles.summaryCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
      >
        <SummaryItem label="Readings due" value={String(summary.readingsDue)} />
        <SummaryItem label="Electricity to collect" value={formatINR(summary.toCollect)} />
        <SummaryItem label="Advance held" value={formatINR(summary.advanceHeld)} />
      </Surface>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'readings', label: 'Readings' },
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
      {tab === 'readings' ? (
        <SectionList<Payment, BillSection>
          sections={readingsSections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const context = getReadingContext(item, payments, tenants);
            const due = getBillStatus(item, today) === 'Calculation pending';
            return (
              <ElectricitySectionCard
                bill={item}
                unit={unitById.get(item.unitId)}
                building={
                  unitById.get(item.unitId)
                    ? buildingById.get(unitById.get(item.unitId)?.buildingId ?? '')
                    : undefined
                }
                previousReading={context.previousReading}
                previousPeriodLabel={context.previousPeriodLabel}
                actionLabel={due ? 'Enter reading' : `Opens ${formatIndianDate(item.cycleEnd)}`}
                disabled={!due || context.previousReading === null}
                onPress={() => openReading(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No readings due.
            </Text>
          }
        />
      ) : (
        <SectionList<Payment, BillSection>
          sections={historySections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <ElectricityHistoryCard
              bill={item}
              canEdit={canEditReading(item, payments, today)}
              onEdit={() => openReading(item.id)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No electricity history yet.
            </Text>
          }
        />
      )}
      {readingModal}
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

interface ElectricitySectionCardProps {
  bill: Payment;
  unit?: ReturnType<typeof useUnitsStore.getState>['units'][number];
  building?: ReturnType<typeof useBuildingsStore.getState>['buildings'][number];
  previousReading: number | null;
  previousPeriodLabel?: string;
  actionLabel: string;
  disabled: boolean;
  onPress: () => void;
}

function ElectricitySectionCard({
  bill,
  unit,
  building,
  previousReading,
  previousPeriodLabel,
  actionLabel,
  disabled,
  onPress,
}: ElectricitySectionCardProps) {
  const theme = useTheme();
  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Text variant="titleMedium" style={styles.unitLabel}>
        {unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
      </Text>
      <Text variant="bodyMedium">{bill.tenantName}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {bill.periodLabel}
      </Text>
      <Text variant="bodyMedium">
        Last reading: {previousReading === null ? '-' : previousReading.toLocaleString('en-IN')}
      </Text>
      {previousReading === null ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          Enter {previousPeriodLabel ?? 'previous period'} reading first
        </Text>
      ) : null}
      <Button mode="contained-tonal" disabled={disabled} onPress={onPress}>
        {actionLabel}
      </Button>
    </Surface>
  );
}

function ElectricityHistoryCard({
  bill,
  canEdit,
  onEdit,
}: {
  bill: Payment;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const electricity = bill.electricity;
  if (!electricity) return null;
  const units = Number.isInteger(electricity.unitsConsumed)
    ? String(electricity.unitsConsumed)
    : electricity.unitsConsumed.toFixed(2);
  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.historyHeader}>
        <View style={styles.details}>
          <Text variant="bodyMedium">{bill.periodLabel}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {electricity.previousReading} → {electricity.currentReading}
          </Text>
          <Text variant="bodyMedium">
            {units} units ×{' '}
            {formatINR(electricity.ratePerUnit, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ={' '}
            {formatINR(electricity.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <Chip compact>{bill.electricityPaidDate ? 'Paid' : 'Unpaid'}</Chip>
      </View>
      {canEdit ? (
        <Button mode="outlined" onPress={onEdit}>
          Edit reading
        </Button>
      ) : null}
    </Surface>
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
  sectionTitle: { marginBottom: spacing.xs, marginTop: spacing.sm },
  card: { borderRadius: 16, gap: spacing.xs, marginBottom: spacing.md, padding: spacing.md },
  unitLabel: { fontWeight: '700' },
  historyHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  details: { flex: 1, gap: spacing.xs },
  emptyText: { padding: spacing.lg, textAlign: 'center' },
});
