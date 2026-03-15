import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GroupResponse, GroupRequest } from '../models/group.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private apiUrl = `${environment.apiUrl}/api/admin/groups`;

  constructor(private http: HttpClient) { }

  getGroups(): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(this.apiUrl);
  }

  getGroupById(id: number): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/${id}`);
  }

  getGroupsByCoach(coachId: number): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(`${this.apiUrl}/coach/${coachId}`);
  }

  createGroup(group: GroupRequest): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(this.apiUrl, group);
  }

  updateGroup(id: number, group: GroupRequest): Observable<GroupResponse> {
    return this.http.put<GroupResponse>(`${this.apiUrl}/${id}`, group);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}