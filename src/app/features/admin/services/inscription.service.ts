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

  constructor(private http: HttpClient) { }

  // GET ALL INSCRIPTIONS
  getAll(): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(this.apiUrl);
  }

  // GET INSCRIPTION BY ID (optionnel)
  getById(id: number): Observable<InscriptionResponse> {
    return this.http.get<InscriptionResponse>(`${this.apiUrl}/${id}`);
  }

  // GET INSCRIPTIONS BY USER
  getByUser(userId: number): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.apiUrl}/user/${userId}`);
  }

  // GET INSCRIPTIONS BY GROUP
  getByGroup(groupId: number): Observable<InscriptionResponse[]> {
    return this.http.get<InscriptionResponse[]>(`${this.apiUrl}/group/${groupId}`);
  }

  // CREATE INSCRIPTION
  create(request: InscriptionRequest): Observable<InscriptionResponse> {
    return this.http.post<InscriptionResponse>(this.apiUrl, request);
  }

  // ACCEPT INSCRIPTION
  accept(id: number): Observable<InscriptionResponse> {
    return this.http.put<InscriptionResponse>(`${this.apiUrl}/${id}/accept`, {});
  }

  // REFUSE INSCRIPTION
  refuse(id: number): Observable<InscriptionResponse> {
    return this.http.put<InscriptionResponse>(`${this.apiUrl}/${id}/refuse`, {});
  }
}