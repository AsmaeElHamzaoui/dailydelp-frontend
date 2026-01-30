import { Role } from './role.enum';

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  role: Role;
  createdAt: string;
}