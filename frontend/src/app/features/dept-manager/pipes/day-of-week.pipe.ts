import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe để chuyển đổi DayOfWeek enum sang tên tiếng Việt
 * Usage: {{ 'MONDAY' | dayOfWeek }} => 'Thứ 2'
 */
@Pipe({
  name: 'dayOfWeek',
  standalone: true
})
export class DayOfWeekPipe implements PipeTransform {
  private readonly dayNames: Record<string, string> = {
    'MONDAY': 'Thứ 2',
    'TUESDAY': 'Thứ 3',
    'WEDNESDAY': 'Thứ 4',
    'THURSDAY': 'Thứ 5',
    'FRIDAY': 'Thứ 6',
    'SATURDAY': 'Thứ 7',
    'SUNDAY': 'Chủ nhật'
  };

  private readonly shortDayNames: Record<string, string> = {
    'MONDAY': 'T2',
    'TUESDAY': 'T3',
    'WEDNESDAY': 'T4',
    'THURSDAY': 'T5',
    'FRIDAY': 'T6',
    'SATURDAY': 'T7',
    'SUNDAY': 'CN'
  };

  transform(value: string | null | undefined, format: 'short' | 'long' = 'long'): string {
    if (!value) return '';

    const names = format === 'short' ? this.shortDayNames : this.dayNames;
    return names[value] || value;
  }
}

/**
 * Pipe to convert number (1-7) to day name
 * Usage: {{ 1 | dayOfWeekNumber }} => 'Monday'
 */
@Pipe({
  name: 'dayOfWeekNumber',
  standalone: true
})
export class DayOfWeekNumberPipe implements PipeTransform {
  private readonly dayNames: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
  };

  private readonly shortDayNames: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun'
  };

  transform(value: number | null | undefined, format: 'short' | 'long' = 'long'): string {
    if(!value) return '';

    const names = format === 'short' ? this.shortDayNames : this.dayNames;
    return names[value] || '';
  }
}
