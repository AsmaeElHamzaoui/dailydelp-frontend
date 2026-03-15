import { User } from './user.model';

export interface GroupResponse {
  id: number;
  name: string;
  description?: string;
  // Champs réels renvoyés par l'API
  coachId: number;
  coachName: string;
  memberIds: number[];
  createdAt?: string;
  updatedAt?: string;
  // Champs enrichis côté frontend (optionnels)
  coach?: User;
  members?: User[];
}

export interface GroupRequest {
  name: string;
  description?: string;
  coachId: number;
  memberIds: number[];
}