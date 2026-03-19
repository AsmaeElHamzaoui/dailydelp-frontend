import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChallengeRequest, ChallengeResponse } from '../models/challenge.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {

  private apiUrl = `${environment.apiUrl}/api/coach/challenges`;

  constructor(private http: HttpClient) { }

  create(request: ChallengeRequest): Observable<ChallengeResponse> {
    return this.http.post<ChallengeResponse>(this.apiUrl, request);
  }

  getMyChallenges(): Observable<ChallengeResponse[]> {
    return this.http.get<ChallengeResponse[]>(`${this.apiUrl}/my`);
  }

  getById(id: number): Observable<ChallengeResponse> {
    return this.http.get<ChallengeResponse>(`${this.apiUrl}/${id}`);
  }

  update(id: number, request: ChallengeRequest): Observable<ChallengeResponse> {
    return this.http.put<ChallengeResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
