import { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { radius, spacing } from '../../styles/layout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Surface
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}
      elevation={1}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>
        <IconButton icon={expanded ? 'chevron-up' : 'chevron-down'} onPress={toggle} size={22} />
      </View>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  content: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
});
