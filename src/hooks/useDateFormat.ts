import { useMemo } from 'react';
import { useT } from '../i18n';
import { formatIndianDate, formatLongDate } from '../utils/date';

export function useDateFormat() {
  const { language } = useT();
  return useMemo(
    () => ({
      formatIndianDate: (iso: string) => formatIndianDate(iso, language),
      formatLongDate: (iso: string) => formatLongDate(iso, language),
    }),
    [language]
  );
}
