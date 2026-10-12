export interface NormalizedIndianMobile {
  digits: string;
  display: string;
}

export function normalizeIndianMobile(input: string): NormalizedIndianMobile | null {
  let digits = input.trim().replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return {
    digits: `91${digits}`,
    display: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
}

export function isValidIndianMobile(input: string) {
  return normalizeIndianMobile(input) !== null;
}
