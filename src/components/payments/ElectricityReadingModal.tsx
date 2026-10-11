import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { ElectricityEntry } from '../../store/paymentsStore';
import { Payment } from '../../types/payment';
import { formatINR, todayISO } from '../../utils';

interface FormValues {
  currentReading: string;
  ratePerUnit: string;
}

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
  const [previousLocked, setPreviousLocked] = useState(true);
  const [previousDraft, setPreviousDraft] = useState('');
  const { control, handleSubmit, reset, trigger, watch, formState } = useForm<FormValues>({
    defaultValues: { currentReading: '', ratePerUnit: '' },
  });
  const currentReading = watch('currentReading');
  const ratePerUnit = watch('ratePerUnit');
  const existing = bill.electricity;
  const blocked = previousReading === null;
  const previousValue = Number(previousDraft);
  const currentValue = Number(currentReading);
  const rateValue = Number(ratePerUnit);
  const hasValidPreview =
    currentReading.trim() !== '' &&
    ratePerUnit.trim() !== '' &&
    Number.isFinite(currentValue) &&
    Number.isFinite(rateValue) &&
    currentValue >= previousValue &&
    rateValue > 0;

  useEffect(() => {
    if (visible) {
      reset({
        currentReading: existing ? String(existing.currentReading) : '',
        ratePerUnit: existing
          ? String(existing.ratePerUnit)
          : initialRate
            ? String(initialRate)
            : '',
      });
      setPreviousDraft(String(existing?.previousReading ?? previousReading ?? ''));
      setPreviousLocked(true);
    }
  }, [existing, initialRate, reset, visible]);

  const submit = (values: FormValues) => {
    const current = Number(values.currentReading);
    const rate = Number(values.ratePerUnit);
    onSave({
      previousReading: previousValue,
      currentReading: current,
      unitsConsumed: current - previousValue,
      ratePerUnit: rate,
      amount: (current - previousValue) * rate,
      recordedAt: todayISO(),
    });
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text variant="titleLarge">Electricity reading</Text>
          <Text variant="bodySmall" style={styles.period}>
            {bill.periodLabel}
          </Text>
          {blocked ? (
            <Text style={styles.warning}>
              Enter the reading for {previousPeriodLabel ?? 'the previous period'} first.
            </Text>
          ) : (
            <>
              <View style={styles.previousRow}>
                <TextInput
                  label="Previous reading"
                  mode="outlined"
                  value={previousDraft}
                  editable={!previousLocked}
                  onChangeText={(value) => {
                    setPreviousDraft(value);
                    void trigger('currentReading');
                  }}
                  right={
                    <TextInput.Icon
                      icon={previousLocked ? 'lock-outline' : 'lock-open-variant-outline'}
                      onPress={() => setPreviousLocked((locked) => !locked)}
                    />
                  }
                />
              </View>
              {!previousLocked ? (
                <Text variant="bodySmall" style={styles.warning}>
                  Overriding the previous reading may affect this cycle's calculation.
                </Text>
              ) : null}
              <Controller
                control={control}
                name="currentReading"
                rules={{
                  required: 'Current reading is required',
                  validate: (value) => {
                    const number = Number(value);
                    if (value.trim() === '' || !Number.isFinite(number) || number < 0) {
                      return 'Enter a valid non-negative number';
                    }
                    return number >= previousValue
                      ? true
                      : 'Current reading cannot be less than previous reading';
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      label="Current reading"
                      mode="outlined"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(nextValue) => {
                        onChange(nextValue);
                        void trigger('currentReading');
                      }}
                      error={Boolean(formState.errors.currentReading)}
                    />
                    <HelperText type="error" visible={Boolean(formState.errors.currentReading)}>
                      {formState.errors.currentReading?.message}
                    </HelperText>
                  </>
                )}
              />
              <Controller
                control={control}
                name="ratePerUnit"
                rules={{
                  required: 'Rate per unit is required',
                  validate: (value) =>
                    (value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0) ||
                    'Rate must be greater than 0',
                }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      label="Rate per unit"
                      mode="outlined"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      error={Boolean(formState.errors.ratePerUnit)}
                      left={<TextInput.Affix text="₹" />}
                    />
                    <HelperText type="error" visible={Boolean(formState.errors.ratePerUnit)}>
                      {formState.errors.ratePerUnit?.message}
                    </HelperText>
                  </>
                )}
              />
              {hasValidPreview ? (
                <View style={styles.preview}>
                  <Text>Units: {currentValue - previousValue}</Text>
                  <Text>Electricity: {formatINR((currentValue - previousValue) * rateValue)}</Text>
                  <Text variant="titleMedium">
                    Total: {formatINR(bill.rentAmount + (currentValue - previousValue) * rateValue)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.actions}>
                <Button onPress={onDismiss}>Cancel</Button>
                <Button mode="contained" disabled={!canEdit} onPress={handleSubmit(submit)}>
                  {existing ? 'Save reading' : 'Save reading'}
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
  modal: { backgroundColor: '#1A2333', borderRadius: 16, margin: 16, padding: 16 },
  period: { color: '#94A3B8', marginBottom: 12, marginTop: 4 },
  previousRow: { marginBottom: 8 },
  warning: { color: '#FBBF24', marginBottom: 10 },
  preview: { gap: 4, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
});
