import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeWorkloadDto } from '@core/models/dashboard.model';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-table.component.html',
})
export class EmployeeTableComponent {
  @Input() employees: EmployeeWorkloadDto[] = [];

  getAvatarColor(index: number): string {
    const colors = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4'];
    return colors[index % colors.length];
  }

  getInitials(fullName: string): string {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getLeaveStatus(employee: EmployeeWorkloadDto): string {
    return employee.isOverloaded ? 'leave-declined' : 'leave-approved';
  }
}
