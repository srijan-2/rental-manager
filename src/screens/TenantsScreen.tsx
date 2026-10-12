import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { FAB, Searchbar, Snackbar, Text, useTheme } from 'react-native-paper';
import { TenantCard } from '../components/tenants/TenantCard';
import { TenantFormModal } from '../components/tenants/TenantFormModal';
import { MoveOutScreen } from './MoveOutScreen';
import {
  assignTenant,
  removeTenant,
  updateTenant,
  useBuildingsStore,
  usePaymentsStore,
  useTenantsStore,
  useUnitsStore,
} from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { Tenant, TenantFormValues } from '../types/tenant';
import { parseCurrencyInput } from '../utils';
import { normalizeIndianMobile } from '../utils/phone';
import { buildWelcomeInput } from '../messages/buildInputs';
import { buildWelcomeMessage } from '../messages/templates';
import { useWhatsAppShare } from '../whatsapp/useWhatsAppShare';
import { useT } from '../i18n';
export function TenantsScreen() {
  const theme = useTheme();
  const { t } = useT();
  const { share } = useWhatsAppShare();
  const tenants = useTenantsStore((s) => s.tenants);
  const units = useUnitsStore((s) => s.units);
  const payments = usePaymentsStore((s) => s.payments);
  const buildings = useBuildingsStore((s) => s.buildings);
  const updateMessageLanguage = useTenantsStore((s) => s.updateMessageLanguage);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [moveOutTenantId, setMoveOutTenantId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [welcomeTenantId, setWelcomeTenantId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? tenants.filter((t) => {
          const u = units.find((x) => x.id === t.unitId);
          const b = buildings.find((x) => x.id === u?.buildingId);
          return [t.name, t.phone, u?.unitNumber ?? '', b?.name ?? '']
            .join(' ')
            .toLowerCase()
            .includes(q);
        })
      : tenants;
  }, [query, tenants, units, buildings]);
  const submit = (v: TenantFormValues) => {
    const phone = normalizeIndianMobile(v.phone);
    if (!phone) throw new Error('Enter a valid Indian WhatsApp number');
    const data = {
      name: v.name.trim(),
      phone: phone.display,
      unitId: v.unitId,
      monthlyRent: parseCurrencyInput(v.monthlyRent),
      moveInDate: v.moveInDate.trim(),
      electricityAdvance: parseCurrencyInput(v.electricityAdvance),
      openingMeterReading: Number(v.openingMeterReading),
      billingStartDate: v.billingStartDate.trim(),
      messageLanguage: v.messageLanguage,
    };
    if (selected) {
      updateTenant(selected.id, data);
    } else {
      const tenant = assignTenant(data);
      setWelcomeTenantId(tenant.id);
      setMessage(t('whatsapp.tenantAdded'));
    }
  };
  const sendWelcome = (tenantId: string) => {
    const tenant = useTenantsStore.getState().tenants.find((item) => item.id === tenantId);
    const unit = tenant && useUnitsStore.getState().units.find((item) => item.id === tenant.unitId);
    const building =
      unit && useBuildingsStore.getState().buildings.find((item) => item.id === unit.buildingId);
    const input =
      tenant && unit && building
        ? buildWelcomeInput(tenant, unit, building, usePaymentsStore.getState().payments)
        : null;
    if (!tenant || !input) return;
    share({
      recipientName: tenant.name,
      phone: tenant.phone,
      defaultLanguage: tenant.messageLanguage,
      buildMessage: (language) => buildWelcomeMessage(input, language),
      onSent: () => useTenantsStore.getState().markWelcomeSent(tenantId),
      rememberLanguage: (language) => updateMessageLanguage(tenantId, language),
    });
  };
  const del = (id: string) =>
    Alert.alert('Delete tenant?', 'This will free the assigned unit.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTenant(id) },
    ]);
  return (
    <View
      style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Tenant Management
      </Text>
      <Searchbar
        placeholder="Search by name, phone, or unit"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(x) => x.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const u = units.find((x) => x.id === item.unitId);
          return (
            <TenantCard
              tenant={item}
              unit={u}
              building={buildings.find((b) => b.id === u?.buildingId)}
              onEdit={(t) => {
                setSelected(t);
                setVisible(true);
              }}
              onDelete={del}
              hasActivity={payments.some(
                (bill) =>
                  bill.tenantId === item.id &&
                  Boolean(bill.rentPaidDate || bill.electricityPaidDate || bill.electricity)
              )}
              onMoveOut={setMoveOutTenantId}
              onSendWelcome={sendWelcome}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No tenants found</Text>
            <Text>Try another search or add a new tenant profile.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="account-plus"
        label="Add Tenant"
        style={styles.fab}
        onPress={() => {
          setSelected(null);
          setVisible(true);
        }}
      />
      <TenantFormModal
        visible={visible}
        selectedTenant={selected}
        onDismiss={() => setVisible(false)}
        onSubmitTenant={submit}
      />
      <MoveOutScreen
        visible={Boolean(moveOutTenantId)}
        tenantId={moveOutTenantId}
        onDismiss={() => setMoveOutTenantId(null)}
        onCompleted={() => {
          setMoveOutTenantId(null);
          setMessage('Move-out completed');
        }}
      />
      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => {
          setMessage('');
          setWelcomeTenantId(null);
        }}
        duration={10000}
        action={
          welcomeTenantId
            ? { label: t('whatsapp.sendWelcome'), onPress: () => sendWelcome(welcomeTenantId) }
            : undefined
        }
      >
        {message}
      </Snackbar>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { position: 'relative' },
  title: { fontWeight: '700', marginBottom: spacing.sm },
  search: { marginBottom: spacing.md },
  list: { paddingBottom: 88 },
  empty: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  fab: { bottom: spacing.lg, position: 'absolute', right: spacing.md },
});
