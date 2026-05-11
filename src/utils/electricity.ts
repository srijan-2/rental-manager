export function calculateUnitsConsumed(previousReading: number, currentReading: number) {
  return Math.max(currentReading - previousReading, 0);
}

export function calculateMonthlyElectricityCharge(unitsConsumed: number, ratePerUnit: number) {
  return unitsConsumed * ratePerUnit;
}

export function calculateRemainingPrepaidBalance(currentBalance: number, monthlyCharge: number) {
  return currentBalance - monthlyCharge;
}

export function hasLowElectricityBalance(remainingBalance: number, threshold = 500) {
  return remainingBalance <= threshold;
}
