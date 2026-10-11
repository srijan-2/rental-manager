import { memo, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '../../styles/layout';

interface ActionRowProps {
  title: string;
  subtitle: string;
  onPress?: () => void;
  action?: ReactNode;
  trailing?: ReactNode;
}

export const ActionRow = memo(function ActionRow({
  title,
  subtitle,
  onPress,
  action,
  trailing,
}: ActionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.copy}>
        <Text variant="bodyLarge">{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>
      </View>
      {trailing}
      {action}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  copy: { flex: 1, gap: spacing.xxs },
});
