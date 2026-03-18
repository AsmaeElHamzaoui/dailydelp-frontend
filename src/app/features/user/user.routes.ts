import { Routes } from '@angular/router';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { GroupComponent } from './components/group/group.component';
import { MesInscriptionsComponent } from './components/mesInscriptions/mes-inscriptions.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserDashboardComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'groups',
    component: GroupComponent
  },
  {
    path: 'mes-inscriptions',
    component: MesInscriptionsComponent
  }
];