import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Set loading state for a specific key
   */
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({
      ...currentState,
      [key]: loading
    });
  }

  /**
   * Get loading state for a specific key
   */
  isLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(state[key] || false);
      });
    });
  }

  /**
   * Check if any loading is in progress
   */
  isAnyLoading(): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(Object.values(state).some(loading => loading));
      });
    });
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingSubject.next({});
  }

  /**
   * Helper method to wrap an observable with loading state
   */
  withLoading<T>(key: string, observable: Observable<T>): Observable<T> {
    return new Observable(observer => {
      this.setLoading(key, true);
      
      const subscription = observable.subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          this.setLoading(key, false);
          observer.error(error);
        },
        complete: () => {
          this.setLoading(key, false);
          observer.complete();
        }
      });

      return () => subscription.unsubscribe();
    });
  }
}
