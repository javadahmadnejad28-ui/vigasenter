/**
 * Persian formatting helpers — digits, currency, dates (Jalali / Shamsi).
 * Pure, dependency-free. Uses native Intl with the Persian calendar.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert any string/number's Latin digits to Persian digits. */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]!);
}

/** Format a number with thousands separators AND Persian digits. */
export function faNumber(value: number | null | undefined, opts?: { decimals?: number }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "۰";
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: opts?.decimals ?? 0,
  }).format(value);
}

/** Format Toman currency: "۱٬۸۵۰٬۰۰۰ تومان". */
export function faToman(value: number | null | undefined): string {
  if (value === null || value === undefined) return "۰ تومان";
  return `${faNumber(value)} تومان`;
}

/** Compact currency for cards: "۱٫۸۵ م تومان". */
export function faTomanCompact(value: number): string {
  if (value >= 1_000_000_000) return `${faNumber(Math.round(value / 1_000_000_000), { decimals: 2 })} میلیارد تومان`;
  if (value >= 1_000_000) return `${faNumber(Math.round(value / 1_000_000), { decimals: 2 })} م تومان`;
  if (value >= 1_000) return `${faNumber(Math.round(value / 1_000))} ه‌ت`;
  return faToman(value);
}

/** Compact plain number: 12500 -> "۱۲٫۵ هزار". */
export function faCompact(value: number): string {
  if (value >= 1_000_000) return `${faNumber(Math.round(value / 1_000_000), { decimals: 2 })} م`;
  if (value >= 1_000) return `${faNumber(Math.round(value / 1_000), { decimals: 1 })} هزار`;
  return faNumber(value);
}

const PERSIAN_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export interface JalaliDate {
  year: number;   // 1405
  month: number;  // 1..12
  day: number;     // 1..31
  weekday: number; // 0..6 (0 = Yekshanbeh)
  weekdayName: string;
  monthName: string;
}

/** Convert a Date (Gregorian) to a Jalali (Shamsi) date object. */
export function toJalali(date: Date = new Date()): JalaliDate {
  // Use Intl with the Persian calendar to extract y/m/d reliably
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  // JS getDay: 0=Sunday. Persian week starts Saturday. Map so 0=Yekshanbeh Sunday.
  const jsDay = date.getDay();
  return {
    year,
    month,
    day,
    weekday: jsDay,
    weekdayName: PERSIAN_WEEKDAYS[jsDay]!,
    monthName: PERSIAN_MONTHS[month - 1]!,
  };
}

/** "شنبه ۱۲ آبان ۱۴۰۵" */
export function formatJalaliLong(date: Date = new Date()): string {
  const j = toJalali(date);
  return `${j.weekdayName} ${toPersianDigits(j.day)} ${j.monthName} ${toPersianDigits(j.year)}`;
}

/** "۱۴۰۵/۰۸/۱۲" */
export function formatJalaliShort(date: Date = new Date()): string {
  const j = toJalali(date);
  const mm = String(j.month).padStart(2, "0");
  const dd = String(j.day).padStart(2, "0");
  return toPersianDigits(`${j.year}/${mm}/${dd}`);
}

/** "۱۴۰۵/۰۸/۱۲ - ۱۴:۳۵" */
export function formatJalaliDateTime(date: Date = new Date()): string {
  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatJalaliShort(date)} - ${time}`;
}

/** Persian Jalali year (e.g. ۱۴۰۵) for invoice number prefix. */
export function jalaliYearFa(date: Date = new Date()): string {
  return toPersianDigits(toJalali(date).year);
}

/** Persian hour:minute "۱۴:۳۵". */
export function faClock(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Relative time: "۳ دقیقه پیش". */
export function faRelative(date: Date, now: Date = new Date()): string {
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "لحظاتی پیش";
  if (diff < 3600) return `${toPersianDigits(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toPersianDigits(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 604800) return `${toPersianDigits(Math.floor(diff / 86400))} روز پیش`;
  return formatJalaliShort(date);
}
