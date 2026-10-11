import { AppState } from 'react-native';
import { useEffect, useState } from 'react';
import { todayISO } from '../utils/date';

export function useToday() {
  const [today, setToday] = useState(todayISO());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timeout = setTimeout(() => {
        setToday(todayISO());
        scheduleMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime());
    };

    const refresh = () => {
      setToday(todayISO());
      clearTimeout(timeout);
      scheduleMidnightRefresh();
    };

    scheduleMidnightRefresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, []);

  return today;
}
