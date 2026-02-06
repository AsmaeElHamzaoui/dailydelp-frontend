import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Tableau de bord Utilisateur</h1>
      <p>Bienvenue {{ userEmail }}</p>
      <button (click)="logout()" class="btn-logout">Se déconnecter</button>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 40px;
      text-align: center;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .btn-logout {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      
      &:hover {
        background-color: #c82333;
      }
    }
  `]
})
export class UserDashboardComponent implements OnInit {
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getUserEmail() || '';
  }

  logout(): void {
    this.authService.logout();
  }
}