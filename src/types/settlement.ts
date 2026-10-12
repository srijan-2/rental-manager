import { PaymentMethod } from './payment';

export interface Settlement {
  id: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  moveOutDate: string;
  billIds: string[];
  unpaidBillsAmount: number;
  finalRent: number;
  finalElectricity: number;
  deductionAmount: number;
  deductionNote?: string;
  advanceApplied: number;
  depositApplied: number;
  netAmount: number;
  paidDate?: string;
  method?: Exclude<PaymentMethod, 'Settlement'>;
  createdAt: string;
  finalRentDetail?: string;
  finalElectricityDetail?: string;
  tenantPhone?: string;
  messageLanguage?: 'hi' | 'en';
  statementSentAt?: string;
  paidMessageSentAt?: string;
}
