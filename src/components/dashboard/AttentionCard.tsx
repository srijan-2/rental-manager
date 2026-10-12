import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../../navigation/AppTabs';
import { formatINR } from '../../utils';
import { spacing } from '../../styles/layout';

interface AttentionCardProps {
  pendingToCollect: number;
  overdueCount: number;
  overdueAmount: number;
  awaitingCalculationCount: number;
  awaitingRent: number;
  refundsPendingAmount: number;
  refundsPendingCount: number;
}

export function AttentionCard(props: AttentionCardProps) {
  const theme = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const caughtUp =
    props.pendingToCollect === 0 &&
    props.awaitingCalculationCount === 0 &&
    props.refundsPendingCount === 0;
  return (
    <Pressable onPress={() => navigation.navigate('Payments')} accessibilityRole="button">
      <Surface
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
      >
        <Text variant="titleMedium">Needs attention</Text>
        <Text variant="headlineMedium" style={styles.amount}>
          {formatINR(props.pendingToCollect)}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          To collect now
        </Text>
        {props.overdueCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            Overdue: {props.overdueCount} bills · {formatINR(props.overdueAmount)}
          </Text>
        ) : null}
        {props.awaitingCalculationCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.tertiary }}>
            {props.awaitingCalculationCount} units awaiting meter reading · rent{' '}
            {formatINR(props.awaitingRent)}
          </Text>
        ) : null}
        {props.refundsPendingCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.tertiary }}>
            Refunds to pay: {props.refundsPendingCount} · {formatINR(props.refundsPendingAmount)}
          </Text>
        ) : null}
        {caughtUp ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            All caught up
          </Text>
        ) : null}
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  amount: { fontWeight: '700', marginTop: spacing.xs },
});
