import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DeptWeeklyPlan, CreateWeeklyPlanDto } from '@core/models/schedule.model';

@Injectable({
    providedIn: 'root'
})
export class DeptManagerPlansService {
    private http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/dept-manager/weekly-plans`;

    createWeeklyPlan(dto: CreateWeeklyPlanDto): Observable<DeptWeeklyPlan> {
        return this.http.post<DeptWeeklyPlan>(this.baseUrl, dto);
    }

    getWeeklyPlans(): Observable<DeptWeeklyPlan[]> {
        return this.http.get<DeptWeeklyPlan[]>(this.baseUrl);
    }

    publishPlan(id: string): Observable<DeptWeeklyPlan> {
        return this.http.patch<DeptWeeklyPlan>(`${this.baseUrl}/${id}/publish`, {});
    }

    updateOpenings(id: string, shiftOpenings: any[]): Observable<DeptWeeklyPlan> {
        return this.http.patch<DeptWeeklyPlan>(`${this.baseUrl}/${id}/openings`, { shiftOpenings });
    }

    lockPlan(id: string): Observable<DeptWeeklyPlan> {
        return this.http.patch<DeptWeeklyPlan>(`${this.baseUrl}/${id}/lock`, {});
    }
}
