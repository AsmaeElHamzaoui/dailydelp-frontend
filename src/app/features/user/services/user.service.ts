import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { environment } from '../../../../environments/environment';

export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  timezone?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private api = `${environment.apiUrl}/api/membres`;

  constructor(private http: HttpClient) {}

  /** GET /api/membres (My Profile) */
  getMyProfile(): Observable<User> {
    return this.http.get<User>(this.api);
  }

  /** GET /api/membres/users (All Users) */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/users`);
  }

  /** PUT /api/membres */
  updateProfile(request: ProfileUpdateRequest): Observable<User> {
    return this.http.put<User>(this.api, request);
  }
}