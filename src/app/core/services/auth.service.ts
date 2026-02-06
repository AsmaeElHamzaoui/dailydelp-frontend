import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthRequest } from '../models/auth-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { UserRequest } from '../models/user-request.model';
import { User } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject pour suivre l'état de connexion
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$ : Observable<boolean>;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Initialiser le BehaviorSubject après l'injection du tokenService
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(
      this.tokenService.isLoggedIn()
    );
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  // ---------------------------
  // Inscription
  // ---------------------------
  register(userRequest: UserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userRequest);
  }

  // ---------------------------
  // Connexion
  // ---------------------------
  login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, authRequest)
      .pipe(
        tap(response => {
          // Sauvegarder le token et les infos utilisateur
          this.tokenService.saveToken(response.token);
          this.tokenService.saveUser(response.email, response.role);

          // Mettre à jour l'état d'authentification
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  // ---------------------------
  // Déconnexion
  // ---------------------------
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.clearAuthData();
      },
      error: () => {
        // Même en cas d'erreur, on déconnecte localement
        this.clearAuthData();
      }
    });
  }

  // Nettoyer les données d'authentification
  private clearAuthData(): void {
    this.tokenService.removeToken();
    this.tokenService.removeUser();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  // ---------------------------
  // Vérifier si l'utilisateur est connecté
  // ---------------------------
  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn() && !this.tokenService.isTokenExpired();
  }

  // ---------------------------
  // Récupérer le rôle de l'utilisateur
  // ---------------------------
  getUserRole(): string | null {
    const user = this.tokenService.getUser();
    return user ? user.role : null;
  }

  // ---------------------------
  // Récupérer l'email de l'utilisateur
  // ---------------------------
  getUserEmail(): string | null {
    const user = this.tokenService.getUser();
    return user ? user.email : null;
  }
}
