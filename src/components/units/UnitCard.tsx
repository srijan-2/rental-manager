import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { RentalUnit } from '../../types/unit';
import { formatINR } from '../../utils';

interface UnitCardProps {
  unit: RentalUnit;
  buildingName: string;
  tenantDisplayName?: string;
  onPress?: (unit: RentalUnit) => void;
}

export const UnitCard = memo(
  ({ unit, buildingName, tenantDisplayName, onPress }: UnitCardProps) => {
    const theme = useTheme();
    const isOccupied = unit.status === 'Occupied';

    return (
      <Pressable onPress={() => onPress?.(unit)}>
        <Surface
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          elevation={2}
        >
          <View style={styles.row}>
            <View>
              <Text variant="titleMedium" style={styles.unitNumber}>
                {buildingName} · {unit.unitNumber}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Tenant: {tenantDisplayName ?? 'Vacant'}
              </Text>
            </View>

            <Chip
              compact
              style={[styles.badge, { backgroundColor: isOccupied ? '#14532d66' : '#78350f66' }]}
              textStyle={{ color: isOccupied ? '#86EFAC' : '#FCD34D', fontWeight: '700' }}
            >
              {unit.status}
            </Chip>
          </View>

          <View style={styles.metaRow}>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Monthly Rent
              </Text>
              <Text variant="titleMedium">{formatINR(unit.monthlyRent)}/month</Text>
            </View>
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Security Deposit
              </Text>
              <Text variant="titleMedium">{formatINR(unit.securityDeposit ?? 0)}</Text>
            </View>
          </View>
        </Surface>
      </Pressable>
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
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitNumber: {
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  badge: {
    borderRadius: radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
