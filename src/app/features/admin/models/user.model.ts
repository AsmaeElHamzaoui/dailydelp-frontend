export enum Role {
  USER = 'USER',
  COACH = 'COACH',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  role: Role | string;
  createdAt?: string;
  updatedAt?: string;
}
