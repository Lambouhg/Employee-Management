import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShiftTemplate, CreateShiftTemplateDto, UpdateShiftTemplateDto } from '../../../core/models/shift-template.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ShiftTemplatesService {
    private apiUrl = `${environment.apiUrl}/dept-manager/shift-templates`;

    constructor(private http: HttpClient) { }

    getTemplates(filters?: { isActive?: boolean; shiftType?: string }): Observable<ShiftTemplate[]> {
        let params = new HttpParams();
        if (filters?.isActive !== undefined) {
            params = params.set('isActive', filters.isActive.toString());
        }
        if (filters?.shiftType) {
            params = params.set('shiftType', filters.shiftType);
        }
        return this.http.get<ShiftTemplate[]>(this.apiUrl, { params });
    }

    getTemplate(id: string): Observable<ShiftTemplate> {
        return this.http.get<ShiftTemplate>(`${this.apiUrl}/${id}`);
    }

    createTemplate(dto: CreateShiftTemplateDto): Observable<ShiftTemplate> {
        return this.http.post<ShiftTemplate>(this.apiUrl, dto);
    }

    updateTemplate(id: string, dto: UpdateShiftTemplateDto): Observable<ShiftTemplate> {
        return this.http.patch<ShiftTemplate>(`${this.apiUrl}/${id}`, dto);
    }

    deleteTemplate(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
