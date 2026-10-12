import { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button, Chip, Surface, Text, useTheme } from 'react-native-paper';
import { ActionRow } from '../components/dashboard/ActionRow';
import { AttentionCard } from '../components/dashboard/AttentionCard';
import { BuildingRow } from '../components/dashboard/BuildingRow';
import { SectionHeader } from '../components/dashboard/SectionHeader';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { useReadingEntry } from '../hooks/useReadingEntry';
import { useToday } from '../hooks/useToday';
import { RootTabParamList } from '../navigation/AppTabs';
import {
  useBuildingsStore,
  usePaymentsStore,
  useSettlementsStore,
  useTenantsStore,
  useUnitsStore,
} from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { getDashboardStats } from '../utils/dashboard';
import { formatINR, formatUnitLabel } from '../utils';
import { getBillAmounts, getBillStatus } from '../utils/payments';
import { parseISODate } from '../utils/date';
import { getReadingContext } from '../utils/readings';
import { getStatusColors } from '../theme/statusColors';

export function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { width } = useWindowDimensions();
  const today = useToday();
  const buildings = useBuildingsStore((state) => state.buildings);
  const units = useUnitsStore((state) => state.units);
  const tenants = useTenantsStore((state) => state.tenants);
  const payments = usePaymentsStore((state) => state.payments);
  const settlements = useSettlementsStore((state) => state.settlements);
  const { openReading, readingModal } = useReadingEntry();
  const stats = useMemo(
    () => getDashboardStats({ buildings, units, tenants, payments, settlements }, today),
    [buildings, payments, settlements, tenants, today, units]
  );
  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const buildingById = useMemo(
    () => new Map(buildings.map((building) => [building.id, building])),
    [buildings]
  );
  const cardWidth = width < 420 ? width - spacing.md * 2 : (width - spacing.md * 3) / 2;
  const hasUnits = stats.totals.totalUnits > 0;
  const hasTenants = tenants.length > 0;
  const hasAttention =
    stats.readingsDue.length > 0 ||
    stats.billsToCollect.length > 0 ||
    stats.endingSoon.length > 0 ||
    stats.summary.refundsPendingCount > 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[sharedStyles.screen, styles.content]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.heading}>
          Dashboard
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Today · {formatDashboardDate(today)}
        </Text>
      </View>

      {!buildings.length ? (
        <EmptyCard
          message="Welcome. Start by adding a building and a unit."
          buttonLabel="Go to Units"
          onPress={() => navigation.navigate('Units')}
        />
      ) : !hasUnits || !hasTenants ? (
        <EmptyCard
          message={
            hasUnits ? 'Add your first tenant' : 'Welcome. Start by adding a building and a unit.'
          }
          buttonLabel={hasUnits ? 'Go to Tenants' : 'Go to Units'}
          onPress={() => navigation.navigate(hasUnits ? 'Tenants' : 'Units')}
        />
      ) : null}

      {hasUnits ? (
        <>
          <AttentionCard {...stats.summary} />

          <View style={styles.grid}>
            <SummaryCard
              title="Occupancy"
              value={`${stats.totals.occupiedUnits} of ${stats.totals.totalUnits} units`}
              subtitle={`${stats.totals.occupancyPercent}% occupied`}
              icon="home-account"
              accentColor={theme.colors.primary}
              width={cardWidth}
            />
            <SummaryCard
              title="Vacant units"
              value={String(stats.totals.vacantUnits)}
              subtitle={`${stats.totals.totalUnits} total units`}
              icon="home-search"
              accentColor={theme.colors.tertiary}
              width={cardWidth}
            />
            <SummaryCard
              title="Collected this month"
              value={formatINR(stats.summary.collectedThisMonth)}
              subtitle="Paid rent and electricity"
              icon="cash-check"
              accentColor={theme.colors.secondary}
              width={cardWidth}
            />
            <SummaryCard
              title="Expected monthly rent"
              value={formatINR(stats.totals.monthlyRentRoll)}
              subtitle={`${stats.totals.occupiedUnits} occupied units`}
              icon="chart-line"
              accentColor={theme.colors.primary}
              width={cardWidth}
            />
          </View>

          {stats.readingsDue.length ? (
            <AttentionSection
              title="Readings due"
              count={stats.readingsDue.length}
              route="ElectricityBalance"
            >
              {stats.readingsDue.slice(0, 5).map((bill) => {
                const unit = unitById.get(bill.unitId);
                const building = unit ? buildingById.get(unit.buildingId) : undefined;
                const previousReading = getReadingContext(bill, payments, tenants).previousReading;
                return (
                  <ActionRow
                    key={bill.id}
                    title={unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
                    subtitle={`${bill.tenantName} · ${bill.periodLabel}`}
                    onPress={previousReading === null ? undefined : () => openReading(bill.id)}
                    action={
                      <Button
                        compact
                        mode="contained-tonal"
                        disabled={previousReading === null}
                        onPress={() => openReading(bill.id)}
                      >
                        Enter reading
                      </Button>
                    }
                  />
                );
              })}
            </AttentionSection>
          ) : null}

          {stats.billsToCollect.length ? (
            <AttentionSection
              title="Bills to collect"
              count={stats.billsToCollect.length}
              route="Payments"
            >
              {stats.billsToCollect.slice(0, 5).map((bill) => {
                const unit = unitById.get(bill.unitId);
                const building = unit ? buildingById.get(unit.buildingId) : undefined;
                const status = getBillStatus(bill, today);
                const colors = getStatusColors(status);
                return (
                  <ActionRow
                    key={bill.id}
                    title={unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
                    subtitle={bill.tenantName}
                    onPress={() => navigation.navigate('Payments')}
                    trailing={
                      <View style={styles.billTrailing}>
                        <Text variant="bodyLarge">
                          {formatINR(getBillAmounts(bill).outstanding)}
                        </Text>
                        <Chip
                          compact
                          style={{ backgroundColor: colors.background }}
                          textStyle={{ color: colors.text }}
                        >
                          {status}
                        </Chip>
                      </View>
                    }
                  />
                );
              })}
            </AttentionSection>
          ) : null}

          {stats.endingSoon.length ? (
            <AttentionSection
              title="Cycles ending soon (7 days)"
              count={stats.endingSoon.length}
              route="ElectricityBalance"
            >
              {stats.endingSoon.slice(0, 5).map(({ bill, daysLeft }) => {
                const unit = unitById.get(bill.unitId);
                const building = unit ? buildingById.get(unit.buildingId) : undefined;
                return (
                  <ActionRow
                    key={bill.id}
                    title={unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
                    subtitle={`${bill.tenantName} · ${daysLeft ? `Reading opens in ${daysLeft} days` : 'Reading opens today'}`}
                    onPress={() => navigation.navigate('ElectricityBalance')}
                  />
                );
              })}
            </AttentionSection>
          ) : null}

          {!hasAttention ? (
            <Text
              variant="bodyLarge"
              style={[styles.emptyAttention, { color: theme.colors.onSurfaceVariant }]}
            >
              Nothing needs your attention today
            </Text>
          ) : null}
        </>
      ) : null}

      {stats.byBuilding.length ? (
        <View>
          <Text variant="titleMedium" style={styles.buildingTitle}>
            By building
          </Text>
          <Surface
            style={[
              styles.buildingCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
            ]}
            elevation={2}
          >
            {stats.byBuilding.map((building) => (
              <BuildingRow key={building.building.id} building={building} />
            ))}
          </Surface>
        </View>
      ) : null}
      {readingModal}
    </ScrollView>
  );
}

function AttentionSection({
  title,
  count,
  route,
  children,
}: {
  title: string;
  count: number;
  route: keyof RootTabParamList;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View>
      <SectionHeader title={title} count={count} route={route} />
      <Surface
        style={[
          styles.sectionCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={1}
      >
        {children}
      </Surface>
    </View>
  );
}

function EmptyCard({
  message,
  buttonLabel,
  onPress,
}: {
  message: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Surface
      style={[
        styles.emptyCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      elevation={1}
    >
      <Text variant="bodyLarge">{message}</Text>
      <Button mode="contained-tonal" onPress={onPress}>
        {buttonLabel}
      </Button>
    </Surface>
  );
}

function formatDashboardDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(parseISODate(isoDate));
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { gap: spacing.xs, marginBottom: spacing.lg, marginTop: spacing.xs },
  heading: { fontWeight: '700' },
  emptyCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  billTrailing: { alignItems: 'flex-end', gap: spacing.xxs },
  emptyAttention: { marginTop: spacing.lg, textAlign: 'center' },
  buildingTitle: { marginBottom: spacing.xs, marginTop: spacing.xl },
  buildingCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
});
