import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Surface, Text, useTheme } from 'react-native-paper';
import { Building } from '../../types/building';
import { Settlement } from '../../types/settlement';
import { RentalUnit } from '../../types/unit';
import { formatINR, formatIndianDate, formatUnitLabel } from '../../utils';
import {
  formatSettlementAmount,
  getSettlementStatus,
  getSettlementSummaryText,
} from '../../utils/settlements';
import { radius, spacing } from '../../styles/layout';

interface Props {
  settlement: Settlement;
  unit?: RentalUnit;
  building?: Building;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
}

export function SettlementCard({ settlement, unit, building, onMarkPaid, onMarkUnpaid }: Props) {
  const theme = useTheme();
  const [statementVisible, setStatementVisible] = useState(false);
  const status = getSettlementStatus(settlement);
  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={styles.header}>
        <View style={styles.details}>
          <Text variant="titleMedium">
            {unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
          </Text>
          <Text>{settlement.tenantName}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Move-out {formatIndianDate(settlement.moveOutDate)}
          </Text>
        </View>
        <Chip compact>{status}</Chip>
      </View>
      <Text variant="titleMedium">{getSettlementSummaryText(settlement.netAmount)}</Text>
      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => setStatementVisible(true)}>
          Statement
        </Button>
        {status === 'Balance due' || status === 'Refund pending' ? (
          <Button mode="contained" onPress={() => onMarkPaid(settlement.id)}>
            {status === 'Balance due' ? 'Mark received' : 'Mark refunded'}
          </Button>
        ) : (
          <Button
            mode="text"
            onPress={() =>
              Alert.alert('Mark settlement unpaid?', 'This will reopen the settlement balance.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Mark unpaid',
                  style: 'destructive',
                  onPress: () => onMarkUnpaid(settlement.id),
                },
              ])
            }
          >
            Mark unpaid
          </Button>
        )}
      </View>
      <Portal>
        <Dialog
          visible={statementVisible}
          onDismiss={() => setStatementVisible(false)}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <Dialog.Title>Settlement statement</Dialog.Title>
          <Dialog.Content>
            <Text>
              Earlier unpaid bills: {formatSettlementAmount(settlement.unpaidBillsAmount)}
            </Text>
            <Text>Final rent: {formatSettlementAmount(settlement.finalRent)}</Text>
            <Text>Final electricity: {formatSettlementAmount(settlement.finalElectricity)}</Text>
            {settlement.deductionAmount ? (
              <Text>
                {settlement.deductionNote || 'Other deductions'}:{' '}
                {formatSettlementAmount(settlement.deductionAmount)}
              </Text>
            ) : null}
            <Text>
              Electricity advance applied: {formatSettlementAmount(settlement.advanceApplied)}
            </Text>
            <Text>
              Security deposit applied: {formatSettlementAmount(settlement.depositApplied)}
            </Text>
            <Text variant="titleMedium">{getSettlementSummaryText(settlement.netAmount)}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatementVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, gap: spacing.sm, marginBottom: spacing.md, padding: spacing.md },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  details: { flex: 1, gap: spacing.xxs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
