import { Routes } from '@angular/router';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserDashboardComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  }
];