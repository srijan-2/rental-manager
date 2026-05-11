import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { Tenant, TenantFormValues } from '../../types/tenant';
import { formatINRInput, toISODate } from '../../utils';

interface TenantFormModalProps {
  visible: boolean;
  selectedTenant: Tenant | null;
  onDismiss: () => void;
  onSubmitTenant: (values: TenantFormValues) => void;
}

const DEFAULT_VALUES: TenantFormValues = {
  name: '',
  phone: '',
  assignedUnit: '',
  monthlyRent: '',
  moveInDate: '',
};

export function TenantFormModal({ visible, selectedTenant, onDismiss, onSubmitTenant }: TenantFormModalProps) {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditMode = Boolean(selectedTenant);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<TenantFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!visible) return;
    if (!selectedTenant) {
      reset(DEFAULT_VALUES);
      return;
    }
    reset({
      name: selectedTenant.name,
      phone: selectedTenant.phone,
      assignedUnit: selectedTenant.assignedUnit,
      monthlyRent: selectedTenant.monthlyRent.toLocaleString('en-IN'),
      moveInDate: selectedTenant.moveInDate,
    });
  }, [visible, selectedTenant, reset]);

  const closeModal = () => {
    setShowDatePicker(false);
    onDismiss();
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setValue('moveInDate', toISODate(selectedDate), { shouldValidate: true });
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={closeModal}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {isEditMode ? 'Edit Tenant' : 'Add Tenant'}
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput label="Full Name" mode="outlined" value={value} onChangeText={onChange} error={Boolean(errors.name)} />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.name)}>{errors.name?.message}</HelperText>

        <Controller
          control={control}
          name="phone"
          rules={{ required: 'Phone is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput label="Phone" mode="outlined" keyboardType="phone-pad" value={value} onChangeText={onChange} error={Boolean(errors.phone)} />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.phone)}>{errors.phone?.message}</HelperText>

        <Controller
          control={control}
          name="assignedUnit"
          rules={{ required: 'Assigned unit is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput label="Assigned Unit" mode="outlined" value={value} onChangeText={onChange} error={Boolean(errors.assignedUnit)} />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.assignedUnit)}>{errors.assignedUnit?.message}</HelperText>

        <Controller
          control={control}
          name="monthlyRent"
          rules={{ required: 'Monthly rent is required' }}
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
        <HelperText type="error" visible={Boolean(errors.monthlyRent)}>{errors.monthlyRent?.message}</HelperText>

        <Controller
          control={control}
          name="moveInDate"
          rules={{ required: 'Move-in date is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.dateField}>
              <TextInput label="Move-in Date" mode="outlined" value={value} editable={false} right={<TextInput.Icon icon="calendar" />} error={Boolean(errors.moveInDate)} />
              <Button mode="outlined" onPress={() => setShowDatePicker(true)}>Select Date</Button>
              {showDatePicker ? (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, selectedDate) => {
                    onDateChange(event, selectedDate);
                    if (event.type === 'set' && selectedDate) onChange(toISODate(selectedDate));
                  }}
                />
              ) : null}
            </View>
          )}
        />
        <HelperText type="error" visible={Boolean(errors.moveInDate)}>{errors.moveInDate?.message}</HelperText>

        <View style={styles.actions}>
          <Button mode="text" onPress={closeModal}>Cancel</Button>
          <Button mode="contained" onPress={handleSubmit((values) => { onSubmitTenant(values); closeModal(); })}>
            {isEditMode ? 'Update' : 'Add'}
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
    margin: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  dateField: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
