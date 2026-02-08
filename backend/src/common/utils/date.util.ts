import { startOfWeek, addDays, format, parseISO } from 'date-fns';

/**
 * Get the start of the week (Monday) for a given date.
 */
export function getStartOfWeek(date: Date | string = new Date()): Date {
    const d = typeof date === 'string' ? parseISO(date) : date;
    // weekStartsOn: 1 means Monday
    return startOfWeek(d, { weekStartsOn: 1 });
}

/**
 * Returns an array of dates for the entire week starting from startDate.
 */
export function getDatesInWeek(startDate: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

/**
 * Formats a date to YYYY-MM-DD string.
 */
export function formatDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Get the day of the week as an uppercase string (MONDAY, etc.)
 */
export function getDayOfWeekName(date: Date): string {
    return format(date, 'EEEE').toUpperCase();
}

/**
 * Convert a DayOfWeek enum value to a number (1 = MONDAY, 7 = SUNDAY).
 */
export function dayOfWeekToNumber(day: string | null | undefined): number | null {
    if (!day) return null;

    const dayMap: Record<string, number> = {
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6,
        'SUNDAY': 7
    };

    return dayMap[day] ?? null;
}

/**
 * Get the DayOfWeek enum value from a date
 */
export function getDayOfWeekEnum(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE').toUpperCase(); // Returns: MONDAY, TUESDAY, etc.
}
