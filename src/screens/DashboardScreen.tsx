import { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SummaryCard, type SummaryCardProps } from '../components/dashboard/SummaryCard';
import { sharedStyles, spacing } from '../styles/layout';

type DashboardMetric = Omit<SummaryCardProps, 'width'>;

const DASHBOARD_METRICS: DashboardMetric[] = [
  {
    title: 'Occupied Units',
    value: '42',
    subtitle: '88% occupied across active rental units',
    icon: 'home-account',
    accentColor: '#34D399',
  },
  {
    title: 'Vacant Units',
    value: '6',
    subtitle: '2 vacant units scheduled for site visits this week',
    icon: 'home-search',
    accentColor: '#FBBF24',
  },
  {
    title: 'Pending Rent',
    value: '₹5,24,000',
    subtitle: '7 tenants with upcoming due dates',
    icon: 'cash-clock',
    accentColor: '#FB7185',
  },
  {
    title: 'Monthly Rent Collection',
    value: '₹31,86,000',
    subtitle: '95% rent collected against this month target',
    icon: 'chart-line',
    accentColor: '#60A5FA',
  },
];

export function DashboardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const cardWidth = useMemo(() => {
    const contentWidth = width - spacing.md * 2;
    if (width < 420) {
      return contentWidth;
    }
    return (contentWidth - spacing.md) / 2;
  }, [width]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[sharedStyles.screen, styles.content]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.heading}>
          Rental Dashboard
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Portfolio health and monthly rent collection in one view.
        </Text>
      </View>

      <View style={styles.grid}>
        {DASHBOARD_METRICS.map((metric) => (
          <SummaryCard key={metric.title} width={cardWidth} {...metric} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  heading: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
