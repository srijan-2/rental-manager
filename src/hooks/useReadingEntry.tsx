import { useCallback, useState } from 'react';
import { ElectricityReadingModal } from '../components/payments/ElectricityReadingModal';
import { usePaymentsStore, useTenantsStore } from '../store';
import { useToday } from './useToday';
import { canEditReading, getReadingContext } from '../utils/readings';

export function useReadingEntry() {
  const payments = usePaymentsStore((state) => state.payments);
  const tenants = useTenantsStore((state) => state.tenants);
  const saveElectricity = usePaymentsStore((state) => state.saveElectricity);
  const [readingId, setReadingId] = useState<string | null>(null);
  const today = useToday();
  const openReading = useCallback((billId: string) => setReadingId(billId), []);
  const bill = readingId ? payments.find((item) => item.id === readingId) : undefined;
  const context = bill ? getReadingContext(bill, payments, tenants) : null;
  const readingModal =
    bill && context ? (
      <ElectricityReadingModal
        visible
        bill={bill}
        previousReading={context.previousReading}
        previousPeriodLabel={context.previousPeriodLabel}
        initialRate={context.initialRate}
        canEdit={canEditReading(bill, payments, today)}
        onDismiss={() => setReadingId(null)}
        onSave={(electricity) => saveElectricity(bill.id, electricity)}
      />
    ) : null;

  return { openReading, readingModal };
}
