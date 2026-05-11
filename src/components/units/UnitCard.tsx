import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';
import { RentalUnit } from '../../types/unit';
import { formatINR, formatIndianDate } from '../../utils';

interface UnitCardProps {
  unit: RentalUnit;
}

export const UnitCard = memo(({ unit }: UnitCardProps) => {
  const theme = useTheme();
  const isOccupied = unit.status === 'Occupied';

  return (
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
            {unit.unitNumber}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Tenant: {unit.tenantName}
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
            Due Date
          </Text>
          <Text variant="titleMedium">{formatIndianDate(unit.dueDate)}</Text>
        </View>
      </View>
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
