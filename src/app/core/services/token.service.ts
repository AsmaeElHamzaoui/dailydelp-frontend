import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';

  // Sauvegarder le token
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Supprimer le token
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Sauvegarder les infos utilisateur
  saveUser(email: string, role: string): void {
    const userInfo = { email, role };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
  }

  // Récupérer les infos utilisateur
  getUser(): { email: string; role: string } | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Supprimer les infos utilisateur
  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  
}