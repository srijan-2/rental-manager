import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { BuildingPicker } from '../common/BuildingPicker';
import { radius, spacing } from '../../styles/layout';
import { AddUnitFormValues, RentalUnit } from '../../types/unit';
import { formatINRInput, parseCurrencyInput } from '../../utils';

interface Props {
  visible: boolean;
  unit?: RentalUnit | null;
  onDismiss: () => void;
  onSubmitUnit: (values: AddUnitFormValues) => void;
}

const INITIAL: AddUnitFormValues = {
  buildingId: '',
  unitNumber: '',
  monthlyRent: '',
  securityDeposit: '',
  subMeterId: '',
};

function valuesForUnit(unit?: RentalUnit | null): AddUnitFormValues {
  if (!unit) return INITIAL;
  return {
    buildingId: unit.buildingId,
    unitNumber: unit.unitNumber,
    monthlyRent: formatINRInput(String(unit.monthlyRent)),
    securityDeposit:
      unit.securityDeposit === undefined ? '' : formatINRInput(String(unit.securityDeposit)),
    subMeterId: unit.subMeterId ?? '',
  };
}

export function UnitFormModal({ visible, unit, onDismiss, onSubmitUnit }: Props) {
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUnitFormValues>({
    defaultValues: INITIAL,
  });
  const [submitError, setSubmitError] = useState('');
  const editing = Boolean(unit);

  useEffect(() => {
    if (visible) reset(valuesForUnit(unit));
  }, [reset, unit, visible]);

  const close = () => {
    reset(INITIAL);
    setSubmitError('');
    onDismiss();
  };
  const submit = (values: AddUnitFormValues) => {
    try {
      onSubmitUnit(values);
      close();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save unit');
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={close}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {editing ? 'Edit Unit' : 'Add New Unit / Flat'}
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
        {editing ? (
          <HelperText type="info">
            Default rent for new tenants. An existing tenant's rent is not changed.
          </HelperText>
        ) : null}
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
        <HelperText type="error" visible={Boolean(submitError)}>
          {submitError}
        </HelperText>
        <View style={styles.actions}>
          <Button onPress={close}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit(submit)}>
            {editing ? 'Save changes' : 'Save Unit'}
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
