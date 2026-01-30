export interface UserRequest {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
}