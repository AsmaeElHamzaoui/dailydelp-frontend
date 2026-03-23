import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse } from '../../coach/models/post.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostUserService {
  private apiUrl = `${environment.apiUrl}/api/posts`;

  constructor(private http: HttpClient) { }

  getPostById(id: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
  }

  getAllPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(this.apiUrl);
  }

  getPostsByGroup(groupId: number): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/group/${groupId}`);
  }

  updatePost(id: number, content: string): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, { content });
  }
}
