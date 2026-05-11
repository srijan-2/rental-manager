import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, Menu, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useElectricityBillsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { ElectricityRecordFormValues, ElectricityUsageRecord } from '../types/electricityBill';
import { RentalUnit } from '../types/unit';
import {
  calculateMonthlyElectricityCharge,
  calculateRemainingPrepaidBalance,
  calculateUnitsConsumed,
  formatINR,
} from '../utils';

type BalanceSeverity = 'healthy' | 'warning' | 'critical';

function toNumber(value: string) {
  return Number(value.replace(/[^\d.]/g, '')) || 0;
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function getMonthOptions(totalMonths = 12) {
  const now = new Date();

  return Array.from({ length: totalMonths }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return formatMonthLabel(date);
  });
}

function createDefaultFormValues(): ElectricityRecordFormValues {
  return {
    unitId: '',
    monthLabel: getMonthOptions(1)[0],
    previousMeterReading: '',
    currentMeterReading: '',
    ratePerUnit: '',
  };
}

function getBalanceSeverity(balance: number): BalanceSeverity {
  if (balance < 200) {
    return 'critical';
  }
  if (balance < 500) {
    return 'warning';
  }
  return 'healthy';
}

export function ElectricityBillsScreen() {
  const theme = useTheme();
  const units = useUnitsStore((state) => state.units);
  const updateUnit = useUnitsStore((state) => state.updateUnit);
  const records = useElectricityBillsStore((state) => state.records);
  const addRecord = useElectricityBillsStore((state) => state.addRecord);
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const monthOptions = useMemo(() => getMonthOptions(), []);

  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ElectricityRecordFormValues>({
    defaultValues: createDefaultFormValues(),
  });

  const selectedUnitId = watch('unitId');
  const previousReadingValue = watch('previousMeterReading');
  const currentReadingValue = watch('currentMeterReading');
  const ratePerUnitValue = watch('ratePerUnit');
  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId),
    [selectedUnitId, units]
  );
  const previousReading = toNumber(previousReadingValue);
  const currentReading = toNumber(currentReadingValue);
  const ratePerUnit = toNumber(ratePerUnitValue);
  const unitsConsumed = calculateUnitsConsumed(previousReading, currentReading);
  const monthlyCharge = calculateMonthlyElectricityCharge(unitsConsumed, ratePerUnit);
  const remainingPrepaidBalance = calculateRemainingPrepaidBalance(
    selectedUnit?.prepaidElectricityBalance ?? 0,
    monthlyCharge
  );
  const hasBalancePreview = Boolean(
    selectedUnit && previousReadingValue && currentReadingValue && ratePerUnitValue
  );
  const balanceSeverity = getBalanceSeverity(remainingPrepaidBalance);
  const balanceStatusColor =
    balanceSeverity === 'critical'
      ? '#F87171'
      : balanceSeverity === 'warning'
        ? '#FBBF24'
        : '#86EFAC';
  const secondaryTextColor = '#CBD5E1';
  const mutedTextColor = '#94A3B8';

  const totalPrepaidBalance = useMemo(
    () => units.reduce((sum, unit) => sum + (unit.prepaidElectricityBalance ?? 0), 0),
    [units]
  );

  const onSubmit = (values: ElectricityRecordFormValues) => {
    const selected: RentalUnit | undefined = units.find((unit) => unit.id === values.unitId);
    if (!selected) {
      return;
    }
    const previous = toNumber(values.previousMeterReading);
    const current = toNumber(values.currentMeterReading);
    const rate = toNumber(values.ratePerUnit);
    const consumed = calculateUnitsConsumed(previous, current);
    const monthlyElectricityCharge = calculateMonthlyElectricityCharge(consumed, rate);
    const remainingBalance = calculateRemainingPrepaidBalance(
      selected.prepaidElectricityBalance ?? 0,
      monthlyElectricityCharge
    );

    addRecord({
      id: `eb-${Date.now()}`,
      unitId: selected.id,
      unitNumber: selected.unitNumber,
      monthLabel: values.monthLabel.trim(),
      previousMeterReading: previous,
      currentMeterReading: current,
      unitsConsumed: consumed,
      ratePerUnit: rate,
      monthlyElectricityCharge,
      remainingPrepaidBalance: remainingBalance,
      lowBalanceWarning: remainingBalance < 500,
      createdAt: new Date().toISOString().split('T')[0],
    });
    updateUnit(selected.id, { prepaidElectricityBalance: remainingBalance });
    reset(createDefaultFormValues());
  };

  const renderHistoryCard = ({ item }: { item: ElectricityUsageRecord }) => {
    const recordSeverity = getBalanceSeverity(item.remainingPrepaidBalance);
    const recordBalanceColor =
      recordSeverity === 'critical'
        ? '#F87171'
        : recordSeverity === 'warning'
          ? '#FBBF24'
          : mutedTextColor;

    return (
      <Surface
        style={[
          styles.billCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={1}
      >
        <Text variant="headlineSmall" style={styles.historyAmount}>
          {formatINR(item.monthlyElectricityCharge, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.historyTitleRow}>
          <Text variant="titleMedium" style={styles.month}>
            {item.monthLabel}
          </Text>
          <Text variant="titleMedium" style={styles.unitName}>
            {item.unitNumber}
          </Text>
        </View>
        <Text variant="bodySmall" style={[styles.metadata, { color: mutedTextColor }]}>
          Previous {item.previousMeterReading} | Current {item.currentMeterReading} | Units {item.unitsConsumed}
        </Text>
        <Text variant="bodySmall" style={[styles.metadata, { color: mutedTextColor }]}>
          Rate {formatINR(item.ratePerUnit)}/unit
        </Text>
        <Text variant="bodySmall" style={[styles.balanceText, { color: recordBalanceColor }]}>
          Balance {formatINR(item.remainingPrepaidBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {recordSeverity === 'critical' ? ' | Critical' : recordSeverity === 'warning' ? ' | Low' : ''}
        </Text>
      </Surface>
    );
  };

  const renderListHeader = () => (
    <>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Prepaid Electricity Balance</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: secondaryTextColor }]}>
          Track sub-meter usage and deduct monthly electricity charges from prepaid balance.
        </Text>
      </View>

      <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]} elevation={2}>
        <Controller
          control={control}
          name="unitId"
          rules={{ required: 'Please select a unit' }}
          render={({ field: { value } }) => (
            <Menu
              visible={unitMenuVisible}
              onDismiss={() => setUnitMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setUnitMenuVisible(true)}
                  contentStyle={styles.selectButton}
                  labelStyle={styles.selectLabel}
                >
                  {value ? units.find((item) => item.id === value)?.unitNumber : 'Select Unit'}
                </Button>
              }
            >
              {units.map((unit) => (
                <Menu.Item
                  key={unit.id}
                  title={`${unit.unitNumber} (${formatINR(unit.prepaidElectricityBalance ?? 0)} balance)`}
                  onPress={() => {
                    setValue('unitId', unit.id, { shouldValidate: true });
                    setUnitMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          )}
        />
        {errors.unitId ? (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.unitId.message}
          </Text>
        ) : null}

        <Text variant="labelMedium" style={[styles.fieldLabel, { color: secondaryTextColor }]}>
          Billing Month
        </Text>
        <Controller
          control={control}
          name="monthLabel"
          rules={{ required: 'Month is required' }}
          render={({ field: { value } }) => (
            <Menu
              visible={monthMenuVisible}
              onDismiss={() => setMonthMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMonthMenuVisible(true)}
                  contentStyle={styles.selectButton}
                  labelStyle={styles.selectLabel}
                >
                  {value}
                </Button>
              }
            >
              {monthOptions.map((month) => (
                <Menu.Item
                  key={month}
                  title={month}
                  onPress={() => {
                    setValue('monthLabel', month, { shouldValidate: true });
                    setMonthMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
          )}
        />
        <Controller
          control={control}
          name="previousMeterReading"
          rules={{ required: 'Previous reading is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              dense
              label="Previous Meter Reading"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.previousMeterReading)}
              style={styles.input}
              contentStyle={styles.inputContent}
            />
          )}
        />
        <Controller
          control={control}
          name="currentMeterReading"
          rules={{ required: 'Current reading is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              dense
              label="Current Meter Reading"
              mode="outlined"
              keyboardType="numeric"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.currentMeterReading)}
              style={styles.input}
              contentStyle={styles.inputContent}
            />
          )}
        />
        <Controller
          control={control}
          name="ratePerUnit"
          rules={{ required: 'Rate per unit is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              dense
              label="Rate Per Unit"
              mode="outlined"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              error={Boolean(errors.ratePerUnit)}
              left={<TextInput.Affix text="₹" />}
              style={styles.input}
              contentStyle={styles.inputContent}
            />
          )}
        />

        <Surface style={[styles.summary, { backgroundColor: theme.colors.elevation.level2 }]}>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={{ color: secondaryTextColor }}>Units Consumed</Text>
            <Text variant="titleMedium" style={styles.summaryValue}>{unitsConsumed}</Text>
          </View>
          <Text variant="bodyMedium" style={{ color: secondaryTextColor }}>Monthly Electricity Charge</Text>
          <Text variant="headlineSmall" style={styles.billAmount}>
            {formatINR(monthlyCharge, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text variant="bodyMedium" style={{ color: secondaryTextColor }}>
            Remaining Prepaid Balance: {formatINR(remainingPrepaidBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {hasBalancePreview ? (
            <Text variant="bodySmall" style={[styles.warningText, { color: balanceStatusColor }]}>
              {balanceSeverity === 'critical'
                ? 'Critical balance: Top up before the next billing cycle.'
                : balanceSeverity === 'warning'
                  ? 'Low balance: Balance is below ₹500.'
                  : 'Balance status: Healthy'}
            </Text>
          ) : null}
        </Surface>

        <Button mode="contained" onPress={handleSubmit(onSubmit)} contentStyle={styles.saveButton}>
          Save Monthly Usage
        </Button>
      </Surface>

      <View style={styles.historyHeader}>
        <Text variant="titleMedium" style={styles.historyTitle}>Monthly Electricity History</Text>
        <Text variant="bodySmall" style={{ color: secondaryTextColor }}>
          Total Prepaid Balance: {formatINR(totalPrepaidBalance)}
        </Text>
      </View>
    </>
  );

  return (
    <View style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderHistoryCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 21,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  selectButton: {
    height: 44,
    justifyContent: 'flex-start',
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabel: {
    fontWeight: '700',
    marginBottom: -spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    height: 46,
  },
  inputContent: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
  },
  summary: {
    borderRadius: 12,
    gap: spacing.xxs,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  billAmount: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  warningText: {
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  saveButton: {
    minHeight: 44,
  },
  historyHeader: {
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  historyTitle: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  billCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  historyAmount: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  historyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  month: {
    fontWeight: '700',
  },
  unitName: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  metadata: {
    lineHeight: 18,
  },
  balanceText: {
    fontWeight: '700',
  },
});
