import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Habit {
  id?: number;
  title: string;
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | string;
  type: 'HEALTH' | 'SPORT' | 'LEARNING' | 'MINDSET' | 'SOCIAL' | string;
  isPublic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {

  private api = `${environment.apiUrl}/api/user/habits`;

  constructor(private http: HttpClient) {}

  getHabits(): Observable<Habit[]> {
    console.log('[HabitService] GET all habits -> URL:', this.api);
    return this.http.get<Habit[]>(this.api).pipe(
      tap(habits => console.log('[HabitService] Habits received:', habits)),
      catchError(err => {
        console.error('[HabitService] Error getting habits:', err);
        return throwError(() => err);
      })
    );
  }

  getHabitById(id: number): Observable<Habit> {
    const url = `${this.api}/${id}`;
    console.log('[HabitService] GET habit by id -> URL:', url);
    return this.http.get<Habit>(url).pipe(
      tap(habit => console.log('[HabitService] Habit received:', habit)),
      catchError(err => {
        console.error('[HabitService] Error getting habit by id:', err);
        return throwError(() => err);
      })
    );
  }

  createHabit(habit: Habit): Observable<Habit> {
    console.log('[HabitService] POST create habit -> URL:', this.api, 'Payload:', habit);
    return this.http.post<Habit>(this.api, habit).pipe(
      tap(created => console.log('[HabitService] Habit created:', created)),
      catchError(err => {
        console.error('[HabitService] Error creating habit:', err);
        return throwError(() => err);
      })
    );
  }

  updateHabit(id: number, habit: Habit): Observable<Habit> {
    const url = `${this.api}/${id}`;
    console.log('[HabitService] PUT update habit -> URL:', url, 'Payload:', habit);
    return this.http.put<Habit>(url, habit).pipe(
      tap(updated => console.log('[HabitService] Habit updated:', updated)),
      catchError(err => {
        console.error('[HabitService] Error updating habit:', err);
        return throwError(() => err);
      })
    );
  }

  deleteHabit(id: number): Observable<void> {
    const url = `${this.api}/${id}`;
    console.log('[HabitService] DELETE habit -> URL:', url);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log('[HabitService] Habit deleted:', id)),
      catchError(err => {
        console.error('[HabitService] Error deleting habit:', err);
        return throwError(() => err);
      })
    );
  }
}