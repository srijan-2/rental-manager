import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput,
  HelperText,
  Button,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store';
import { formatINR } from '../../utils';
import { spacing } from '../../styles/layout';
import { isValidIndianMobile, normalizeIndianMobile } from '../../utils/phone';

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
  const ownerWhatsApp = useSettingsStore((state) => state.ownerWhatsApp);
  const setOwnerWhatsApp = useSettingsStore((state) => state.setOwnerWhatsApp);
  const [ownerNumber, setOwnerNumber] = useState(ownerWhatsApp ?? '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (visible) setOwnerNumber(ownerWhatsApp ?? '');
  }, [ownerWhatsApp, visible]);

  useEffect(() => {
    if (!savedFeedback) return;
    const timer = setTimeout(() => setSavedFeedback(false), 2000);
    return () => clearTimeout(timer);
  }, [savedFeedback]);

  const saveOwnerNumber = () => {
    Keyboard.dismiss();
    if (!ownerNumber.trim()) {
      setOwnerWhatsApp(undefined);
    } else {
      const normalized = normalizeIndianMobile(ownerNumber);
      if (!normalized) return;
      setOwnerWhatsApp(normalized.display);
    }
    setSavedFeedback(true);
  };

  const normalizedOwnerNumber = ownerNumber.trim() ? normalizeIndianMobile(ownerNumber) : null;
  const invalidOwnerNumber = Boolean(ownerNumber && !isValidIndianMobile(ownerNumber));
  const storedOwnerNumber = ownerWhatsApp ?? '';
  const draftOwnerNumber = normalizedOwnerNumber?.display ?? (ownerNumber.trim() ? '' : '');
  const saveDisabled =
    savedFeedback || invalidOwnerNumber || draftOwnerNumber === storedOwnerNumber;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
        >
          <Surface style={styles.content}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="headlineSmall">{t('settings.title')}</Text>
              <TextInput
                label={t('whatsapp.ownerNumber')}
                value={ownerNumber}
                onChangeText={setOwnerNumber}
                keyboardType="phone-pad"
                mode="outlined"
                error={invalidOwnerNumber}
              />
              <HelperText type="error" visible={invalidOwnerNumber}>
                {t('whatsapp.phoneInvalid')}
              </HelperText>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {storedOwnerNumber
                  ? t('settings.savedNumber', { number: storedOwnerNumber })
                  : t('settings.noNumberSaved')}
              </Text>
              <Button
                mode="outlined"
                icon={savedFeedback ? 'check' : undefined}
                textColor={savedFeedback ? theme.colors.primary : undefined}
                disabled={saveDisabled}
                onPress={saveOwnerNumber}
              >
                {savedFeedback ? t('settings.saved') : t('common.save')}
              </Button>
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
              <Button mode="text" onPress={onDismiss}>
                {t('common.close')}
              </Button>
            </ScrollView>
            <Snackbar
              visible={savedFeedback}
              onDismiss={() => setSavedFeedback(false)}
              style={styles.snackbar}
            >
              {t('settings.savedMessage')}
            </Snackbar>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: spacing.md, borderRadius: 16, padding: spacing.md },
  content: { backgroundColor: 'transparent', gap: spacing.md, paddingBottom: spacing.xl },
  keyboardAvoidingView: { maxHeight: '90%' },
  snackbar: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
});
