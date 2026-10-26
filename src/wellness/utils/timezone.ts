/**
 * TIMEZONE & CALENDAR DRIP SCHEDULING UTILITIES (WIB / UTC+7)
 * -------------------------------------------------------------
 * Ensures that all 00:00 Morning Unlocks, 23:59 Nightly Cutoffs,
 * and Registration Deadlines strictly align with Western Indonesia Time (WIB / UTC+7),
 * regardless of whether the Node.js server runs in UTC (Docker/Vercel) or another locale.
 */

export const WIB_OFFSET_HOURS = 7;
export const WIB_OFFSET_MS = WIB_OFFSET_HOURS * 60 * 60 * 1000;

export interface WibCalendarDate {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  date: number;
}

/**
 * Returns the calendar year, month, and date in Western Indonesia Time (UTC+7).
 */
export function getWibCalendarDate(d: Date | string | number): WibCalendarDate {
  const utcDate = new Date(d);
  const wibTime = new Date(utcDate.getTime() + WIB_OFFSET_MS);
  return {
    year: wibTime.getUTCFullYear(),
    month: wibTime.getUTCMonth(),
    date: wibTime.getUTCDate(),
  };
}

/**
 * Computes exact unlock timestamp (00:00:00 WIB) and cutoff timestamp (23:59:59.999 WIB)
 * for a program day, strictly aligned to Western Indonesia Time (UTC+7).
 */
export function getProgramDayWibWindow(
  batchStartDate: Date | string,
  dayNumber: number,
  nowUtc: Date = new Date()
) {
  const { year, month, date } = getWibCalendarDate(batchStartDate);

  // Day 1 starts at 00:00:00 WIB on batchStartDate. Day N adds (dayNumber - 1) days.
  const unlockUtcMs =
    Date.UTC(year, month, date + (dayNumber - 1), 0, 0, 0, 0) - WIB_OFFSET_MS;
  const deadlineUtcMs =
    Date.UTC(year, month, date + (dayNumber - 1), 23, 59, 59, 999) - WIB_OFFSET_MS;

  const unlockDate = new Date(unlockUtcMs);
  const deadline2359 = new Date(deadlineUtcMs);

  const currentMs = nowUtc.getTime();
  const isCalendarUnlocked = currentMs >= unlockUtcMs;
  const isPast2359 = currentMs > deadlineUtcMs;

  return {
    unlockDate,
    deadline2359,
    isCalendarUnlocked,
    isPast2359,
  };
}

/**
 * Checks whether registration for a program has closed in WIB (cutoff at 23:59:59.999 WIB on deadline date).
 */
export function isRegistrationClosedInWib(
  registrationDeadline: Date | string,
  nowUtc: Date = new Date()
): boolean {
  const { year, month, date } = getWibCalendarDate(registrationDeadline);
  const deadlineUtcMs = Date.UTC(year, month, date, 23, 59, 59, 999) - WIB_OFFSET_MS;
  return nowUtc.getTime() > deadlineUtcMs;
}
