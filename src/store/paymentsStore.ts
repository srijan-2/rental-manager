import { create } from 'zustand';
import { MOCK_PAYMENTS } from '../data/mockPayments';
import { Payment } from '../types/payment';

interface PaymentsState {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => void;
  deletePayment: (paymentId: string) => void;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: MOCK_PAYMENTS,
  addPayment: (payment) =>
    set((state) => ({
      payments: [payment, ...state.payments],
    })),
  updatePayment: (paymentId, updates) =>
    set((state) => ({
      payments: state.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ),
    })),
  deletePayment: (paymentId) =>
    set((state) => ({
      payments: state.payments.filter((payment) => payment.id !== paymentId),
    })),
}));
