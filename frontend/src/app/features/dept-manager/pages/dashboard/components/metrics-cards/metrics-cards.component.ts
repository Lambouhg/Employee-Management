import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverviewMetricsDto, WeeklyMetricsDto } from '../../../../../../core/models/dashboard.model';

@Component({
  selector: 'app-metrics-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-cards.component.html',
})
export class MetricsCardsComponent {
  @Input() overview!: OverviewMetricsDto;
  @Input() weekly!: WeeklyMetricsDto;

  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'PUBLISHED': return 'Đã xuất bản';
      case 'LOCKED': return 'Đã khóa';
      case 'NONE': return 'Chưa có lịch';
      default: return status;
    }
  }

  getPlanStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'text-yellow-600 bg-yellow-50';
      case 'PUBLISHED': return 'text-green-600 bg-green-50';
      case 'LOCKED': return 'text-gray-600 bg-gray-50';
      case 'NONE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
}
