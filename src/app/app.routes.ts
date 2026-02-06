import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { HomeComponent } from './features/pages/home.comonent';
export const routes: Routes = [
  // Redirection par défaut
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },

  // Routes d'authentification (publiques)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Routes USER (protégées par AuthGuard et RoleGuard)
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.routes').then(m => m.userRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['USER'] }
  },

  // Routes COACH (protégées par AuthGuard et RoleGuard)
  {
    path: 'coach',
    loadChildren: () => import('./features/coach/coach.routes').then(m => m.coachRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COACH'] }
  },

  // Routes ADMIN (protégées par AuthGuard et RoleGuard)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },

  // Page 404 - Not Found
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];