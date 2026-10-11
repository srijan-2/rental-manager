export function formatINR(
  amount: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

export function formatINRInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return '';
  }
  return Number(digitsOnly).toLocaleString('en-IN');
}

export function parseCurrencyInput(formattedValue: string) {
  const normalized = formattedValue.replace(/[^\d.]/g, '');
  return normalized ? Number(normalized) : 0;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
