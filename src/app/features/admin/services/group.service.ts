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

  
}