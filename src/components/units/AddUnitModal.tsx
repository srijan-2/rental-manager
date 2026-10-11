import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { BuildingPicker } from '../common/BuildingPicker';
import { radius, spacing } from '../../styles/layout';
import { AddUnitFormValues } from '../../types/unit';
import { formatINRInput, parseCurrencyInput } from '../../utils';
interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmitUnit: (values: AddUnitFormValues) => void;
}
const INITIAL: AddUnitFormValues = {
  buildingId: '',
  unitNumber: '',
  monthlyRent: '',
  securityDeposit: '',
  subMeterId: '',
  prepaidElectricityBalance: '0',
};
export function AddUnitModal({ visible, onDismiss, onSubmitUnit }: Props) {
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUnitFormValues>({ defaultValues: INITIAL });
  const [submitError, setSubmitError] = useState('');
  const close = () => {
    reset(INITIAL);
    setSubmitError('');
    onDismiss();
  };
  const submit = (v: AddUnitFormValues) => {
    try {
      onSubmitUnit(v);
      close();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Unable to add unit');
    }
  };
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={close}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={styles.title}>
          Add New Unit / Flat
        </Text>
        <Controller
          control={control}
          name="buildingId"
          rules={{ required: 'Building is required' }}
          render={({ field: { onChange, value } }) => (
            <BuildingPicker value={value} onChange={onChange} error={errors.buildingId?.message} />
          )}
        />
        <Controller
          control={control}
          name="unitNumber"
          rules={{ required: 'Unit number is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Unit Number"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.unitNumber)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.unitNumber)}>
          {errors.unitNumber?.message}
        </HelperText>
        <Controller
          control={control}
          name="monthlyRent"
          rules={{
            required: 'Monthly rent is required',
            validate: (v) => parseCurrencyInput(v) > 0 || 'Enter a valid rent amount',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Monthly Rent"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              onChangeText={(v) => onChange(formatINRInput(v))}
              left={<TextInput.Affix text="₹" />}
              error={Boolean(errors.monthlyRent)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.monthlyRent)}>
          {errors.monthlyRent?.message}
        </HelperText>
        <Controller
          control={control}
          name="securityDeposit"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Security Deposit (optional)"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              onChangeText={(v) => onChange(formatINRInput(v))}
              left={<TextInput.Affix text="₹" />}
            />
          )}
        />
        <Controller
          control={control}
          name="subMeterId"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Sub-meter ID (optional)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="prepaidElectricityBalance"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Opening prepaid electricity balance"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              onChangeText={(v) => onChange(formatINRInput(v))}
              left={<TextInput.Affix text="₹" />}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(submitError)}>
          {submitError}
        </HelperText>
        <View style={styles.actions}>
          <Button onPress={close}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit(submit)}>
            Save Unit
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
const styles = StyleSheet.create({
  modal: { borderRadius: radius.md, margin: spacing.md, padding: spacing.md, gap: 2 },
  title: { fontWeight: '700', marginBottom: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
});
