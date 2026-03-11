import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GroupRequest {
  name:        string;
  description: string;
  coachId:     number;
  memberIds?:  number[];
}

export interface GroupResponse {
  id:           number;
  name:         string;
  description:  string;
  coachId:      number;
  coachName:    string;
  memberCount:  number;
  createdAt:    string;
}

@Injectable({ providedIn: 'root' })
export class AdminGroupService {

  private readonly base = `${environment.apiUrl}/api/admin/groups`;

  constructor(private http: HttpClient) {}
getGroups(): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(this.base);
  }

  getGroupById(id: number): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.base}/${id}`);
  }

  getGroupsByCoach(coachId: number): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(`${this.base}/coach/${coachId}`);
  }

  createGroup(data: GroupRequest): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(this.base, data);
  }

  updateGroup(id: number, data: GroupRequest): Observable<GroupResponse> {
    return this.http.put<GroupResponse>(`${this.base}/${id}`, data);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
  
}