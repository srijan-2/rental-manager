import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import {
  Button,
  HelperText,
  Modal,
  Portal,
  RadioButton,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { PaymentDialog, RecordedPaymentMethod } from '../components/payments/PaymentDialog';
import {
  ReadingFields,
  ReadingFormValues,
  toElectricityEntry,
} from '../components/payments/ReadingFields';
import { SettlementTable } from '../components/settlements/SettlementTable';
import { useReadingEntry } from '../hooks/useReadingEntry';
import { moveOutTenant } from '../store/actions';
import { useBuildingsStore, usePaymentsStore, useTenantsStore, useUnitsStore } from '../store';
import {
  formatINR,
  formatINRInput,
  formatIndianDate,
  formatUnitLabel,
  parseISODate,
  parseCurrencyInput,
  toISODate,
} from '../utils';
import {
  buildSettlementStatement,
  getMoveOutRange,
  getProratedRent,
  getSettlementSummaryText,
} from '../utils/settlements';
import { getReadingContext } from '../utils/readings';
import { spacing } from '../styles/layout';

interface Props {
  visible: boolean;
  tenantId: string | null;
  onDismiss: () => void;
  onCompleted: () => void;
}

type RentMode = 'prorated' | 'full' | 'custom';
type SettlementMethod = RecordedPaymentMethod;

export function MoveOutScreen({ visible, tenantId, onDismiss, onCompleted }: Props) {
  const theme = useTheme();
  const tenants = useTenantsStore((state) => state.tenants);
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);
  const payments = usePaymentsStore((state) => state.payments);
  const { openReading, readingModal } = useReadingEntry();
  const [moveOutDate, setMoveOutDate] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [rentMode, setRentMode] = useState<RentMode>('prorated');
  const [customRent, setCustomRent] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('0');
  const [deductionNote, setDeductionNote] = useState('');
  const [advanceApplied, setAdvanceApplied] = useState('0');
  const [depositApplied, setDepositApplied] = useState('0');
  const [settleNow, setSettleNow] = useState(false);
  const [settlePayment, setSettlePayment] = useState<{
    method: SettlementMethod;
    date: string;
  } | null>(null);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [error, setError] = useState('');
  const tenant = tenantId ? tenants.find((item) => item.id === tenantId) : undefined;
  const unit = tenant ? units.find((item) => item.id === tenant.unitId) : undefined;
  const tenantBills = useMemo(
    () =>
      payments
        .filter((bill) => bill.tenantId === tenantId)
        .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart)),
    [payments, tenantId]
  );
  const latestBill = tenantBills[tenantBills.length - 1];
  const earlierBills = tenantBills.slice(0, -1);
  const range = latestBill ? getMoveOutRange(latestBill) : null;
  const missingReadings = earlierBills.filter((bill) => !bill.electricity);
  const context = useMemo(
    () => (latestBill && tenant ? getReadingContext(latestBill, payments, tenants) : null),
    [latestBill, payments, tenants, tenant]
  );
  const readingsForm = useForm<ReadingFormValues>({
    defaultValues: { previousReading: '', currentReading: '', ratePerUnit: '' },
  });
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = readingsForm;
  const previousReadingValue = watch('previousReading');
  const currentReading = watch('currentReading');
  const ratePerUnit = watch('ratePerUnit');
  const [previousLocked, setPreviousLocked] = useState(true);

  useEffect(() => {
    if (visible && latestBill && context) {
      setMoveOutDate(latestBill.cycleEnd);
      setAdvanceApplied(String(tenant?.electricityAdvance ?? 0));
      setDepositApplied(String(unit?.securityDeposit ?? 0));
      reset({
        previousReading: context.previousReading === null ? '' : String(context.previousReading),
        currentReading: '',
        ratePerUnit: context.initialRate ? String(context.initialRate) : '',
      });
      setPreviousLocked(true);
      setError('');
    }
  }, [context, latestBill, reset, tenant?.electricityAdvance, unit?.securityDeposit, visible]);

  const finalRent = useMemo(() => {
    if (!latestBill || !moveOutDate) return 0;
    if (rentMode === 'full') return latestBill.rentAmount;
    if (rentMode === 'custom') return parseCurrencyInput(customRent);
    return getProratedRent({ ...latestBill, rent: latestBill.rentAmount, moveOutDate });
  }, [customRent, latestBill, moveOutDate, rentMode]);
  const finalElectricity = useMemo(() => {
    const previous = Number(previousReadingValue);
    const current = Number(currentReading);
    const rate = Number(ratePerUnit);
    return Number.isFinite(previous) &&
      Number.isFinite(current) &&
      Number.isFinite(rate) &&
      current >= previous
      ? Math.round((current - previous) * rate * 100) / 100
      : 0;
  }, [currentReading, previousReadingValue, ratePerUnit]);
  const statement = useMemo(
    () =>
      buildSettlementStatement({
        unpaidBillsAmount: earlierBills.reduce(
          (sum, bill) =>
            sum +
            (bill.rentPaidDate ? 0 : bill.rentAmount) +
            (bill.electricity && !bill.electricityPaidDate ? bill.electricity.amount : 0),
          0
        ),
        finalRent,
        finalElectricity,
        deductionAmount: parseCurrencyInput(deductionAmount),
        deductionNote,
        advanceApplied: parseCurrencyInput(advanceApplied),
        depositApplied: parseCurrencyInput(depositApplied),
        finalRentDetail: `${inclusiveDays(latestBill.cycleStart, moveOutDate)} of ${inclusiveDays(latestBill.cycleStart, latestBill.cycleEnd)} days`,
        finalElectricityDetail: `${Math.max(0, Number(currentReading) - Number(previousReadingValue))} units × ${formatINR(Number(ratePerUnit))}`,
      }),
    [
      advanceApplied,
      deductionAmount,
      deductionNote,
      depositApplied,
      earlierBills,
      finalElectricity,
      finalRent,
      currentReading,
      previousReadingValue,
      ratePerUnit,
      moveOutDate,
    ]
  );
  const advanceError = tenant && parseCurrencyInput(advanceApplied) > tenant.electricityAdvance;
  const depositError = unit && parseCurrencyInput(depositApplied) > (unit.securityDeposit ?? 0);
  const blocked = !tenant || !unit || !latestBill || missingReadings.length > 0;

  const dateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event.type === 'set' && date) setMoveOutDate(toISODate(date));
  };

  const complete = (values: ReadingFormValues) => {
    if (!tenant || !unit || !range || advanceError || depositError) return;
    Alert.alert(
      'Complete move-out?',
      'This ends the tenancy, marks bills as settled and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete move-out',
          style: 'destructive',
          onPress: () => {
            try {
              moveOutTenant({
                tenantId: tenant.id,
                moveOutDate,
                finalReading: toElectricityEntry(values),
                rentMode,
                customRent: parseCurrencyInput(customRent),
                deductionAmount: parseCurrencyInput(deductionAmount),
                deductionNote,
                advanceApplied: parseCurrencyInput(advanceApplied),
                depositApplied: parseCurrencyInput(depositApplied),
                settleNow:
                  settleNow && statement.net !== 0 && settlePayment ? settlePayment : undefined,
              });
              onCompleted();
            } catch (value) {
              setError(value instanceof Error ? value.message : 'Unable to complete move-out');
            }
          },
        },
      ]
    );
  };

  if (!tenant || !unit || !latestBill || !range) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text variant="headlineSmall">Move out</Text>
          <Text variant="titleMedium">{tenant.name}</Text>
          <Text>
            {formatUnitLabel(
              unit,
              buildings.find((building) => building.id === unit.buildingId)
            )}
          </Text>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Move-out date
          </Text>
          <Pressable onPress={() => setShowDate(true)}>
            <TextInput
              label="Move-out date"
              mode="outlined"
              value={moveOutDate}
              editable={false}
              pointerEvents="none"
              right={<TextInput.Icon icon="calendar" onPress={() => setShowDate(true)} />}
            />
          </Pressable>
          <Button mode="outlined" onPress={() => setShowDate(true)}>
            Select Date
          </Button>
          {showDate ? (
            <DateTimePicker
              value={parseISODate(moveOutDate || range.max)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={parseISODate(range.min)}
              maximumDate={parseISODate(range.max)}
              onChange={dateChange}
            />
          ) : null}
          <HelperText type="info">
            Allowed: {formatIndianDate(range.min)} to {formatIndianDate(range.max)}
          </HelperText>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Readiness check
          </Text>
          {missingReadings.length ? (
            <Text style={{ color: theme.colors.error }}>
              Enter earlier readings before completing move-out.
            </Text>
          ) : (
            <Text>All earlier cycles have readings.</Text>
          )}
          {missingReadings.map((bill) => (
            <Button key={bill.id} mode="outlined" onPress={() => openReading(bill.id)}>
              Enter reading · {bill.periodLabel}
            </Button>
          ))}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Final meter reading
          </Text>
          <ReadingFields
            control={control}
            errors={errors}
            trigger={trigger}
            previousReadingValue={previousReadingValue}
            previousLocked={previousLocked}
            setPreviousLocked={setPreviousLocked}
            currentReading={currentReading}
            ratePerUnit={ratePerUnit}
            billRent={finalRent}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Final rent
          </Text>
          <RadioButton.Group
            value={rentMode}
            onValueChange={(value) => setRentMode(value as RentMode)}
          >
            <RadioButton.Item
              label={`Prorated · ${inclusiveDays(latestBill.cycleStart, moveOutDate)} of ${inclusiveDays(latestBill.cycleStart, latestBill.cycleEnd)} days = ${formatINR(getProratedRent({ rent: latestBill.rentAmount, cycleStart: latestBill.cycleStart, cycleEnd: latestBill.cycleEnd, moveOutDate }))}`}
              value="prorated"
            />
            <RadioButton.Item
              label={`Full month · ${formatINR(latestBill.rentAmount)}`}
              value="full"
            />
            <RadioButton.Item label="Custom amount" value="custom" />
          </RadioButton.Group>
          {rentMode === 'custom' ? (
            <TextInput
              label="Custom rent"
              mode="outlined"
              keyboardType="numeric"
              value={customRent}
              onChangeText={(value) => setCustomRent(formatINRInput(value))}
              left={<TextInput.Affix text="₹" />}
            />
          ) : null}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Deductions
          </Text>
          <TextInput
            label="Deduction amount"
            mode="outlined"
            keyboardType="numeric"
            value={deductionAmount}
            onChangeText={(value) => setDeductionAmount(formatINRInput(value))}
            left={<TextInput.Affix text="₹" />}
          />
          <TextInput
            label="Deduction note"
            mode="outlined"
            value={deductionNote}
            onChangeText={setDeductionNote}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Credits
          </Text>
          <Text>
            Electricity advance held {formatINR(tenant.electricityAdvance)}
            {tenant.electricityAdvance === 0 ? ' · None held' : ''}
          </Text>
          <TextInput
            label="Apply electricity advance"
            mode="outlined"
            keyboardType="numeric"
            value={advanceApplied}
            onChangeText={(value) => setAdvanceApplied(formatINRInput(value))}
            error={Boolean(advanceError)}
            left={<TextInput.Affix text="₹" />}
          />
          {advanceError ? (
            <HelperText type="error">Cannot apply more than the advance held.</HelperText>
          ) : null}
          <Text>
            Security deposit held {formatINR(unit.securityDeposit ?? 0)}
            {!unit.securityDeposit ? ' · None held' : ''}
          </Text>
          <TextInput
            label="Apply security deposit"
            mode="outlined"
            keyboardType="numeric"
            value={depositApplied}
            onChangeText={(value) => setDepositApplied(formatINRInput(value))}
            error={Boolean(depositError)}
            left={<TextInput.Affix text="₹" />}
          />
          {depositError ? (
            <HelperText type="error">Cannot apply more than the deposit held.</HelperText>
          ) : null}

          <SettlementTable statement={statement} />
          {statement.net !== 0 ? (
            <View style={styles.settleRow}>
              <Text>Settle now</Text>
              <Switch
                value={settleNow}
                onValueChange={(value) => {
                  setSettleNow(value);
                  if (value) setPaymentDialogVisible(true);
                }}
              />
            </View>
          ) : null}
          {settleNow && statement.net !== 0 ? (
            <Button mode="outlined" onPress={() => setPaymentDialogVisible(true)}>
              {settlePayment
                ? `${settlePayment.method} · ${formatIndianDate(settlePayment.date)}`
                : 'Choose payment method and date'}
            </Button>
          ) : null}
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
          <Button
            mode="contained"
            disabled={
              blocked ||
              Boolean(advanceError) ||
              Boolean(depositError) ||
              (settleNow && !settlePayment)
            }
            onPress={handleSubmit(complete)}
          >
            Complete move-out
          </Button>
        </ScrollView>
        {readingModal}
        <PaymentDialog
          visible={paymentDialogVisible}
          title="Settle now"
          amountLabel={getSettlementSummaryText(statement.net)}
          defaultMethod={settlePayment?.method ?? 'Cash'}
          defaultDate={settlePayment?.date ?? toISODate(new Date())}
          onDismiss={() => setPaymentDialogVisible(false)}
          onConfirm={(payment) => {
            setSettlePayment(payment);
            setPaymentDialogVisible(false);
          }}
        />
      </Modal>
    </Portal>
  );
}

function inclusiveDays(start: string, end: string) {
  return Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86400000) + 1;
}

const styles = StyleSheet.create({
  modal: { flex: 1, margin: 0 },
  content: { gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { marginTop: spacing.md },
  settleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
});
