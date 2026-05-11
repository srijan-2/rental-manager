import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';

export interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  width: number;
}

export const SummaryCard = memo(
  ({ title, value, subtitle, icon, accentColor, width }: SummaryCardProps) => {
    const theme = useTheme();

    return (
      <Surface
        style={[
          styles.card,
          {
            width,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={2}
      >
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}26` }]}>
            <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
          </View>
        </View>

        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      </Surface>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 148,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  value: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 20,
  },
});
