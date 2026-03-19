import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostRequest, PostResponse } from '../../admin/models/post.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoachPostService {

  private apiUrl = `${environment.apiUrl}/api/coach/posts`;

  constructor(private http: HttpClient) { }

  create(request: PostRequest): Observable<PostResponse> {
    return this.http.post<PostResponse>(this.apiUrl, request);
  }

  getById(id: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(this.apiUrl);
  }

  getByGroup(groupId: number): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/group/${groupId}`);
  }

  getByCoach(coachId: number): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/coach/${coachId}`);
  }

  update(id: number, request: PostRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
