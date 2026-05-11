import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import { TenantCard } from '../components/tenants/TenantCard';
import { TenantFormModal } from '../components/tenants/TenantFormModal';
import { useTenantsStore } from '../store';
import { sharedStyles, spacing } from '../styles/layout';
import { Tenant, TenantFormValues } from '../types/tenant';
import { parseCurrencyInput } from '../utils';

export function TenantsScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const tenants = useTenantsStore((state) => state.tenants);
  const addTenant = useTenantsStore((state) => state.addTenant);
  const updateTenant = useTenantsStore((state) => state.updateTenant);
  const deleteTenant = useTenantsStore((state) => state.deleteTenant);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((tenant) =>
      [tenant.name, tenant.phone, tenant.assignedUnit].join(' ').toLowerCase().includes(query)
    );
  }, [searchQuery, tenants]);

  const openAddModal = () => {
    setSelectedTenant(null);
    setIsModalVisible(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalVisible(true);
  };

  const submitTenant = (values: TenantFormValues) => {
    const payload: Tenant = {
      id: selectedTenant?.id ?? `tenant-${Date.now()}`,
      name: values.name.trim(),
      phone: values.phone.trim(),
      assignedUnit: values.assignedUnit.trim().toUpperCase(),
      monthlyRent: parseCurrencyInput(values.monthlyRent),
      moveInDate: values.moveInDate.trim(),
    };

    if (selectedTenant) {
      updateTenant(selectedTenant.id, payload);
      return;
    }
    addTenant(payload);
  };

  return (
    <View style={[sharedStyles.screen, styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Tenant Management</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Track tenant profiles, contact info, and unit assignments.
        </Text>
      </View>

      <Searchbar
        placeholder="Search by name, phone, or unit"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
      />

      <FlatList
        data={filteredTenants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TenantCard tenant={item} onEdit={openEditModal} onDelete={deleteTenant} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
            <Text variant="titleMedium">No tenants found</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Try another search or add a new tenant profile.
            </Text>
          </View>
        }
      />

      <FAB icon="account-plus" label="Add Tenant" style={styles.fab} onPress={openAddModal} />

      <TenantFormModal
        visible={isModalVisible}
        selectedTenant={selectedTenant}
        onDismiss={() => setIsModalVisible(false)}
        onSubmitTenant={submitTenant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  search: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: 88,
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  fab: {
    bottom: spacing.lg,
    position: 'absolute',
    right: spacing.md,
  },
});
