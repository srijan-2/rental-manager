import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { ElectricityEntry } from '../../store/paymentsStore';
import { Payment } from '../../types/payment';
import { formatINR, todayISO } from '../../utils';
import { ReadingFields, ReadingFormValues, toElectricityEntry } from './ReadingFields';

interface ElectricityReadingModalProps {
  visible: boolean;
  bill: Payment;
  previousReading: number | null;
  previousPeriodLabel?: string;
  initialRate: number;
  canEdit: boolean;
  onDismiss: () => void;
  onSave: (electricity: ElectricityEntry) => void;
}

export function ElectricityReadingModal({
  visible,
  bill,
  previousReading,
  previousPeriodLabel,
  initialRate,
  canEdit,
  onDismiss,
  onSave,
}: ElectricityReadingModalProps) {
  const theme = useTheme();
  const [previousLocked, setPreviousLocked] = useState(true);
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ReadingFormValues>({
    defaultValues: { previousReading: '', currentReading: '', ratePerUnit: '' },
  });
  const previousReadingValue = watch('previousReading');
  const currentReading = watch('currentReading');
  const ratePerUnit = watch('ratePerUnit');
  const existing = bill.electricity;
  const blocked = previousReading === null;

  useEffect(() => {
    if (visible) {
      reset({
        previousReading: String(existing?.previousReading ?? previousReading ?? ''),
        currentReading: existing ? String(existing.currentReading) : '',
        ratePerUnit: existing
          ? String(existing.ratePerUnit)
          : initialRate
            ? String(initialRate)
            : '',
      });
      setPreviousLocked(true);
    }
  }, [existing, initialRate, previousReading, reset, visible]);

  const submit = (values: ReadingFormValues) => {
    onSave({ ...toElectricityEntry(values), recordedAt: todayISO() });
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text variant="titleLarge">Electricity reading</Text>
          <Text
            variant="bodySmall"
            style={[styles.period, { color: theme.colors.onSurfaceVariant }]}
          >
            {bill.periodLabel}
          </Text>
          {blocked ? (
            <Text style={{ color: theme.colors.error }}>
              Enter the reading for {previousPeriodLabel ?? 'the previous period'} first.
            </Text>
          ) : (
            <>
              <ReadingFields
                control={control}
                errors={errors}
                trigger={trigger}
                previousReadingValue={previousReadingValue}
                previousLocked={previousLocked}
                setPreviousLocked={setPreviousLocked}
                currentReading={currentReading}
                ratePerUnit={ratePerUnit}
                billRent={bill.rentAmount}
              />
              <View style={styles.actions}>
                <Button onPress={onDismiss}>Cancel</Button>
                {!canEdit ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    This reading can't be edited after electricity is paid or once the next cycle
                    has a reading.
                  </Text>
                ) : null}
                <Button mode="contained" disabled={!canEdit} onPress={handleSubmit(submit)}>
                  Save reading
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { borderRadius: 16, margin: 16, padding: 16 },
  period: { marginBottom: 12, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
});
