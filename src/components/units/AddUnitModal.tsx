import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { AddUnitFormValues, OccupancyStatus } from '../../types/unit';
import { formatINRInput, parseCurrencyInput, toISODate } from '../../utils';

interface AddUnitModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmitUnit: (values: AddUnitFormValues) => void;
}

const STATUS_OPTIONS: { label: string; value: OccupancyStatus }[] = [
  { label: 'Occupied', value: 'Occupied' },
  { label: 'Vacant', value: 'Vacant' },
];

const INITIAL_FORM_VALUES: AddUnitFormValues = {
  unitNumber: '',
  monthlyRent: '',
  tenantName: '',
  status: 'Occupied',
  securityDeposit: '',
  moveInDate: '',
};

export function AddUnitModal({ visible, onDismiss, onSubmitUnit }: AddUnitModalProps) {
  const theme = useTheme();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUnitFormValues>({
    defaultValues: INITIAL_FORM_VALUES,
  });

  const closeModal = () => {
    reset(INITIAL_FORM_VALUES);
    onDismiss();
  };

  const onSubmit = (values: AddUnitFormValues) => {
    onSubmitUnit(values);
    closeModal();
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsDatePickerVisible(false);
    }
    if (event.type === 'set' && selectedDate) {
      setValue('moveInDate', toISODate(selectedDate), { shouldValidate: true });
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeModal}
        contentContainerStyle={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          Add New Unit / Flat
        </Text>

        <View style={styles.form}>
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
              validate: (value) =>
                Number.isFinite(parseCurrencyInput(value)) && parseCurrencyInput(value) > 0
                  ? true
                  : 'Enter a valid rent amount',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Monthly Rent"
                mode="outlined"
                keyboardType="numeric"
                value={value}
                onChangeText={(text) => onChange(formatINRInput(text))}
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
            name="tenantName"
            rules={{ required: 'Tenant name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Tenant Name"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={Boolean(errors.tenantName)}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.tenantName)}>
            {errors.tenantName?.message}
          </HelperText>

          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={(selectedValue) => onChange(selectedValue as OccupancyStatus)}
                buttons={STATUS_OPTIONS}
              />
            )}
          />

          <Controller
            control={control}
            name="securityDeposit"
            rules={{
              required: 'Security deposit is required',
              validate: (value) =>
                Number.isFinite(parseCurrencyInput(value)) && parseCurrencyInput(value) >= 0
                  ? true
                  : 'Enter a valid security deposit amount',
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Security Deposit"
                mode="outlined"
                keyboardType="numeric"
                value={value}
                onChangeText={(text) => onChange(formatINRInput(text))}
                left={<TextInput.Affix text="₹" />}
                error={Boolean(errors.securityDeposit)}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.securityDeposit)}>
            {errors.securityDeposit?.message}
          </HelperText>

          <Controller
            control={control}
            name="moveInDate"
            rules={{ required: 'Move-in date is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.datePickerField}>
                <TextInput
                  label="Rent Agreement Start Date"
                  mode="outlined"
                  value={value}
                  editable={false}
                  pointerEvents="none"
                  right={<TextInput.Icon icon="calendar" />}
                  error={Boolean(errors.moveInDate)}
                />
                <Button mode="outlined" onPress={() => setIsDatePickerVisible(true)}>
                  Select Date
                </Button>
                {isDatePickerVisible ? (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      onDateChange(event, selectedDate);
                      if (event.type === 'set' && selectedDate) {
                        onChange(toISODate(selectedDate));
                      }
                    }}
                  />
                ) : null}
              </View>
            )}
          />
          <HelperText type="error" visible={Boolean(errors.moveInDate)}>
            {errors.moveInDate?.message}
          </HelperText>
        </View>

        <View style={styles.actions}>
          <Button mode="text" onPress={closeModal}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save Unit
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  form: {
    gap: 2,
  },
  datePickerField: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
