import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Modal as RNModal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useBuildingsStore, useUnitsStore } from '../../store';
import { radius, spacing } from '../../styles/layout';
import { Tenant, TenantFormValues } from '../../types/tenant';
import {
  formatINRInput,
  formatUnitLabel,
  parseCurrencyInput,
  parseISODate,
  toISODate,
} from '../../utils';
interface Props {
  visible: boolean;
  selectedTenant: Tenant | null;
  onDismiss: () => void;
  onSubmitTenant: (values: TenantFormValues) => void;
}
const DEFAULT: TenantFormValues = {
  name: '',
  phone: '',
  unitId: '',
  monthlyRent: '',
  moveInDate: '',
  electricityAdvance: '',
  openingMeterReading: '',
  billingStartDate: '',
};
export function TenantFormModal({ visible, selectedTenant, onDismiss, onSubmitTenant }: Props) {
  const theme = useTheme();
  const units = useUnitsStore((s) => s.units);
  const buildings = useBuildingsStore((s) => s.buildings);
  const [unitOpen, setUnitOpen] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showBillingDate, setShowBillingDate] = useState(false);
  const [billingDateTouched, setBillingDateTouched] = useState(false);
  const [error, setError] = useState('');
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormValues>({ defaultValues: DEFAULT });
  const available = useMemo(
    () => units.filter((u) => !u.archivedAt && (!u.tenantId || u.id === selectedTenant?.unitId)),
    [units, selectedTenant]
  );
  const selectedUnitId = watch('unitId');
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  useEffect(() => {
    if (visible) {
      setBillingDateTouched(false);
      reset(
        selectedTenant
          ? {
              name: selectedTenant.name,
              phone: selectedTenant.phone,
              unitId: selectedTenant.unitId,
              monthlyRent: selectedTenant.monthlyRent.toLocaleString('en-IN'),
              moveInDate: selectedTenant.moveInDate,
              electricityAdvance: selectedTenant.electricityAdvance.toLocaleString('en-IN'),
              openingMeterReading: String(selectedTenant.openingMeterReading),
              billingStartDate: selectedTenant.billingStartDate,
            }
          : DEFAULT
      );
    }
  }, [visible, selectedTenant, reset]);
  useEffect(() => {
    if (visible && !selectedTenant && selectedUnitId) {
      setValue(
        'openingMeterReading',
        selectedUnit?.lastMeterReading === undefined ? '' : String(selectedUnit.lastMeterReading)
      );
    }
  }, [selectedUnit?.lastMeterReading, selectedTenant, selectedUnitId, setValue, visible]);
  const submit = (v: TenantFormValues) => {
    try {
      onSubmitTenant(v);
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save tenant');
    }
  };
  const dateChange = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (e.type === 'set' && date) {
      const isoDate = toISODate(date);
      setValue('moveInDate', isoDate, { shouldValidate: true });
      if (!selectedTenant && !billingDateTouched) {
        setValue('billingStartDate', isoDate, { shouldValidate: true });
      }
    }
  };
  const billingDateChange = (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowBillingDate(false);
    if (e.type === 'set' && date && !selectedTenant) {
      setBillingDateTouched(true);
      setValue('billingStartDate', toISODate(date), { shouldValidate: true });
    }
  };
  const noUnits = available.length === 0;
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {selectedTenant ? 'Edit Tenant' : 'Add Tenant'}
        </Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Full Name"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.name)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.name)}>
          {errors.name?.message}
        </HelperText>
        <Controller
          control={control}
          name="phone"
          rules={{ required: 'Phone is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Phone"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.phone)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.phone)}>
          {errors.phone?.message}
        </HelperText>
        <Controller
          control={control}
          name="unitId"
          rules={{ required: 'Unit is required' }}
          render={() => (
            <>
              <Pressable
                disabled={noUnits || Boolean(selectedTenant)}
                style={styles.selector}
                onPress={() => setUnitOpen(true)}
              >
                <Text>
                  {selectedUnit
                    ? formatUnitLabel(
                        selectedUnit,
                        buildings.find((b) => b.id === selectedUnit.buildingId)
                      )
                    : 'Select Unit'}
                </Text>
                <Text>⌄</Text>
              </Pressable>
              <HelperText type="error" visible={Boolean(errors.unitId)}>
                {errors.unitId?.message}
              </HelperText>
            </>
          )}
        />
        {noUnits ? <Text style={styles.empty}>No vacant units. Add a unit first.</Text> : null}
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
          name="moveInDate"
          rules={{ required: 'Move-in date is required' }}
          render={({ field: { value } }) => (
            <View style={styles.dateField}>
              <Pressable onPress={() => setShowDate(true)}>
                <TextInput
                  label="Move-in Date"
                  mode="outlined"
                  value={value}
                  editable={false}
                  pointerEvents="none"
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />}
                  error={Boolean(errors.moveInDate)}
                />
              </Pressable>
              <Button mode="outlined" onPress={() => setShowDate(true)}>
                Select Date
              </Button>
              {showDate ? (
                <DateTimePicker
                  value={value ? parseISODate(value) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={dateChange}
                />
              ) : null}
            </View>
          )}
        />
        <HelperText type="error" visible={Boolean(errors.moveInDate)}>
          {errors.moveInDate?.message}
        </HelperText>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Electricity at move-in
        </Text>
        <Controller
          control={control}
          name="electricityAdvance"
          rules={{
            required: 'Electricity advance is required',
            validate: (value) =>
              (value.trim() !== '' && parseCurrencyInput(value) >= 0) ||
              'Enter a valid non-negative amount',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Electricity advance"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              editable={!selectedTenant}
              onChangeText={(nextValue) => onChange(formatINRInput(nextValue))}
              left={<TextInput.Affix text="₹" />}
              error={Boolean(errors.electricityAdvance)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.electricityAdvance)}>
          {errors.electricityAdvance?.message}
        </HelperText>
        <Controller
          control={control}
          name="openingMeterReading"
          rules={{
            required: 'Opening meter reading is required',
            validate: (value) =>
              (value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) ||
              'Enter a valid non-negative number',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Opening meter reading"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              editable={!selectedTenant}
              onChangeText={onChange}
              error={Boolean(errors.openingMeterReading)}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.openingMeterReading)}>
          {errors.openingMeterReading?.message}
        </HelperText>
        <Controller
          control={control}
          name="billingStartDate"
          rules={{ required: 'Billing start date is required' }}
          render={({ field: { value } }) => (
            <View style={styles.dateField}>
              <Pressable
                disabled={Boolean(selectedTenant)}
                onPress={() => setShowBillingDate(true)}
              >
                <TextInput
                  label="Billing Start Date"
                  mode="outlined"
                  value={value}
                  editable={false}
                  pointerEvents="none"
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      disabled={Boolean(selectedTenant)}
                      onPress={() => setShowBillingDate(true)}
                    />
                  }
                  error={Boolean(errors.billingStartDate)}
                />
              </Pressable>
              <Button
                mode="outlined"
                disabled={Boolean(selectedTenant)}
                onPress={() => setShowBillingDate(true)}
              >
                Select Date
              </Button>
              {showBillingDate ? (
                <DateTimePicker
                  value={value ? parseISODate(value) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={billingDateChange}
                />
              ) : null}
            </View>
          )}
        />
        <HelperText type="error" visible={Boolean(errors.billingStartDate)}>
          {errors.billingStartDate?.message}
        </HelperText>
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        <View style={styles.actions}>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" disabled={noUnits} onPress={handleSubmit(submit)}>
            {selectedTenant ? 'Update' : 'Add'}
          </Button>
        </View>
        <RNModal
          visible={unitOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setUnitOpen(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setUnitOpen(false)}>
            <View
              style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
              onStartShouldSetResponder={() => true}
            >
              <Text variant="titleMedium">Select Unit</Text>
              {available.map((u) => (
                <Pressable
                  key={u.id}
                  style={styles.option}
                  onPress={() => {
                    setValue('unitId', u.id, { shouldValidate: true });
                    setValue('monthlyRent', u.monthlyRent.toLocaleString('en-IN'), {
                      shouldValidate: true,
                    });
                    setUnitOpen(false);
                  }}
                >
                  <Text>
                    {formatUnitLabel(
                      u,
                      buildings.find((b) => b.id === u.buildingId)
                    )}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </RNModal>
      </Modal>
    </Portal>
  );
}
const styles = StyleSheet.create({
  modal: { borderRadius: radius.md, margin: spacing.md, padding: spacing.md, gap: 2 },
  title: { fontWeight: '700', marginBottom: spacing.sm },
  sectionTitle: { fontWeight: '700', marginTop: spacing.sm },
  dateField: { gap: spacing.xs },
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: { color: '#c62828' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.5)' },
  sheet: { padding: 20, gap: 12, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  option: { paddingVertical: 14 },
});
