import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { Tenant } from '../../types/tenant';
import { Building } from '../../types/building';
import { RentalUnit } from '../../types/unit';
import { formatINR, formatIndianDate, formatUnitLabel } from '../../utils';

interface TenantCardProps {
  tenant: Tenant;
  unit?: RentalUnit;
  building?: Building;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
  onMoveOut: (tenantId: string) => void;
  hasActivity: boolean;
}

export const TenantCard = memo(
  ({ tenant, unit, building, onEdit, onDelete, onMoveOut, hasActivity }: TenantCardProps) => {
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
            <Avatar.Text size={42} label={tenant.name.slice(0, 2)} />
            <View>
              <Text variant="titleMedium" style={styles.name}>
                {tenant.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {tenant.phone}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <IconButton icon="pencil-outline" onPress={() => onEdit(tenant)} />
            <Button mode="contained-tonal" compact onPress={() => onMoveOut(tenant.id)}>
              Move out
            </Button>
            {!hasActivity ? (
              <IconButton icon="trash-can-outline" onPress={() => onDelete(tenant.id)} />
            ) : null}
          </View>
        </View>

        <View style={styles.meta}>
          <Text variant="bodyMedium">
            Unit: {unit ? formatUnitLabel(unit, building) : 'Unknown unit'}
          </Text>
          <Text variant="bodyMedium">Rent: {formatINR(tenant.monthlyRent)}/month</Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Move-in: {formatIndianDate(tenant.moveInDate)}
        </Text>
      </Surface>
    );
  }
);

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
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
