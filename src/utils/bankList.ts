/**
 * Indian bank / IFSC lookup.
 *
 * A trimmed subset of the RBI IFSC code list is bundled so the app does not
 * depend on a third-party API being up. Codes are matched on the first 6
 * characters of the IFSC, which always identify the bank.
 */

interface BankEntry {
  code: string;
  name: string;
}

const BANKS: BankEntry[] = [
  { code: 'SBIN', name: 'State Bank of India' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICIC', name: 'ICICI Bank' },
  { code: 'AXIS', name: 'Axis Bank' },
  { code: 'PUNB', name: 'Punjab National Bank' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank' },
  { code: 'CNRB', name: 'Canara Bank' },
  { code: 'UBIN', name: 'Union Bank of India' },
  { code: 'BARB', name: 'Bank of Baroda' },
  { code: 'PNYB', name: 'Punjab & Sind Bank' },
  { code: 'BOI', name: 'Bank of India' },
  { code: 'CANR', name: 'Canara Bank' },
  { code: 'YESB', name: 'Yes Bank' },
  { code: 'IDIB', name: 'Indian Bank' },
  { code: 'IOBA', name: 'Indian Overseas Bank' },
  { code: 'UCBA', name: 'UCO Bank' },
  { code: 'CGBK', name: 'Central Bank of India' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank' },
  { code: 'CITI', name: 'Citibank' },
  { code: 'HSBC', name: 'HSBC Bank' },
  { code: 'SCB', name: 'Standard Chartered Bank' },
  { code: 'DBSS', name: 'Deutsche Bank' },
  { code: 'UTIB', name: 'Axis Bank' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'RBLB', name: 'RBL Bank' },
  { code: 'IDFC', name: 'IDFC First Bank' },
  { code: 'TMB', name: 'Tamilnad Mercantile Bank' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank' },
  { code: 'DBSB', name: 'DBS Bank' },
  { code: 'INDB', name: 'IndusInd Bank' },
  { code: 'BAND', name: 'Bandhan Bank' },
  { code: 'PAGB', name: 'Punjab Gramin Bank' },
  { code: 'UGBVB', name: 'Ujjain Gramin Bank' },
  { code: 'BARB', name: 'Bank of Baroda' },
  { code: 'CSBK', name: 'CSB Bank' },
  { code: 'KARN', name: 'Karnataka Bank' },
  { code: 'TGBR', name: 'Tamil Nadu Grama Bank' },
  { code: 'AGVB', name: 'Agra Gramin Bank' },
  { code: 'ORBC', name: 'Oriental Bank of Commerce' },
  { code: 'SYSC', name: 'SVC Co-operative Bank' },
  { code: 'JKB', name: 'Jammu & Kashmir Bank' },
  { code: 'SBIN', name: 'State Bank of India' },
  { code: 'NGB', name: 'Nagaland Bank' },
  { code: 'DEUT', name: 'Deutsche Bank' },
  { code: 'CITI', name: 'Citibank' },
  { code: 'BKID', name: 'Bank of India' },
  { code: 'VIJB', name: 'Vijaya Bank' },
  { code: 'ANDB', name: 'Andhra Bank' },
  { code: 'CORP', name: 'Corporation Bank' },
  { code: 'SYSC', name: 'SYC Bank' },
];

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Normalise an IFSC code (uppercase, no spaces). */
export function normaliseIfsc(raw: string): string {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Validate IFSC shape. */
export function isValidIfsc(raw: string): boolean {
  return IFSC_RE.test(normaliseIfsc(raw));
}

/** Look up the bank name from an IFSC code. Returns null when unknown. */
export function bankNameFromIfsc(raw: string): string | null {
  const code = normaliseIfsc(raw);
  if (!isValidIfsc(code)) return null;
  const prefix = code.slice(0, 4);
  const hit = BANKS.find((b) => b.code === prefix);
  return hit ? hit.name : null;
}

/** Full bank list for the dropdown. */
export function listBanks(): BankEntry[] {
  const seen = new Map<string, string>();
  BANKS.forEach((b) => {
    if (!seen.has(b.code)) seen.set(b.code, b.name);
  });
  return Array.from(seen.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}