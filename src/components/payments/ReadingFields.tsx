import { Dispatch, SetStateAction } from 'react';
import { Control, Controller, FieldErrors, UseFormTrigger } from 'react-hook-form';
import { HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { ElectricityEntry } from '../../store/paymentsStore';
import { formatINR, roundMoney, todayISO } from '../../utils';
import { spacing } from '../../styles/layout';
import { StyleSheet, View } from 'react-native';

export interface ReadingFormValues {
  previousReading: string;
  currentReading: string;
  ratePerUnit: string;
}

interface Props {
  control: Control<ReadingFormValues>;
  errors: FieldErrors<ReadingFormValues>;
  trigger: UseFormTrigger<ReadingFormValues>;
  previousReadingValue: string;
  previousLocked: boolean;
  setPreviousLocked: Dispatch<SetStateAction<boolean>>;
  currentReading: string;
  ratePerUnit: string;
  billRent?: number;
}

export function ReadingFields({
  control,
  errors,
  trigger,
  previousReadingValue,
  previousLocked,
  setPreviousLocked,
  currentReading,
  ratePerUnit,
  billRent,
}: Props) {
  const theme = useTheme();
  const previousValue = Number(previousReadingValue);
  return (
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
              error={Boolean(errors.previousReading)}
              right={
                <TextInput.Icon
                  icon={previousLocked ? 'lock-outline' : 'lock-open-variant-outline'}
                  onPress={() => setPreviousLocked((locked) => !locked)}
                />
              }
            />
            <HelperText type="error" visible={Boolean(errors.previousReading)}>
              {errors.previousReading?.message}
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
              error={Boolean(errors.currentReading)}
            />
            <HelperText type="error" visible={Boolean(errors.currentReading)}>
              {errors.currentReading?.message}
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
              error={Boolean(errors.ratePerUnit)}
              left={<TextInput.Affix text="₹" />}
            />
            <HelperText type="error" visible={Boolean(errors.ratePerUnit)}>
              {errors.ratePerUnit?.message}
            </HelperText>
          </>
        )}
      />
      {billRent !== undefined ? (
        <ReadingPreview
          billRent={billRent}
          previousValue={previousValue}
          currentReading={currentReading}
          ratePerUnit={ratePerUnit}
        />
      ) : null}
    </>
  );
}

function ReadingPreview({
  billRent,
  previousValue,
  currentReading,
  ratePerUnit,
}: {
  billRent: number;
  previousValue: number;
  currentReading: string;
  ratePerUnit: string;
}) {
  const current = Number(currentReading);
  const rate = Number(ratePerUnit);
  if (!Number.isFinite(current) || !Number.isFinite(rate) || current < previousValue || rate <= 0)
    return null;
  const units = roundMoney(current - previousValue);
  const amount = roundMoney(units * rate);
  return (
    <View style={styles.preview}>
      <Text>Units: {units}</Text>
      <Text>Electricity: {formatINR(amount)}</Text>
      <Text variant="titleMedium">Total: {formatINR(roundMoney(billRent + amount))}</Text>
    </View>
  );
}

export function toElectricityEntry(values: ReadingFormValues): ElectricityEntry {
  const previousReading = Number(values.previousReading);
  const currentReading = Number(values.currentReading);
  const ratePerUnit = Number(values.ratePerUnit);
  return {
    previousReading,
    currentReading,
    unitsConsumed: roundMoney(currentReading - previousReading),
    ratePerUnit,
    amount: roundMoney((currentReading - previousReading) * ratePerUnit),
    recordedAt: todayISO(),
  };
}

const styles = StyleSheet.create({
  warning: { marginBottom: spacing.sm },
  preview: { gap: spacing.xs, marginTop: spacing.sm },
});
