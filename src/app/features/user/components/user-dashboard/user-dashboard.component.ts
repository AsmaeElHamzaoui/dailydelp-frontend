import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';
import { HabitComponent } from '../habit/habit.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, HabitComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {

  userEmail = '';
  userName  = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getUserEmail() || '';
    this.userName  = this.userEmail.split('@')[0];
  }

  logout(): void {
    this.authService.logout();
  }
}