import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShiftTemplatesService } from '../../services/shift-templates.service';
import { ShiftTemplate } from '../../../../core/models/shift-template.model';
import { ShiftType } from '../../../../core/models/schedule.model';

@Component({
    selector: 'app-shift-templates',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Mẫu Ca Làm Việc (Shift Templates)
          </h1>
          <p class="text-gray-500 mt-1">Quản lý các mẫu ca để tạo lịch làm việc nhanh chóng</p>
        </div>
        <button (click)="openModal()" 
          class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium flex items-center gap-2">
          <span>+</span> Tạo Mẫu Ca
        </button>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th class="px-6 py-4 font-semibold">Tên ca / Mã</th>
                <th class="px-6 py-4 font-semibold">Thời gian</th>
                <th class="px-6 py-4 font-semibold">Loại ca</th>
                <th class="px-6 py-4 font-semibold text-center">Full-time</th>
                <th class="px-6 py-4 font-semibold text-center">Part-time</th>
                <th class="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr *ngFor="let t of templates" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900">{{ t.name }}</div>
                  <div class="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">{{ t.code }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-700">{{ t.startTime | date:'HH:mm':'UTC' }} - {{ t.endTime | date:'HH:mm':'UTC' }}</div>
                  <div class="text-xs text-gray-500">{{ t.totalHours }} giờ</div>
                </td>
                <td class="px-6 py-4">
                  <span [ngClass]="getShiftTypeBadge(t.shiftType)" class="px-2.5 py-1 rounded-full text-xs font-medium">
                    {{ t.shiftType }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span *ngIf="t.allowFullTime" class="text-green-500 font-bold">✓</span>
                  <span *ngIf="!t.allowFullTime" class="text-gray-300">-</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span *ngIf="t.allowPartTime" class="text-green-500 font-bold">✓</span>
                  <span *ngIf="!t.allowPartTime" class="text-gray-300">-</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button (click)="editTemplate(t)" class="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors mr-2">
                    Sửa
                  </button>
                  <button (click)="deleteTemplate(t.id)" class="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                    Xóa
                  </button>
                </td>
              </tr>
              <tr *ngIf="templates.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500 italic">
                  Chưa có mẫu ca nào. Hãy tạo mới!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 opacity-100">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">{{ isEditing ? 'Cập nhật mẫu ca' : 'Tạo mẫu ca mới' }}</h3>
            <button type="button" (click)="closeModal()" class="text-gray-400 hover:text-gray-500 transition-colors text-2xl leading-none">&times;</button>
          </div>
          
          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên ca</label>
                <input type="text" formControlName="name" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="VD: Ca sáng">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mã ca</label>
                <input type="text" formControlName="code" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase" placeholder="VD: MORNING_8_17">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Loại ca</label>
                <select formControlName="shiftType" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                  <option [value]="type" *ngFor="let type of shiftTypes">{{ type }}</option>
                </select>
              </div>
              <div>
                <!-- Spacer -->
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                <input type="time" formControlName="startTime" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                <input type="time" formControlName="endTime" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cấu hình áp dụng</label>
              <div class="flex gap-6 mt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="allowFullTime" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                  <span class="text-sm text-gray-700 user-select-none">Full-time</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="allowPartTime" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                  <span class="text-sm text-gray-700 user-select-none">Part-time</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả / Ghi chú</label>
              <textarea formControlName="description" rows="3" class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Mô tả thêm về ca làm việc..."></textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors">Hủy</button>
            <button type="submit" [disabled]="form.invalid || isLoading" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isLoading ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo mới') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: []
})
export class ShiftTemplatesComponent implements OnInit {
    templates: ShiftTemplate[] = [];
    isLoading = false;
    showModal = false;
    isEditing = false;
    editingId: string | null = null;

    shiftTypes = Object.values(ShiftType);

    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private templatesService: ShiftTemplatesService
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required],
            shiftType: [ShiftType.MORNING, Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            allowFullTime: [true],
            allowPartTime: [true],
            description: [''],
        });
    }

    ngOnInit() {
        this.loadTemplates();
    }

    loadTemplates() {
        this.templatesService.getTemplates({ isActive: true }).subscribe(data => {
            this.templates = data;
        });
    }

    openModal() {
        this.isEditing = false;
        this.editingId = null;
        this.form.reset({
            shiftType: ShiftType.MORNING,
            allowFullTime: true,
            allowPartTime: true
        });
        this.showModal = true;
    }

    editTemplate(template: ShiftTemplate) {
        this.isEditing = true;
        this.editingId = template.id;

        // Convert ISO to HH:mm for UTC based on Template storage expectation
        const formatTime = (isoString: string) => {
            const d = new Date(isoString);
            const hh = d.getUTCHours().toString().padStart(2, '0');
            const mm = d.getUTCMinutes().toString().padStart(2, '0');
            return `${hh}:${mm}`;
        };

        this.form.patchValue({
            name: template.name,
            code: template.code,
            shiftType: template.shiftType,
            startTime: formatTime(template.startTime),
            endTime: formatTime(template.endTime),
            allowFullTime: template.allowFullTime,
            allowPartTime: template.allowPartTime,
            description: template.description
        });
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.isLoading = true;
        const value = this.form.value;

        if (this.isEditing && this.editingId) {
            this.templatesService.updateTemplate(this.editingId, value).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.closeModal();
                    this.loadTemplates();
                },
                error: (err) => {
                    console.error(err);
                    this.isLoading = false;
                    alert('Có lỗi xảy ra: ' + (err.error?.message || err.message));
                }
            });
        } else {
            this.templatesService.createTemplate(value).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.closeModal();
                    this.loadTemplates();
                },
                error: (err) => {
                    console.error(err);
                    this.isLoading = false;
                    alert('Có lỗi xảy ra: ' + (err.error?.message || err.message));
                }
            });
        }
    }

    deleteTemplate(id: string) {
        if (!confirm('Bạn có chắc muốn xóa mẫu ca này?')) return;
        this.templatesService.deleteTemplate(id).subscribe(() => {
            this.loadTemplates();
        });
    }

    getShiftTypeBadge(type: string): string {
        switch (type) {
            case ShiftType.MORNING: return 'bg-yellow-100 text-yellow-700';
            case ShiftType.AFTERNOON: return 'bg-orange-100 text-orange-700';
            case ShiftType.EVENING: return 'bg-indigo-100 text-indigo-700';
            case ShiftType.NIGHT: return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
