import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  Snackbar,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { Language, useT } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { normalizeIndianMobile } from '../utils/phone';
import { ShareRequest, WhatsAppShareContext } from './useWhatsAppShare';

export function WhatsAppShareProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { t } = useT();
  const ownerWhatsApp = useSettingsStore((state) => state.ownerWhatsApp);
  const [request, setRequest] = useState<ShareRequest | null>(null);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState<Language>('hi');
  const [edited, setEdited] = useState(false);
  const [remember, setRemember] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ShareRequest | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<ShareRequest | null>(null);

  const share = useCallback((nextRequest: ShareRequest) => {
    setRequest(nextRequest);
    setLanguage(nextRequest.defaultLanguage);
    setMessage(nextRequest.buildMessage(nextRequest.defaultLanguage));
    setEdited(false);
    setRemember(false);
    setError('');
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pending.current) {
        setConfirmRequest(pending.current);
        pending.current = null;
      }
    });
    return () => subscription.remove();
  }, []);

  const normalizedRecipientPhone = request?.phone ? normalizeIndianMobile(request.phone) : null;
  const normalizedOwnerPhone = ownerWhatsApp ? normalizeIndianMobile(ownerWhatsApp) : null;

  const changeLanguage = (nextLanguage: string) => {
    const next = nextLanguage as Language;
    if (!request || next === language) return;
    const replace = () => {
      setLanguage(next);
      setMessage(request.buildMessage(next));
      setEdited(false);
    };
    if (!edited) {
      replace();
      return;
    }
    Alert.alert(
      t('whatsapp.replaceEditsTitle'),
      t('whatsapp.replaceEditsMessage', { language: languageName(next) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('whatsapp.replace'), onPress: replace },
      ]
    );
  };

  const openWhatsApp = async (testNumber: boolean) => {
    const normalized = testNumber ? normalizedOwnerPhone : normalizedRecipientPhone;
    if (!normalized) {
      setError(testNumber ? t('whatsapp.addNumberInSettings') : t('whatsapp.invalidNumber'));
      return;
    }
    if (!testNumber && request) pending.current = request;
    try {
      await Linking.openURL(
        `https://wa.me/${normalized.digits}?text=${encodeURIComponent(message)}`
      );
      if (!testNumber && request && remember) request.rememberLanguage?.(language);
      if (!testNumber && request) {
        setRequest(null);
      }
    } catch {
      pending.current = null;
      setError(t('whatsapp.openError'));
    }
  };

  const confirmSent = (sent: boolean) => {
    if (sent) confirmRequest?.onSent?.();
    setConfirmRequest(null);
  };

  return (
    <WhatsAppShareContext.Provider value={{ share }}>
      {children}
      <Portal>
        <Dialog
          visible={Boolean(request)}
          onDismiss={() => setRequest(null)}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <Dialog.Title>{t('whatsapp.preview')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="titleMedium">
              {t('whatsapp.to')}: {request?.recipientName ?? ''}
            </Text>
            <Text variant="bodyMedium">{normalizedRecipientPhone?.display ?? request?.phone}</Text>
            {!normalizedRecipientPhone ? (
              <HelperText type="error" visible>
                {t('whatsapp.invalidNumber')} {t('whatsapp.editTenant')}
              </HelperText>
            ) : null}
            <SegmentedButtons
              value={language}
              onValueChange={changeLanguage}
              buttons={[
                { value: 'hi', label: 'हिन्दी' },
                { value: 'en', label: 'English' },
              ]}
            />
            <TextInput
              label={t('whatsapp.message')}
              value={message}
              onChangeText={(value) => {
                setMessage(value);
                setEdited(true);
              }}
              multiline
              style={styles.message}
              mode="outlined"
            />
            {request?.rememberLanguage ? (
              <View style={styles.rememberRow}>
                <Text style={styles.rememberText}>
                  {t('whatsapp.alwaysUseLanguage', {
                    language: languageName(language),
                    name: request.recipientName,
                  })}
                </Text>
                <Switch value={remember} onValueChange={setRemember} />
              </View>
            ) : null}
            {ownerWhatsApp && normalizedOwnerPhone ? null : (
              <HelperText type="info" visible>
                {t('whatsapp.addNumberInSettings')}
              </HelperText>
            )}
            {error ? (
              <HelperText type="error" visible>
                {error}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => openWhatsApp(true)}>{t('whatsapp.testOnMyNumber')}</Button>
            <Button onPress={() => setRequest(null)}>{t('common.cancel')}</Button>
            <Button disabled={!normalizedRecipientPhone} onPress={() => openWhatsApp(false)}>
              {t('whatsapp.openWhatsApp')}
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={Boolean(confirmRequest)}
          onDismiss={() => confirmSent(false)}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        >
          <Dialog.Title>{t('whatsapp.confirmTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>
              {t('whatsapp.didYouSend', {
                name: confirmRequest ? confirmRequest.recipientName : '',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => confirmSent(false)}>{t('whatsapp.no')}</Button>
            <Button onPress={() => confirmSent(true)}>{t('whatsapp.yesSent')}</Button>
          </Dialog.Actions>
        </Dialog>
        <Snackbar visible={Boolean(error)} onDismiss={() => setError('')}>
          {error}
        </Snackbar>
      </Portal>
    </WhatsAppShareContext.Provider>
  );
}

const styles = StyleSheet.create({
  message: { minHeight: 220 },
  rememberRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rememberText: { flex: 1 },
});

function languageName(language: Language) {
  return language === 'hi' ? 'हिन्दी' : 'English';
}
