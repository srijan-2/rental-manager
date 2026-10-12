import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button, Text } from 'react-native-paper';
import { RootTabParamList } from '../../navigation/AppTabs';
import { spacing } from '../../styles/layout';
import { useT } from '../../i18n';

interface SectionHeaderProps {
  title: string;
  count: number;
  route: keyof RootTabParamList;
}

export function SectionHeader({ title, count, route }: SectionHeaderProps) {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { t } = useT();
  return (
    <View style={styles.row}>
      <Text variant="titleMedium" style={styles.title}>
        {title} ({count})
      </Text>
      <Button compact onPress={() => navigation.navigate(route)}>
        {t('common.viewAll')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  title: { flex: 1 },
});
