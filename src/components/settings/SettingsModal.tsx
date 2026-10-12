import { StyleSheet, View } from 'react-native';
import {
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store';
import { formatINR } from '../../utils';
import { spacing } from '../../styles/layout';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function SettingsModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { t, language } = useT();
  const largeText = useSettingsStore((state) => state.largeText);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setLargeText = useSettingsStore((state) => state.setLargeText);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Surface style={styles.content}>
          <Text variant="headlineSmall">{t('settings.title')}</Text>
          <Text variant="titleMedium">{t('settings.language')}</Text>
          <SegmentedButtons
            value={language}
            onValueChange={(value) => setLanguage(value as 'hi' | 'en')}
            buttons={[
              { value: 'hi', label: 'हिन्दी' },
              { value: 'en', label: 'English' },
            ]}
          />
          <View style={styles.switchRow}>
            <View style={styles.copy}>
              <Text variant="titleMedium">{t('settings.largeText')}</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('settings.largeTextHelp')}
              </Text>
            </View>
            <Switch value={largeText} onValueChange={setLargeText} />
          </View>
          <Text variant={largeText ? 'headlineSmall' : 'bodyLarge'}>
            {t('settings.preview', { amount: formatINR(12500) })}
          </Text>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: spacing.md, borderRadius: 16, padding: spacing.md },
  content: { gap: spacing.md, backgroundColor: 'transparent' },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
});
