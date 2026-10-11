import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { ElectricityEntry } from '../../store/paymentsStore';
import { Payment } from '../../types/payment';
import { formatINR, roundMoney, todayISO } from '../../utils';

interface FormValues {
  previousReading: string;
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
  const theme = useTheme();
  const [previousLocked, setPreviousLocked] = useState(true);
  const { control, handleSubmit, reset, trigger, watch, formState } = useForm<FormValues>({
    defaultValues: { previousReading: '', currentReading: '', ratePerUnit: '' },
  });
  const previousReadingValue = watch('previousReading');
  const currentReading = watch('currentReading');
  const ratePerUnit = watch('ratePerUnit');
  const existing = bill.electricity;
  const blocked = previousReading === null;
  const previousValue = Number(previousReadingValue);
  const currentValue = Number(currentReading);
  const rateValue = Number(ratePerUnit);
  const unitsConsumed = roundMoney(currentValue - previousValue);
  const electricityAmount = roundMoney(unitsConsumed * rateValue);
  const hasValidPreview =
    previousReadingValue.trim() !== '' &&
    currentReading.trim() !== '' &&
    ratePerUnit.trim() !== '' &&
    Number.isFinite(previousValue) &&
    Number.isFinite(currentValue) &&
    Number.isFinite(rateValue) &&
    previousValue >= 0 &&
    currentValue >= 0 &&
    currentValue >= previousValue &&
    rateValue > 0 &&
    Object.keys(formState.errors).length === 0;

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

  const submit = (values: FormValues) => {
    const current = Number(values.currentReading);
    const rate = Number(values.ratePerUnit);
    onSave({
      previousReading: Number(values.previousReading),
      currentReading: current,
      unitsConsumed: roundMoney(current - Number(values.previousReading)),
      ratePerUnit: rate,
      amount: roundMoney((current - Number(values.previousReading)) * rate),
      recordedAt: todayISO(),
    });
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
            <Text style={styles.warning}>
              Enter the reading for {previousPeriodLabel ?? 'the previous period'} first.
            </Text>
          ) : (
            <>
              <Controller
                control={control}
                name="previousReading"
                rules={{
                  required: 'Previous reading is required',
                  validate: (value) =>
                    (value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) ||
                    'Enter a valid non-negative number',
                }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <View style={styles.previousRow}>
                      <TextInput
                        label="Previous reading"
                        mode="outlined"
                        value={value}
                        editable={!previousLocked}
                        onChangeText={(nextValue) => {
                          onChange(nextValue);
                          void trigger('previousReading');
                          void trigger('currentReading');
                        }}
                        error={Boolean(formState.errors.previousReading)}
                        right={
                          <TextInput.Icon
                            icon={previousLocked ? 'lock-outline' : 'lock-open-variant-outline'}
                            onPress={() => setPreviousLocked((locked) => !locked)}
                          />
                        }
                      />
                    </View>
                    <HelperText type="error" visible={Boolean(formState.errors.previousReading)}>
                      {formState.errors.previousReading?.message}
                    </HelperText>
                  </>
                )}
              />
              {!previousLocked ? (
                <Text variant="bodySmall" style={[styles.warning, { color: theme.colors.error }]}>
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
                  <Text>Units: {unitsConsumed}</Text>
                  <Text>Electricity: {formatINR(electricityAmount)}</Text>
                  <Text variant="titleMedium">
                    Total: {formatINR(roundMoney(bill.rentAmount + electricityAmount))}
                  </Text>
                </View>
              ) : null}
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
  previousRow: { marginBottom: 8 },
  warning: { marginBottom: 10 },
  preview: { gap: 4, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
});
