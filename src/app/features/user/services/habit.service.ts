import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  private api = `${environment.apiUrl}/api/habits`;

  constructor(private http: HttpClient) {}

  getHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(this.api);
  }

  getHabitById(id: number): Observable<Habit> {
    return this.http.get<Habit>(`${this.api}/${id}`);
  }

  createHabit(habit: Habit): Observable<Habit> {
    return this.http.post<Habit>(this.api, habit);
  }

  updateHabit(id: number, habit: Habit): Observable<Habit> {
    return this.http.put<Habit>(`${this.api}/${id}`, habit);
  }

  deleteHabit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}