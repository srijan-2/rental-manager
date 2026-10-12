import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { PaymentMethod } from '../../types/payment';
import { formatIndianDate, parseISODate, todayISO, toISODate } from '../../utils';

export type RecordedPaymentMethod = Exclude<PaymentMethod, 'Settlement'>;

interface PaymentDialogProps {
  visible: boolean;
  title: string;
  amountLabel: string;
  defaultMethod: RecordedPaymentMethod;
  defaultDate: string;
  onConfirm: (payment: { method: RecordedPaymentMethod; date: string }) => void;
  onDismiss: () => void;
}

export function PaymentDialog({
  visible,
  title,
  amountLabel,
  defaultMethod,
  defaultDate,
  onConfirm,
  onDismiss,
}: PaymentDialogProps) {
  const theme = useTheme();
  const [method, setMethod] = useState<RecordedPaymentMethod>(defaultMethod);
  const [date, setDate] = useState(defaultDate || todayISO());
  const [showDate, setShowDate] = useState(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (visible) {
      setMethod(defaultMethod);
      setDate(defaultDate || todayISO());
      setDateError('');
      setShowDate(false);
    }
  }, [defaultDate, defaultMethod, visible]);

  const selectDate = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event.type !== 'set' || !pickedDate) return;
    const nextDate = toISODate(pickedDate);
    if (nextDate > todayISO()) {
      setDateError('Payment date cannot be in the future.');
      return;
    }
    setDate(nextDate);
    setDateError('');
  };
  const confirm = () => {
    if (date > todayISO()) {
      setDateError('Payment date cannot be in the future.');
      return;
    }
    onConfirm({ method, date });
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="headlineSmall" style={styles.amount}>
            {amountLabel}
          </Text>
          <SegmentedButtons
            value={method}
            onValueChange={(value) => setMethod(value as RecordedPaymentMethod)}
            buttons={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Card', label: 'Card' },
            ]}
          />
          <Text variant="titleMedium" style={styles.label}>
            Payment date
          </Text>
          <View style={styles.dateRow}>
            <Pressable style={styles.dateInput} onPress={() => setShowDate(true)}>
              <TextInput
                label="Payment date"
                mode="outlined"
                value={formatIndianDate(date)}
                editable={false}
                pointerEvents="none"
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />}
                error={Boolean(dateError)}
              />
            </Pressable>
            <Button
              compact
              onPress={() => {
                setDate(todayISO());
                setDateError('');
              }}
            >
              Today
            </Button>
          </View>
          <Button mode="outlined" onPress={() => setShowDate(true)}>
            Select Date
          </Button>
          {showDate ? (
            <DateTimePicker
              value={parseISODate(date || todayISO())}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={selectDate}
            />
          ) : null}
          <HelperText type="error" visible={Boolean(dateError)}>
            {dateError}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={confirm}>Confirm</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  amount: { fontWeight: '700', marginBottom: 16 },
  label: { marginTop: 16 },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1 },
});
