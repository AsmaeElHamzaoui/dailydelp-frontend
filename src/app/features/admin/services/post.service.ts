import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse, PostRequest } from '../models/post.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private apiUrl = `${environment.apiUrl}/api/admin/posts`; 

  constructor(private http: HttpClient) { }

  // Récupérer tous les posts
  getPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(this.apiUrl);
  }

  // Récupérer un post par ID
  getPostById(id: number): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour un post
  updatePost(id: number, post: PostRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, post);
  }

  // Supprimer un post
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}