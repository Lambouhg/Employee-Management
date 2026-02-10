import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe để hiển thị nhãn loại nhân viên
 * Usage: {{ 'FULL_TIME' | employmentType }} => 'Full-time'
 */
@Pipe({
  name: 'employmentType',
  standalone: true
})
export class EmploymentTypePipe implements PipeTransform {
  transform(value: 'FULL_TIME' | 'PART_TIME' | string | null | undefined): string {
    if (!value) return '';

    const labels: Record<string, string> = {
      'FULL_TIME': 'Full-time',
      'PART_TIME': 'Part-time'
    };

    return labels[value] || value;
  }
}

/**
 * Pipe để trả về class CSS cho loại nhân viên
 * Usage: <div [ngClass]="employee.employmentType | employmentTypeClass">
 */
@Pipe({
  name: 'employmentTypeClass',
  standalone: true
})
export class EmploymentTypeClassPipe implements PipeTransform {
  transform(value: 'FULL_TIME' | 'PART_TIME' | string | null | undefined): string {
    if (!value) return '';

    const classes: Record<string, string> = {
      'FULL_TIME': 'bg-green-100 text-green-700 border-green-300',
      'PART_TIME': 'bg-blue-100 text-blue-700 border-blue-300'
    };

    return classes[value] || '';
  }
}
