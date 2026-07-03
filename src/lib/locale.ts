import * as jalaali from 'jalaali-js';

/**
 * Converts English digits in a number or string to Persian numerals.
 */
export function formatPersianNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
}

/**
 * Formats a Gregorian date (Date object or string) into a Persian Jalali date string.
 * Example output: ۱۵ تیر ۱۴۰۵
 */
export function formatJalaliDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);

  const months = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];

  return `${formatPersianNumber(jd)} ${months[jm - 1]} ${formatPersianNumber(jy)}`;
}

/**
 * Helper to get the current date in YYYY-MM-DD format (local timezone).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
