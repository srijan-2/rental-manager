import { AppState } from 'react-native';
import { useEffect } from 'react';
import { ensureBillSchedule } from '../store/paymentSchedule';
import { usePaymentsStore } from '../store/paymentsStore';
import { useTenantsStore } from '../store/tenantsStore';
import { useUnitsStore } from '../store/unitsStore';

export function useBillScheduleSync() {
  useEffect(() => {
    const stores = [useTenantsStore, useUnitsStore, usePaymentsStore];
    const syncIfHydrated = () => {
      if (stores.every((store) => store.persist.hasHydrated())) ensureBillSchedule();
    };
    const unsubscribers = stores.map((store) => store.persist.onFinishHydration(syncIfHydrated));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncIfHydrated();
    });

    syncIfHydrated();
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      subscription.remove();
    };
  }, []);
}
