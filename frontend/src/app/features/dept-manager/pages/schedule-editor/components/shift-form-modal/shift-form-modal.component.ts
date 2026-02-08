import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftType } from '@core/models/schedule.model';

export interface ShiftFormData {
  date: string;
  shiftType: ShiftType;      // Loại ca: MORNING, AFTERNOON, EVENING, NIGHT
  startTime: string;
  endTime: string;
  
  // Part-time settings
  isPTEnabled: boolean;      // Cho phép PT đăng ký
  ptCapacity: number;        // Số lượng PT tối đa
  
  notes: string;
}

@Component({
  selector: 'app-shift-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shift-form-modal.component.html'
})
export class ShiftFormModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() formData: ShiftFormData = this.getDefaultFormData();
  @Input() availableDates: { value: string; label: string }[] = [];
  @Input() isEditMode: boolean = false;
  @Input() isSaving: boolean = false;
  
  @Output() save = new EventEmitter<ShiftFormData>();
  @Output() cancel = new EventEmitter<void>();

  // Expose ShiftType enum to template
  ShiftType = ShiftType;

  ngOnChanges(changes: SimpleChanges) {
    // Reset form when modal opens
    if (changes['isOpen'] && this.isOpen && !this.isEditMode) {
      this.formData = this.getDefaultFormData();
    }
  }

  onSave() {
    if (this.isFormValid()) {
      this.save.emit(this.formData);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  onShiftTypeChange(shiftType: ShiftType) {
    // Auto-suggest times based on shift type
    const timeSuggestions: Record<ShiftType, { start: string; end: string }> = {
      [ShiftType.MORNING]: { start: '06:00', end: '14:00' },
      [ShiftType.AFTERNOON]: { start: '14:00', end: '22:00' },
      [ShiftType.EVENING]: { start: '18:00', end: '23:00' },
      [ShiftType.NIGHT]: { start: '22:00', end: '06:00' }
    };
    
    const suggestion = timeSuggestions[shiftType];
    if (suggestion && !this.isEditMode) {
      this.formData.startTime = suggestion.start;
      this.formData.endTime = suggestion.end;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.date &&
      this.formData.startTime &&
      this.formData.endTime &&
      (!this.formData.isPTEnabled || this.formData.ptCapacity > 0)  // If PT enabled, must have capacity
    );
  }

  private getDefaultFormData(): ShiftFormData {
    return {
      date: '',
      shiftType: ShiftType.MORNING,
      startTime: '06:00',
      endTime: '14:00',
      isPTEnabled: true,
      ptCapacity: 5,
      notes: ''
    };
  }
}
