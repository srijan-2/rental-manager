import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../../navigation/AppTabs';
import { formatINR } from '../../utils';
import { spacing } from '../../styles/layout';
import { useT } from '../../i18n';

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
  const { t } = useT();
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
        <Text variant="titleMedium">{t('dashboard.needsAttention')}</Text>
        <Text variant="headlineMedium" style={styles.amount}>
          {formatINR(props.pendingToCollect)}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('dashboard.toCollectNow')}
        </Text>
        {props.overdueCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {t('dashboard.overdue', {
              count: props.overdueCount,
              amount: formatINR(props.overdueAmount),
            })}
          </Text>
        ) : null}
        {props.awaitingCalculationCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.tertiary }}>
            {t('dashboard.awaitingReading', {
              count: props.awaitingCalculationCount,
              amount: formatINR(props.awaitingRent),
            })}
          </Text>
        ) : null}
        {props.refundsPendingCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.tertiary }}>
            {t('dashboard.refundsToPay', {
              count: props.refundsPendingCount,
              amount: formatINR(props.refundsPendingAmount),
            })}
          </Text>
        ) : null}
        {caughtUp ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {t('dashboard.allCaughtUp')}
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
