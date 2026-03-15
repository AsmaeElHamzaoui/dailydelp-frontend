import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InscriptionRequest, InscriptionResponse } from '../models/inscription.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {

  private apiUrl = `${environment.apiUrl}/api/inscriptions`;

  constructor(private http: HttpClient) {}

  getInscriptions(): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(this.apiUrl);
  }

  getInscriptionsByUser(userId: number): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  getInscriptionsByGroup(groupId: number): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.apiUrl}/group/${groupId}`);
  }

  createInscription(request: InscriptionRequest): Observable<InscriptionResponse> {
    return this.http.post<InscriptionResponse>(this.apiUrl, request);
  }

  acceptInscription(id: number): Observable<InscriptionResponse> {
    return this.http.put<InscriptionResponse>(`${this.apiUrl}/${id}/accept`, {});
  }

  refuseInscription(id: number): Observable<InscriptionResponse> {
    return this.http.put<InscriptionResponse>(`${this.apiUrl}/${id}/refuse`, {});
  }
}