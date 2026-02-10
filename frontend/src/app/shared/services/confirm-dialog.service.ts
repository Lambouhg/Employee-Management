import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
}

export interface ConfirmDialogData extends ConfirmDialogConfig {
  id: string;
  resultSubject: Subject<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogData = signal<ConfirmDialogData | null>(null);
  private idCounter = 0;

  readonly dialogData$ = this.dialogData.asReadonly();

  confirm(config: ConfirmDialogConfig): Observable<boolean> {
    const id = `confirm-${++this.idCounter}`;
    const resultSubject = new Subject<boolean>();

    const data: ConfirmDialogData = {
      ...config,
      id,
      confirmText: config.confirmText || 'Xác nhận',
      cancelText: config.cancelText || 'Hủy',
      type: config.type || 'primary',
      resultSubject
    };

    this.dialogData.set(data);

    return resultSubject.asObservable();
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc chắn muốn xóa ${itemName}? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    });
  }

  confirmAction(action: string, itemName?: string): Observable<boolean> {
    const message = itemName 
      ? `Bạn có chắc chắn muốn ${action} ${itemName}?`
      : `Bạn có chắc chắn muốn thực hiện hành động này?`;
      
    return this.confirm({
      title: 'Xác nhận',
      message,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      type: 'warning'
    });
  }

  respond(result: boolean): void {
    const current = this.dialogData();
    if (current) {
      current.resultSubject.next(result);
      current.resultSubject.complete();
      this.dialogData.set(null);
    }
  }

  close(): void {
    this.respond(false);
  }
}
