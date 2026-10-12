export function toISODate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const hindiMonths = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

const hindiWeekdays = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const englishMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const englishWeekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatIndianDate(isoDate: string, language: 'hi' | 'en' = 'en') {
  if (!isoDate || isoDate === '-') {
    return '-';
  }
  const parsed = parseISODate(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  const month =
    language === 'hi' ? hindiMonths[parsed.getMonth()] : englishMonths[parsed.getMonth()];
  return `${String(parsed.getDate()).padStart(2, '0')} ${month} ${parsed.getFullYear()}`;
}

export function formatLongDate(isoDate: string, language: 'hi' | 'en' = 'en') {
  if (!isoDate || isoDate === '-') {
    return '-';
  }
  const parsed = parseISODate(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  const weekday =
    language === 'hi' ? hindiWeekdays[parsed.getDay()] : englishWeekdays[parsed.getDay()];
  const month =
    language === 'hi' ? hindiMonths[parsed.getMonth()] : englishMonths[parsed.getMonth()];
  return `${weekday}, ${parsed.getDate()} ${month} ${parsed.getFullYear()}`;
}
