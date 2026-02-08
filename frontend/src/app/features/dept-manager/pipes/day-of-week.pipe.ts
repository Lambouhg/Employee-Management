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
 * Pipe để chuyển đổi number (1-7) sang tên ngày
 * Usage: {{ 1 | dayOfWeekNumber }} => 'Thứ 2'
 */
@Pipe({
  name: 'dayOfWeekNumber',
  standalone: true
})
export class DayOfWeekNumberPipe implements PipeTransform {
  private readonly dayNames: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    7: 'Chủ nhật'
  };

  private readonly shortDayNames: Record<number, string> = {
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
    7: 'CN'
  };

  transform(value: number | null | undefined, format: 'short' | 'long' = 'long'): string {
    if(!value) return '';

    const names = format === 'short' ? this.shortDayNames : this.dayNames;
    return names[value] || '';
  }
}
