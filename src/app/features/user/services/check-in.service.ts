import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CheckInRequestDTO {
  date: string; // ISO string (Instant)
  status: boolean;
  note: string;
}

export interface CheckInResponseDTO {
  id: number;
  habitId: number;
  date: string;
  status: boolean;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {

  private api = (habitId: number) =>
    `${environment.apiUrl}/api/user/habits/${habitId}/checkin`;

  constructor(private http: HttpClient) {}

  createOrUpdateCheckIn(habitId: number, data: CheckInRequestDTO): Observable<CheckInResponseDTO> {
    return this.http.post<CheckInResponseDTO>(this.api(habitId), data);
  }

  getCheckInByHabit(habitId: number): Observable<CheckInResponseDTO> {
    return this.http.get<CheckInResponseDTO>(this.api(habitId));
  }

  deleteCheckIn(habitId: number): Observable<void> {
    return this.http.delete<void>(this.api(habitId));
  }
}