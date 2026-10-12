import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { DashboardStats } from '../../utils/dashboard';
import { formatINR } from '../../utils';
import { spacing } from '../../styles/layout';
import { useT } from '../../i18n';

export const BuildingRow = memo(function BuildingRow({
  building,
}: {
  building: DashboardStats['byBuilding'][number];
}) {
  const theme = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={styles.copy}>
        <Text variant="bodyLarge">{building.building.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('dashboard.unitsOccupied', {
            occupied: building.occupiedUnits,
            total: building.totalUnits,
          })}
        </Text>
      </View>
      <Text
        variant="bodyLarge"
        style={{
          color: building.pendingToCollect ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
        }}
      >
        {formatINR(building.pendingToCollect)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.xs,
  },
  copy: { flex: 1, gap: spacing.xxs },
});
