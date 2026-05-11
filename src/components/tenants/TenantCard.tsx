import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { Tenant } from '../../types/tenant';
import { formatINR, formatIndianDate } from '../../utils';

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export const TenantCard = memo(({ tenant, onEdit, onDelete }: TenantCardProps) => {
  const theme = useTheme();

  return (
    <Surface
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      elevation={2}
    >
      <View style={styles.header}>
        <View style={styles.profile}>
          <Avatar.Text size={42} label={tenant.name.slice(0, 2).toUpperCase()} />
          <View>
            <Text variant="titleMedium" style={styles.name}>{tenant.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{tenant.phone}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <IconButton icon="pencil-outline" onPress={() => onEdit(tenant)} />
          <IconButton icon="trash-can-outline" iconColor="#F87171" onPress={() => onDelete(tenant.id)} />
        </View>
      </View>

      <View style={styles.meta}>
        <Text variant="bodyMedium">Unit: {tenant.assignedUnit}</Text>
        <Text variant="bodyMedium">Rent: {formatINR(tenant.monthlyRent)}/month</Text>
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Move-in: {formatIndianDate(tenant.moveInDate)}
      </Text>
    </Surface>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profile: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  name: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
