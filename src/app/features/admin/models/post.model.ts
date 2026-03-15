import { User } from './user.model';
import { GroupResponse } from './group.model';

export interface PostResponse {
  id: number;

  // Objets imbriqués (si l'API les renvoie complets)
  group?: GroupResponse;
  coach?: User;

  // Champs plats (si l'API renvoie des IDs/noms séparés)
  groupId?: number;
  groupName?: string;
  coachId?: number;
  coachName?: string;

  content: string;
  image?: string;
  createdAt: string;
}

export interface PostRequest {
  groupId: number;
  content: string;
  image?: string;
}