import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, Surface, Text, useTheme } from 'react-native-paper';
import { SettlementTable } from '../settlements/SettlementTable';
import { Building } from '../../types/building';
import { Settlement } from '../../types/settlement';
import { RentalUnit } from '../../types/unit';
import { formatUnitLabel } from '../../utils';
import {
  getSettlementStatus,
  getSettlementSummaryText,
  settlementToStatement,
} from '../../utils/settlements';
import { radius, spacing } from '../../styles/layout';
import { getStatusLabel, useT } from '../../i18n';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useWhatsAppShare } from '../../whatsapp/useWhatsAppShare';
import { useSettlementsStore } from '../../store';
import { buildSettlementInput, buildSettlementPaidInput } from '../../messages/buildInputs';
import { buildSettlementMessage, buildSettlementPaidMessage } from '../../messages/templates';

interface Props {
  settlement: Settlement;
  unit?: RentalUnit;
  building?: Building;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
  onChangePaid: (id: string) => void;
}

export function SettlementCard({
  settlement,
  unit,
  building,
  onMarkPaid,
  onMarkUnpaid,
  onChangePaid,
}: Props) {
  const theme = useTheme();
  const { t } = useT();
  const { formatIndianDate } = useDateFormat();
  const { share } = useWhatsAppShare();
  const markStatementSent = useSettlementsStore((state) => state.markStatementSent);
  const markPaidMessageSent = useSettlementsStore((state) => state.markPaidMessageSent);
  const [statementVisible, setStatementVisible] = useState(false);
  const status = getSettlementStatus(settlement);
  const sendStatement = () => {
    if (!unit || !building || !settlement.tenantPhone) return;
    const input = buildSettlementInput(settlement, unit, building);
    share({
      recipientName: settlement.tenantName,
      phone: settlement.tenantPhone,
      defaultLanguage: settlement.messageLanguage ?? 'hi',
      buildMessage: (language) => buildSettlementMessage(input, language),
      onSent: () => markStatementSent(settlement.id),
    });
  };
  const sendPaidMessage = () => {
    if (!unit || !building) return;
    const input = buildSettlementPaidInput(settlement, unit, building);
    if (!input) return;
    share({
      recipientName: settlement.tenantName,
      phone: settlement.tenantPhone,
      defaultLanguage: settlement.messageLanguage ?? 'hi',
      buildMessage: (language) => buildSettlementPaidMessage(input, language),
      onSent: () => markPaidMessageSent(settlement.id),
    });
  };
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
        <Chip compact>{getStatusLabel(status, t)}</Chip>
      </View>
      <Text variant="titleMedium">{getSettlementSummaryText(settlement.netAmount)}</Text>
      {settlement.statementSentAt ? <Chip compact>{t('whatsapp.statementSent')}</Chip> : null}
      {settlement.paidMessageSentAt ? <Chip compact>{t('whatsapp.confirmationSent')}</Chip> : null}
      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => setStatementVisible(true)}>
          Statement
        </Button>
        {settlement.tenantPhone ? (
          <Button mode="outlined" onPress={sendStatement} disabled={!unit || !building}>
            {t('whatsapp.sendStatement')}
          </Button>
        ) : (
          <Button mode="outlined" disabled>
            {t('whatsapp.noNumberSaved')}
          </Button>
        )}
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
        {status === 'Settled' && settlement.paidDate && settlement.method ? (
          <>
            <Button mode="text" compact onPress={() => onChangePaid(settlement.id)}>
              Change date / method
            </Button>
            {!settlement.paidMessageSentAt ? (
              <Button mode="text" compact onPress={sendPaidMessage}>
                {t('whatsapp.sendConfirmation')}
              </Button>
            ) : null}
          </>
        ) : null}
      </View>
      <Portal>
        <Dialog
          visible={statementVisible}
          onDismiss={() => setStatementVisible(false)}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <Dialog.Title>Settlement statement</Dialog.Title>
          <Dialog.Content>
            <SettlementTable statement={settlementToStatement(settlement)} />
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
