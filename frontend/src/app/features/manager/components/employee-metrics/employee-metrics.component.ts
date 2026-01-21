import { Component, input } from '@angular/core';
import { LucideAngularModule, Users, UserCheck, BarChart3, Building2 } from 'lucide-angular';

export interface EmployeeMetrics {
  total: number;
  active: number;
  managers: number;
  departments: number;
}

@Component({
  selector: 'app-employee-metrics',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './employee-metrics.component.html'
})
export class EmployeeMetricsComponent {
  metrics = input.required<EmployeeMetrics>();

  // Icons
  readonly Users = Users;
  readonly UserCheck = UserCheck;
  readonly BarChart3 = BarChart3;
  readonly Building2 = Building2;
}
