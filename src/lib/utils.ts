import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  if (amount === 0) return '₦0 (HMO Covered)';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(
    'en-NG',
    options ?? {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return time24;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr || '00'} ${period}`;
}

export function addMinutesToTime(time24: string, minutesToAdd: number): string {
  const [hourStr, minuteStr] = time24.split(':');
  const totalMinutes = parseInt(hourStr, 10) * 60 + parseInt(minuteStr || '0', 10) + minutesToAdd;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  return name
    .replace(/^(Dr\.|Prof\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function generateReference(prefix: 'APT' | 'PAY' | 'HMO' | 'LAB' | 'RCP'): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `MCX-${prefix}-${randomDigits}`;
}

export const NIGERIAN_PHONE_REGEX = /^(\+234|234|0)(70|80|81|90|91)\d{8}$/;

export function isFutureOrTodayDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return target.getTime() >= today.getTime();
}
