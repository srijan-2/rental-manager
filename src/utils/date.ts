export function toISODate(value: Date) {
  return value.toISOString().split('T')[0];
}

export function formatIndianDate(isoDate: string) {
  if (!isoDate || isoDate === '-') {
    return '-';
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
