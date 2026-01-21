import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, ArrowUpDown } from 'lucide-angular';

@Component({
  selector: 'app-employee-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './employee-toolbar.component.html'
})
export class EmployeeToolbarComponent {
  searchText = model<string>('');
  showFilters = input.required<boolean>();
  activeFiltersCount = input<number>(0);

  search = output<string>();
  filtersToggle = output<void>();
  sortClick = output<void>();

  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ArrowUpDown = ArrowUpDown;

  onSearch(): void {
    this.search.emit(this.searchText());
  }

  onFiltersToggle(): void {
    this.filtersToggle.emit();
  }

  onSortClick(): void {
    this.sortClick.emit();
  }
}
