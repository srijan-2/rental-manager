import { formatINR, roundMoney } from '../utils/currency';
import { formatIndianDate } from '../utils/date';

type MessageLanguage = 'hi' | 'en';

type PaymentComponentKind = 'rent' | 'electricity';

interface BillInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  periodLabel: string;
  rentAmount: number;
  electricity: {
    previousReading: number;
    currentReading: number;
    unitsConsumed: number;
    ratePerUnit: number;
    amount: number;
  };
  rentPaid: boolean;
  electricityPaid: boolean;
  dueDate: string;
  today: string;
}

interface WelcomeInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  monthlyRent: number;
  moveInDate: string;
  billingStartDate: string;
  firstDueDate: string;
  electricityAdvance: number;
  securityDeposit: number;
  openingMeterReading: number;
}

interface ReceiptInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  periodLabel: string;
  covered: {
    kind: PaymentComponentKind;
    amount: number;
    paidDate: string;
    method: string;
  }[];
  outstanding: number;
  electricityRecorded: boolean;
}

interface ReminderInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  periodLabel: string;
  rentDue: number;
  electricityDue: number;
  outstanding: number;
  dueDate: string;
  today: string;
  overdue: boolean;
}

interface SettlementInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  moveOutDate: string;
  finalRent: number;
  finalElectricity: number;
  unpaidBillsAmount: number;
  deductionAmount: number;
  deductionNote?: string;
  advanceApplied: number;
  depositApplied: number;
  netAmount: number;
}

interface SettlementPaidInput {
  tenantName: string;
  buildingName: string;
  unitNumber: string;
  amount: number;
  direction: 'received' | 'refunded';
  paidDate: string;
  method: string;
}

function money(amount: number) {
  return Number.isInteger(amount)
    ? formatINR(amount)
    : formatINR(roundMoney(amount), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function methodLabel(method: string, language: MessageLanguage) {
  if (language === 'en') return method;
  return (
    (
      {
        Cash: 'नकद',
        'Bank Transfer': 'बैंक ट्रांसफर',
        UPI: 'UPI',
        Card: 'कार्ड',
      } as Record<string, string>
    )[method] ?? method
  );
}

export function buildBillMessage(input: BillInput, language: MessageLanguage) {
  const electricity = input.electricity;
  const total = input.rentAmount + electricity.amount;
  const paidSoFar =
    (input.rentPaid ? input.rentAmount : 0) + (input.electricityPaid ? electricity.amount : 0);
  const location = `${input.buildingName} · ${input.unitNumber}`;
  const dueDate = formatIndianDate(input.dueDate, language);
  const noPaid = paidSoFar === 0;
  const closing =
    input.dueDate >= input.today
      ? language === 'hi'
        ? `कृपया ${dueDate} तक भुगतान कर दें।`
        : `Please pay by ${dueDate}.`
      : language === 'hi'
        ? 'कृपया जल्द से जल्द भुगतान कर दें।'
        : 'Please pay at your earliest convenience.';

  if (language === 'hi') {
    return [
      `नमस्ते ${input.tenantName} जी,`,
      '',
      location,
      `बिल का महीना: ${input.periodLabel}`,
      '',
      `किराया: ${money(input.rentAmount)}`,
      `बिजली: ${electricity.unitsConsumed} यूनिट × ${money(electricity.ratePerUnit)} = ${money(electricity.amount)}`,
      `(मीटर रीडिंग ${electricity.previousReading} → ${electricity.currentReading})`,
      '────────────',
      `कुल बिल: ${money(total)}`,
      ...(noPaid
        ? [`कुल देना है: ${money(total)}`]
        : [`अब तक मिला: ${money(paidSoFar)}`, `अभी देना बाकी: ${money(total - paidSoFar)}`]),
      '',
      closing,
      'धन्यवाद 🙏',
    ].join('\n');
  }

  return [
    `Hello ${input.tenantName},`,
    '',
    location,
    `Billing period: ${input.periodLabel}`,
    '',
    `Rent: ${money(input.rentAmount)}`,
    `Electricity: ${electricity.unitsConsumed} units × ${money(electricity.ratePerUnit)} = ${money(electricity.amount)}`,
    `(Meter reading ${electricity.previousReading} → ${electricity.currentReading})`,
    '────────────',
    `Total bill: ${money(total)}`,
    ...(noPaid
      ? [`Amount due: ${money(total)}`]
      : [`Received so far: ${money(paidSoFar)}`, `Balance due: ${money(total - paidSoFar)}`]),
    '',
    closing,
    'Thank you 🙏',
  ].join('\n');
}

export function buildWelcomeMessage(input: WelcomeInput, language: MessageLanguage) {
  const location = `${input.buildingName} · ${input.unitNumber}`;
  const held = [
    input.electricityAdvance > 0
      ? `${language === 'hi' ? 'एडवांस (बिजली)' : 'Electricity advance'}: ${money(input.electricityAdvance)}`
      : '',
    input.securityDeposit > 0
      ? `${language === 'hi' ? 'सिक्योरिटी डिपॉज़िट' : 'Security deposit'}: ${money(input.securityDeposit)}`
      : '',
  ].filter(Boolean);
  const dates = {
    moveIn: formatIndianDate(input.moveInDate, language),
    billingStart: formatIndianDate(input.billingStartDate, language),
    firstDue: formatIndianDate(input.firstDueDate, language),
  };

  if (language === 'hi') {
    return [
      `नमस्ते ${input.tenantName} जी, आपका स्वागत है! 🏠`,
      '',
      location,
      `किराया: ${money(input.monthlyRent)} प्रति माह`,
      `आने की तारीख: ${dates.moveIn}`,
      `बिल का महीना: ${dates.billingStart} से शुरू (पहला बिल ${dates.firstDue} को)`,
      '',
      ...(held.length ? ['जमा राशि:', ...held] : []),
      `शुरुआती मीटर रीडिंग: ${input.openingMeterReading}`,
      '',
      'हर महीने रीडिंग लेकर किराया और बिजली का बिल इसी नंबर पर भेजा जाएगा। धन्यवाद 🙏',
    ].join('\n');
  }

  return [
    `Welcome, ${input.tenantName}! 🏠`,
    '',
    location,
    `Rent: ${money(input.monthlyRent)} per month`,
    `Move-in date: ${dates.moveIn}`,
    `Billing cycle starts ${dates.billingStart} (first bill on ${dates.firstDue})`,
    '',
    ...(held.length ? ['Amounts held:', ...held] : []),
    `Opening meter reading: ${input.openingMeterReading}`,
    '',
    'A bill with rent and electricity will be sent to this number every month. Thank you 🙏',
  ].join('\n');
}

export function buildReceiptMessage(input: ReceiptInput, language: MessageLanguage) {
  const receivedTotal = input.covered.reduce((sum, item) => sum + item.amount, 0);
  const location = `${input.buildingName} · ${input.unitNumber}`;
  const lines = input.covered.map((item) => {
    const label =
      item.kind === 'rent'
        ? language === 'hi'
          ? 'किराया'
          : 'Rent'
        : language === 'hi'
          ? 'बिजली'
          : 'Electricity';
    const detail = `(${formatIndianDate(item.paidDate, language)}, ${methodLabel(item.method, language)})`;
    return `${label}: ${money(item.amount)} ✔ ${detail}`;
  });
  const balanceLine =
    input.outstanding > 0
      ? language === 'hi'
        ? `अभी देना बाकी: ${money(input.outstanding)}`
        : `Balance due: ${money(input.outstanding)}`
      : input.electricityRecorded
        ? language === 'hi'
          ? 'पूरा भुगतान मिल गया ✔'
          : 'Fully paid ✔'
        : language === 'hi'
          ? 'बिजली का बिल रीडिंग के बाद भेजा जाएगा।'
          : 'The electricity bill will be sent after the meter reading.';

  if (language === 'hi') {
    return [
      `नमस्ते ${input.tenantName} जी,`,
      '',
      `${money(receivedTotal)} मिल गए। धन्यवाद 🙏`,
      '',
      location,
      `बिल का महीना: ${input.periodLabel}`,
      ...lines,
      balanceLine,
    ].join('\n');
  }
  return [
    `Hello ${input.tenantName},`,
    '',
    `${money(receivedTotal)} received. Thank you 🙏`,
    '',
    location,
    `Billing period: ${input.periodLabel}`,
    ...lines,
    balanceLine,
  ].join('\n');
}

export function buildReminderMessage(input: ReminderInput, language: MessageLanguage) {
  const location = `${input.buildingName} · ${input.unitNumber}`;
  const dueDate = formatIndianDate(input.dueDate, language);
  const parts = [
    ...(input.rentDue > 0
      ? [`${language === 'hi' ? 'किराया' : 'Rent'}: ${money(input.rentDue)}`]
      : []),
    ...(input.electricityDue > 0
      ? [`${language === 'hi' ? 'बिजली' : 'Electricity'}: ${money(input.electricityDue)}`]
      : []),
  ];
  if (language === 'hi') {
    return [
      `नमस्ते ${input.tenantName} जी,`,
      '',
      input.overdue
        ? `${location} का बिल (${input.periodLabel}) ${dueDate} को देना था और अभी तक बाकी है।`
        : `एक छोटी याद दिलाना: ${location} का बिल (${input.periodLabel}) बाकी है।`,
      '',
      ...parts,
      `अभी देना बाकी: ${money(input.outstanding)}`,
      '',
      input.overdue
        ? 'कृपया जल्द से जल्द भुगतान कर दें। कोई परेशानी हो तो बताइए। धन्यवाद 🙏'
        : `कृपया ${dueDate} तक भुगतान कर दें। धन्यवाद 🙏`,
    ].join('\n');
  }
  return [
    `Hello ${input.tenantName},`,
    '',
    input.overdue
      ? `The bill for ${location} (${input.periodLabel}) was due on ${dueDate} and is still pending.`
      : `A gentle reminder: the bill for ${location} (${input.periodLabel}) is pending.`,
    '',
    ...parts,
    `Balance due: ${money(input.outstanding)}`,
    '',
    input.overdue
      ? 'Please pay at your earliest convenience. If there is any problem, please tell us. Thank you 🙏'
      : `Please pay by ${dueDate}. Thank you 🙏`,
  ].join('\n');
}

export function buildSettlementMessage(input: SettlementInput, language: MessageLanguage) {
  const totalCharges =
    input.unpaidBillsAmount + input.finalRent + input.finalElectricity + input.deductionAmount;
  const totalCredits = input.advanceApplied + input.depositApplied;
  const charges = [
    ...(input.unpaidBillsAmount > 0
      ? [
          `${language === 'hi' ? 'पिछला बकाया' : 'Previous dues'}: ${money(input.unpaidBillsAmount)}`,
        ]
      : []),
    `${language === 'hi' ? 'आखिरी महीने का किराया' : 'Final month rent'}: ${money(input.finalRent)}`,
    `${language === 'hi' ? 'बिजली' : 'Electricity'}: ${money(input.finalElectricity)}`,
    ...(input.deductionAmount > 0
      ? [
          `${language === 'hi' ? `कटौती (${input.deductionNote ?? ''})` : `Deduction (${input.deductionNote ?? ''})`}: ${money(input.deductionAmount)}`,
        ]
      : []),
  ];
  const credits = [
    ...(input.advanceApplied > 0
      ? [`${language === 'hi' ? 'एडवांस' : 'Advance'}: − ${money(input.advanceApplied)}`]
      : []),
    ...(input.depositApplied > 0
      ? [
          `${language === 'hi' ? 'सिक्योरिटी डिपॉज़िट' : 'Security deposit'}: − ${money(input.depositApplied)}`,
        ]
      : []),
  ];
  const result =
    input.netAmount > 0
      ? language === 'hi'
        ? `आपको ${money(input.netAmount)} देना है।`
        : `You need to pay ${money(input.netAmount)}.`
      : input.netAmount < 0
        ? language === 'hi'
          ? `आपको ${money(Math.abs(input.netAmount))} वापस मिलेंगे।`
          : `You will get ${money(Math.abs(input.netAmount))} back.`
        : language === 'hi'
          ? 'कोई बकाया नहीं है।'
          : 'Nothing is due.';
  const title =
    language === 'hi'
      ? `${input.buildingName} · ${input.unitNumber} का हिसाब-किताब`
      : `Settlement for ${input.buildingName} · ${input.unitNumber}`;
  return [
    language === 'hi' ? `नमस्ते ${input.tenantName} जी,` : `Hello ${input.tenantName},`,
    '',
    title,
    `${language === 'hi' ? 'खाली करने की तारीख' : 'Move-out date'}: ${formatIndianDate(input.moveOutDate, language)}`,
    '',
    language === 'hi' ? 'देना बनता है:' : 'Charges:',
    ...charges,
    `${language === 'hi' ? 'कुल' : 'Total'}: ${money(totalCharges)}`,
    '',
    language === 'hi' ? 'पहले से जमा:' : 'Already held:',
    ...credits,
    `${language === 'hi' ? 'कुल' : 'Total'}: − ${money(totalCredits)}`,
    '────────────',
    result,
    'धन्यवाद 🙏',
  ].join('\n');
}

export function buildSettlementPaidMessage(input: SettlementPaidInput, language: MessageLanguage) {
  const date = formatIndianDate(input.paidDate, language);
  const method = methodLabel(input.method, language);
  const location = `${input.buildingName} · ${input.unitNumber}`;
  if (language === 'hi') {
    return input.direction === 'received'
      ? `नमस्ते ${input.tenantName} जी, हिसाब-किताब के ${money(input.amount)} आपसे मिल गए (${date}, ${method})। ${location} का हिसाब पूरा हुआ। धन्यवाद 🙏`
      : `नमस्ते ${input.tenantName} जी, आपके ${money(input.amount)} ${date} को ${method} से वापस कर दिए गए हैं। ${location} का हिसाब पूरा हुआ। धन्यवाद 🙏`;
  }
  return input.direction === 'received'
    ? `Hello ${input.tenantName}, we received ${money(input.amount)} for the settlement (${date}, ${method}). The settlement for ${location} is complete. Thank you 🙏`
    : `Hello ${input.tenantName}, ${money(input.amount)} was refunded to you on ${date} by ${method}. The settlement for ${location} is complete. Thank you 🙏`;
}
