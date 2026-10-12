import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { en } from './en';
import { hi } from './hi';

export type Language = 'hi' | 'en';
export type TranslationKey = keyof typeof en;

const dictionaries = { en, hi };

export function translate(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
) {
  let value = dictionaries[language][key] ?? en[key];
  Object.entries(params ?? {}).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, String(replacement));
  });
  return value;
}

export function useT() {
  const language = useSettingsStore((state) => state.language);
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );
  return { t, language };
}

export function getStatusLabel(status: string, t: ReturnType<typeof useT>['t']) {
  const keyByStatus: Record<string, TranslationKey> = {
    Paid: 'status.paid',
    'In progress': 'status.inProgress',
    'Calculation pending': 'status.calculationPending',
    Due: 'status.due',
    Overdue: 'status.overdue',
    Settled: 'status.settled',
    'Balance due': 'status.balanceDue',
    'Refund pending': 'status.refundPending',
  };
  return t(keyByStatus[status] ?? 'status.inProgress');
}

export function getMethodLabel(method: string, t: ReturnType<typeof useT>['t']) {
  const keyByMethod: Record<string, TranslationKey> = {
    Cash: 'method.cash',
    'Bank Transfer': 'method.bankTransfer',
    UPI: 'method.upi',
    Card: 'method.card',
    Settlement: 'method.settlement',
  };
  return t(keyByMethod[method] ?? 'method.cash');
}

export { en, hi };
