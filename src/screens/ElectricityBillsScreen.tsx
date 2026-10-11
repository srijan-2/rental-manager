import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBuildingsStore, useElectricityBillsStore, useUnitsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { ElectricityRecordFormValues, ElectricityUsageRecord } from '../types/electricityBill';
import { RentalUnit } from '../types/unit';
import {
  calculateMonthlyElectricityCharge,
  calculateRemainingPrepaidBalance,
  calculateUnitsConsumed,
  formatINR,
  formatUnitLabel,
} from '../utils';

type BalanceSeverity = 'healthy' | 'warning' | 'critical';

// What was auto-filled from the last record for a given unit
interface AutoFilledContext {
  previousMeterReading: number; // the currentMeterReading of the last record
  ratePerUnit: number; // the ratePerUnit of the last record
  sourceMonth: string; // e.g. "April 2026" — for user-facing label
}

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

function getBalanceSeverity(balance: number, hasInput: boolean): BalanceSeverity | null {
  if (!hasInput) return null;
  if (balance < 200) return 'critical';
  if (balance < 500) return 'warning';
  return 'healthy';
}

/**
 * Returns the most recent ElectricityUsageRecord for a given unitId.
 * Records are stored newest-first (addRecord prepends), so index 0 is latest.
 */
function getLastRecordForUnit(
  records: ElectricityUsageRecord[],
  unitId: string
): ElectricityUsageRecord | null {
  return records.find((r) => r.unitId === unitId) ?? null;
}

// ── Inline Dropdown Sheet ──────────────────────────────────────────────────
interface DropdownSheetProps {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onDismiss: () => void;
}

function DropdownSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onDismiss,
}: DropdownSheetProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={onDismiss} />
      <View style={sheet.container}>
        <View style={sheet.handle} />
        <Text style={sheet.title}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={sheet.scroll}>
          {options.map((opt) => {
            const isActive = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[sheet.option, isActive && sheet.optionActive]}
                onPress={() => {
                  onSelect(opt.value);
                  onDismiss();
                }}
                activeOpacity={0.7}
              >
                <Text style={[sheet.optionLabel, isActive && sheet.optionLabelActive]}>
                  {opt.label}
                </Text>
                {isActive ? <Text style={sheet.check}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </RNModal>
  );
}

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    backgroundColor: '#1A2333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '60%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scroll: {
    maxHeight: 360,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  optionActive: {
    backgroundColor: 'rgba(126,155,255,0.12)',
  },
  optionLabel: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#7E9BFF',
    fontWeight: '700',
  },
  check: {
    color: '#7E9BFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────
export function ElectricityBillsScreen() {
  const theme = useTheme();
  const units = useUnitsStore((state) => state.units);
  const buildings = useBuildingsStore((state) => state.buildings);
  const updateUnit = useUnitsStore((state) => state.updateUnit);
  const records = useElectricityBillsStore((state) => state.records);
  const addRecord = useElectricityBillsStore((state) => state.addRecord);

  const [unitSheetVisible, setUnitSheetVisible] = useState(false);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);

  // Auto-fill state
  const [autoFilledCtx, setAutoFilledCtx] = useState<AutoFilledContext | null>(null);
  const [prevReadingLocked, setPrevReadingLocked] = useState(false);
  const [rateCarriedOver, setRateCarriedOver] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ElectricityRecordFormValues>({
    defaultValues: createDefaultFormValues(),
  });

  const selectedUnitId = watch('unitId');
  const previousReadingValue = watch('previousMeterReading');
  const currentReadingValue = watch('currentMeterReading');
  const ratePerUnitValue = watch('ratePerUnit');

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId),
    [selectedUnitId, units]
  );

  // ── Auto-fill when unit changes ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedUnitId) {
      setAutoFilledCtx(null);
      setPrevReadingLocked(false);
      setRateCarriedOver(false);
      return;
    }

    const lastRecord = getLastRecordForUnit(records, selectedUnitId);

    if (lastRecord) {
      const ctx: AutoFilledContext = {
        previousMeterReading: lastRecord.currentMeterReading,
        ratePerUnit: lastRecord.ratePerUnit,
        sourceMonth: lastRecord.monthLabel,
      };
      setAutoFilledCtx(ctx);

      // Auto-fill previous reading and lock it
      setValue('previousMeterReading', String(lastRecord.currentMeterReading), {
        shouldValidate: false,
      });
      setPrevReadingLocked(true);

      // Carry forward rate (less critical, but still a time saver)
      setValue('ratePerUnit', String(lastRecord.ratePerUnit), { shouldValidate: false });
      setRateCarriedOver(true);
    } else {
      // First-time entry for this unit — no history, clear any leftover
      setAutoFilledCtx(null);
      setValue('previousMeterReading', '', { shouldValidate: false });
      setValue('ratePerUnit', '', { shouldValidate: false });
      setPrevReadingLocked(false);
      setRateCarriedOver(false);
    }

    // Always clear current reading when switching units
    setValue('currentMeterReading', '', { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnitId]);

  const handleUnlockPrevReading = useCallback(() => {
    setPrevReadingLocked(false);
  }, []);

  // ── Derived calculations ─────────────────────────────────────────────────
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

  const balanceSeverity = getBalanceSeverity(remainingPrepaidBalance, hasBalancePreview);

  const balanceStatusColor =
    balanceSeverity === 'critical'
      ? '#F87171'
      : balanceSeverity === 'warning'
        ? '#FBBF24'
        : balanceSeverity === 'healthy'
          ? '#4ADE80'
          : '#CBD5E1';

  const totalPrepaidBalance = useMemo(
    () => units.reduce((sum, unit) => sum + (unit.prepaidElectricityBalance ?? 0), 0),
    [units]
  );

  const unitOptions = [...units]
    .sort((a, b) => {
      const ab = buildings.find((building) => building.id === a.buildingId)?.name ?? '';
      const bb = buildings.find((building) => building.id === b.buildingId)?.name ?? '';
      return ab.localeCompare(bb) || a.unitNumber.localeCompare(b.unitNumber);
    })
    .map((u) => ({
      label: `${formatUnitLabel(
        u,
        buildings.find((building) => building.id === u.buildingId)
      )}  ·  ${formatINR(u.prepaidElectricityBalance ?? 0)} bal`,
      value: u.id,
    }));

  const monthOptionsMapped = monthOptions.map((m) => ({ label: m, value: m }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = (values: ElectricityRecordFormValues) => {
    const selected: RentalUnit | undefined = units.find((u) => u.id === values.unitId);
    if (!selected) return;

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

    // Reset form but keep unitId and month so the next unit can be entered quickly
    const nextMonth = values.monthLabel;
    reset(createDefaultFormValues());
    setValue('monthLabel', nextMonth);
    setAutoFilledCtx(null);
    setPrevReadingLocked(false);
    setRateCarriedOver(false);
  };

  const renderHistoryCard = ({ item }: { item: ElectricityUsageRecord }) => {
    const sev = getBalanceSeverity(item.remainingPrepaidBalance, true);
    const balColor = sev === 'critical' ? '#F87171' : sev === 'warning' ? '#FBBF24' : '#64748B';

    return (
      <Surface
        style={[
          styles.billCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={1}
      >
        {/* Primary: charge amount */}
        <Text style={styles.cardCharge}>
          {formatINR(item.monthlyElectricityCharge, { minimumFractionDigits: 0 })}
        </Text>

        {/* Secondary: month + unit */}
        <View style={styles.cardRow}>
          <Text style={styles.cardMonth}>{item.monthLabel}</Text>
          <View style={styles.cardUnitBadge}>
            <Text style={styles.cardUnitText}>
              {(() => {
                const unit = units.find((candidate) => candidate.id === item.unitId);
                return unit
                  ? formatUnitLabel(
                      unit,
                      buildings.find((building) => building.id === unit.buildingId)
                    )
                  : 'Unknown unit';
              })()}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Metadata */}
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaLabel}>Prev</Text>
          <Text style={styles.cardMetaValue}>{item.previousMeterReading}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaLabel}>Curr</Text>
          <Text style={styles.cardMetaValue}>{item.currentMeterReading}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaLabel}>Units</Text>
          <Text style={styles.cardMetaValue}>{item.unitsConsumed}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaLabel}>Rate</Text>
          <Text style={styles.cardMetaValue}>{formatINR(item.ratePerUnit)}</Text>
        </View>

        {/* Balance */}
        <View style={styles.cardBalanceRow}>
          <Text style={styles.cardMetaLabel}>Remaining balance</Text>
          <Text style={[styles.cardBalanceValue, { color: balColor }]}>
            {formatINR(item.remainingPrepaidBalance)}
            {sev === 'critical' ? '  ⚠ Critical' : sev === 'warning' ? '  ⚠ Low' : ''}
          </Text>
        </View>
      </Surface>
    );
  };

  const renderListHeader = () => (
    <>
      {/* ── Page header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Electricity</Text>
        <Text style={styles.pageSubtitle}>Track sub-meter usage and prepaid balances</Text>
      </View>

      {/* ── Total balance pill ── */}
      <View style={styles.totalPill}>
        <Text style={styles.totalPillLabel}>TOTAL PREPAID</Text>
        <Text style={styles.totalPillValue}>{formatINR(totalPrepaidBalance)}</Text>
      </View>

      {/* ── Entry form ── */}
      <Surface
        style={[
          styles.formCard,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
        elevation={2}
        pointerEvents={units.length === 0 ? 'none' : 'auto'}
      >
        <Text style={styles.sectionLabel}>NEW ENTRY</Text>
        {units.length === 0 ? (
          <Text style={styles.emptyText}>No units yet. Add a unit first.</Text>
        ) : null}

        {/* Unit selector */}
        <Controller
          control={control}
          name="unitId"
          rules={{ required: 'Select a unit' }}
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[styles.selector, errors.unitId && styles.selectorError]}
                onPress={() => setUnitSheetVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={value ? styles.selectorValue : styles.selectorPlaceholder}>
                  {value
                    ? selectedUnit
                      ? formatUnitLabel(
                          selectedUnit,
                          buildings.find((b) => b.id === selectedUnit.buildingId)
                        )
                      : 'Select Unit'
                    : 'Select Unit'}
                </Text>
                {value && selectedUnit ? (
                  <Text style={styles.selectorMeta}>
                    {formatINR(selectedUnit.prepaidElectricityBalance ?? 0)} bal
                  </Text>
                ) : null}
                <Text style={styles.selectorChevron}>›</Text>
              </TouchableOpacity>
              {errors.unitId ? (
                <Text style={styles.fieldError}>{errors.unitId.message}</Text>
              ) : null}
            </>
          )}
        />

        {/* Month selector */}
        <Controller
          control={control}
          name="monthLabel"
          rules={{ required: 'Select a month' }}
          render={({ field: { value } }) => (
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setMonthSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectorValue}>{value || 'Billing Month'}</Text>
              <Text style={styles.selectorChevron}>›</Text>
            </TouchableOpacity>
          )}
        />

        {/* Previous reading — auto-filled and locked; tap lock to override */}
        {prevReadingLocked && autoFilledCtx ? (
          <View style={styles.lockedFieldWrapper}>
            <View style={styles.lockedField}>
              <View style={styles.lockedFieldLeft}>
                <Text style={styles.lockedFieldLabel}>Previous Reading</Text>
                <Text style={styles.lockedFieldValue}>{autoFilledCtx.previousMeterReading}</Text>
              </View>
              <View style={styles.lockedFieldRight}>
                <Text style={styles.lockedFieldSource}>from {autoFilledCtx.sourceMonth}</Text>
                <TouchableOpacity
                  style={styles.unlockBtn}
                  onPress={handleUnlockPrevReading}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="lock-outline" size={13} color="#475569" />
                  <Text style={styles.unlockBtnLabel}>Override</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Current reading alongside locked previous */}
            <Controller
              control={control}
              name="currentMeterReading"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Current Reading"
                  mode="outlined"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={Boolean(errors.currentMeterReading)}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  autoFocus
                  dense
                />
              )}
            />
          </View>
        ) : (
          /* Unlocked — show both editable side by side */
          <View style={styles.twoCol}>
            <Controller
              control={control}
              name="previousMeterReading"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Prev Reading"
                  mode="outlined"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={Boolean(errors.previousMeterReading)}
                  style={[styles.input, styles.inputHalf]}
                  contentStyle={styles.inputContent}
                  dense
                  right={
                    /* Show a subtle "edited" indicator if the user overrode an auto-fill */
                    autoFilledCtx && !prevReadingLocked ? (
                      <TextInput.Icon icon="pencil" color="#FBBF24" size={14} />
                    ) : undefined
                  }
                />
              )}
            />
            <Controller
              control={control}
              name="currentMeterReading"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Curr Reading"
                  mode="outlined"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={Boolean(errors.currentMeterReading)}
                  style={[styles.input, styles.inputHalf]}
                  contentStyle={styles.inputContent}
                  dense
                />
              )}
            />
          </View>
        )}

        {/* Rate — carried over from last record, always editable */}
        <Controller
          control={control}
          name="ratePerUnit"
          rules={{ required: true }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              label={rateCarriedOver ? 'Rate per Unit  (carried over)' : 'Rate per Unit'}
              mode="outlined"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={(v) => {
                onChange(v);
                setRateCarriedOver(false);
              }}
              error={Boolean(errors.ratePerUnit)}
              left={<TextInput.Affix text="₹" />}
              right={
                rateCarriedOver ? (
                  <TextInput.Icon icon="content-copy" color="#64748B" size={14} />
                ) : undefined
              }
              style={styles.input}
              contentStyle={styles.inputContent}
              dense
            />
          )}
        />

        {/* Live summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Units consumed</Text>
            <Text style={styles.summaryNumber}>{unitsConsumed}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly charge</Text>
            <Text style={styles.summaryCharge}>
              {formatINR(monthlyCharge, { minimumFractionDigits: 0 })}
            </Text>
          </View>
          {hasBalancePreview ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining balance</Text>
              <Text style={[styles.summaryBalance, { color: balanceStatusColor }]}>
                {formatINR(remainingPrepaidBalance)}
              </Text>
            </View>
          ) : null}

          {/* Warning strip — only shown when balance is low */}
          {balanceSeverity === 'critical' ? (
            <View style={[styles.warnStrip, styles.warnCritical]}>
              <Text style={styles.warnText}>⚠ Critical — top up before next cycle</Text>
            </View>
          ) : balanceSeverity === 'warning' ? (
            <View style={[styles.warnStrip, styles.warnLow]}>
              <Text style={styles.warnText}>⚠ Balance below ₹500</Text>
            </View>
          ) : null}
        </View>

        <Button
          mode="contained"
          disabled={units.length === 0}
          onPress={handleSubmit(onSubmit)}
          contentStyle={styles.saveButton}
          labelStyle={styles.saveLabel}
        >
          Save Entry
        </Button>
      </Surface>

      {/* ── History header ── */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
      </View>
    </>
  );

  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderHistoryCard}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No history yet — add your first reading above.</Text>
        }
      />

      {/* Unit bottom sheet */}
      <Controller
        control={control}
        name="unitId"
        render={({ field: { value } }) => (
          <DropdownSheet
            visible={unitSheetVisible}
            title="Select Unit"
            options={unitOptions}
            selected={value}
            onSelect={(val) => setValue('unitId', val, { shouldValidate: true })}
            onDismiss={() => setUnitSheetVisible(false)}
          />
        )}
      />

      {/* Month bottom sheet */}
      <Controller
        control={control}
        name="monthLabel"
        render={({ field: { value } }) => (
          <DropdownSheet
            visible={monthSheetVisible}
            title="Billing Month"
            options={monthOptionsMapped}
            selected={value}
            onSelect={(val) => setValue('monthLabel', val, { shouldValidate: true })}
            onDismiss={() => setMonthSheetVisible(false)}
          />
        )}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl },

  // Header
  header: { marginTop: spacing.xs, marginBottom: spacing.sm },
  pageTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  pageSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },

  // Total pill
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(126,155,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(126,155,255,0.2)',
  },
  totalPillLabel: { color: '#7E9BFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  totalPillValue: { color: '#E2E8F0', fontSize: 15, fontWeight: '800' },

  // Form card
  formCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 10,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  // Custom selectors
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#293241',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#0F1923',
  },
  selectorError: { borderColor: '#F87171' },
  selectorPlaceholder: { flex: 1, color: '#475569', fontSize: 14 },
  selectorValue: { flex: 1, color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  selectorMeta: { color: '#64748B', fontSize: 12, marginRight: 8 },
  selectorChevron: { color: '#475569', fontSize: 20, lineHeight: 22 },
  fieldError: { color: '#F87171', fontSize: 11, marginTop: -6 },

  // Inputs
  twoCol: { flexDirection: 'row', gap: 10 },
  input: { flex: 1 },
  inputHalf: { flex: 1 },
  inputContent: { fontSize: 14, fontWeight: '600' },

  // Locked previous-reading field
  lockedFieldWrapper: { gap: 10 },
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A1018',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lockedFieldLeft: { gap: 2 },
  lockedFieldLabel: { color: '#475569', fontSize: 11, fontWeight: '600' },
  lockedFieldValue: { color: '#E2E8F0', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  lockedFieldRight: { alignItems: 'flex-end', gap: 6 },
  lockedFieldSource: { color: '#334155', fontSize: 11 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  unlockBtnLabel: { color: '#64748B', fontSize: 11, fontWeight: '700' },

  // Live summary
  summary: {
    backgroundColor: '#0A1018',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: '#64748B', fontSize: 13 },
  summaryNumber: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  summaryCharge: { color: '#E2E8F0', fontSize: 18, fontWeight: '800' },
  summaryBalance: { fontSize: 14, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: '#1E293B' },

  // Warning strips
  warnStrip: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  warnCritical: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
  },
  warnLow: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  warnText: { fontSize: 12, fontWeight: '700', color: '#F1F5F9' },

  // Save button
  saveButton: { minHeight: 42 },
  saveLabel: { fontWeight: '700', fontSize: 14 },

  // History
  historyHeader: { marginBottom: spacing.sm },
  historyTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '800' },
  emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', marginTop: spacing.lg },

  // Bill card
  billCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: spacing.md,
    gap: 8,
  },
  cardCharge: {
    color: '#F1F5F9',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMonth: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  cardUnitBadge: {
    backgroundColor: 'rgba(126,155,255,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardUnitText: {
    color: '#7E9BFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1E293B',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardMetaLabel: { color: '#475569', fontSize: 11, fontWeight: '600' },
  cardMetaValue: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  cardMetaDot: { color: '#334155', fontSize: 11 },
  cardBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBalanceValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
