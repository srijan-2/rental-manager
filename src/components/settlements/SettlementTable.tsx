import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme, type MD3Theme } from 'react-native-paper';
import {
  formatSettlementAmount,
  getSettlementSummaryText,
  SettlementStatement,
} from '../../utils/settlements';
import { spacing } from '../../styles/layout';

interface Props {
  statement: SettlementStatement;
}

export function SettlementTable({ statement }: Props) {
  const theme = useTheme();
  return (
    <Surface
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      elevation={1}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>Item</Text>
        <Text style={styles.headerAmount}>Amount (₹)</Text>
      </View>
      <SectionRow label="Charges (money to collect)" />
      {statement.charges.map((item, index) => (
        <AmountRow
          key={`charge-${item.label}`}
          label={item.label}
          detail={item.detail}
          amount={item.amount}
          alternate={index % 2 === 1}
          theme={theme}
        />
      ))}
      <TotalRow label="Total charges" amount={statement.totalCharges} />
      <SectionRow label="Already held" />
      {statement.credits.map((item, index) => (
        <AmountRow
          key={`credit-${item.label}`}
          label={item.label}
          detail={item.detail}
          amount={-item.amount}
          alternate={index % 2 === 1}
          theme={theme}
        />
      ))}
      <TotalRow label="Total held" amount={-statement.totalCredits} />
      <View style={[styles.result, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text
          variant="headlineSmall"
          style={{
            color:
              statement.net > 0
                ? theme.colors.tertiary
                : statement.net < 0
                  ? theme.colors.primary
                  : theme.colors.onSurface,
          }}
        >
          {statement.net < 0
            ? `Refund to tenant ${formatSettlementAmount(Math.abs(statement.net))}`
            : getSettlementSummaryText(statement.net)}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Charges {formatSettlementAmount(statement.totalCharges)} minus held{' '}
          {formatSettlementAmount(statement.totalCredits)}
        </Text>
      </View>
    </Surface>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text variant="labelLarge">{label}</Text>
    </View>
  );
}
function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.totalRow}>
      <Text variant="titleSmall">{label}</Text>
      <Text variant="titleSmall" style={styles.amount}>
        {formatSettlementAmount(Math.abs(amount))}
      </Text>
    </View>
  );
}
function AmountRow({
  label,
  detail,
  amount,
  alternate,
  theme,
}: {
  label: string;
  detail?: string;
  amount: number;
  alternate: boolean;
  theme: MD3Theme;
}) {
  return (
    <View style={[styles.row, alternate ? { backgroundColor: theme.colors.surfaceVariant } : null]}>
      <View style={styles.label}>
        <Text>{label}</Text>
        {detail ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Text style={styles.amount}>
        {amount < 0
          ? `− ${formatSettlementAmount(Math.abs(amount))}`
          : formatSettlementAmount(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.sm },
  headerLabel: { fontWeight: '700' },
  headerAmount: { fontWeight: '700', textAlign: 'right' },
  sectionRow: {
    backgroundColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: { flex: 1, gap: spacing.xxs },
  amount: { fontVariant: ['tabular-nums'], textAlign: 'right' },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    padding: spacing.sm,
  },
  result: { gap: spacing.xs, padding: spacing.md },
});
