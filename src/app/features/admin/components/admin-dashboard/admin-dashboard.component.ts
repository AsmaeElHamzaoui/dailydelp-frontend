import {
  Component, OnInit, AfterViewInit,
  ViewChild, ElementRef, signal, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { GroupComponent } from '../groupe/groupe.component';
import { PostComponent } from '../post/post.component';
import { UsersComponent } from '../users/users.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { InscriptionComponent } from '../inscription/inscription.component';
import { AuthService } from '../../../../core/services/auth.service';

import { UserService as ProfileService } from '../../../user/services/user.service';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { PostService } from '../../services/post.service';
import { InscriptionService } from '../../services/inscription.service';
import { Role, User } from '../../models/user.model';
import { PostResponse } from '../../models/post.model';
import { GroupResponse } from '../../models/group.model';
import { InscriptionResponse } from '../../models/inscription.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, GroupComponent, UsersComponent, PostComponent, AnalyticsComponent, InscriptionComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;

  isSidebarCollapsed = signal(false);
  isProfileOpen = signal(false);
  activeSection = signal('Dashboard');

  // ── UI loading ────────────────────────────────────────────────────────────
  dashboardLoading = true;

  // ── Raw data ──────────────────────────────────────────────────────────────
  private allUsers: User[] = [];
  private allGroups: GroupResponse[] = [];
  private allPosts: PostResponse[] = [];
  private allInscriptions: InscriptionResponse[] = [];

  // ── Dynamic stats cards ───────────────────────────────────────────────────
  stats: { label: string; value: string; icon: string; trend: string; isUp: boolean; progress: number }[] = [];

  // ── Dynamic recent users table ────────────────────────────────────────────
  recentUsers: { name: string; email: string; role: string; avatar: string }[] = [];

  // ── Charts instances ──────────────────────────────────────────────────────
  private charts: Chart[] = [];

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', active: true },
    { label: 'Users', icon: 'people', active: false },
    { label: 'Groups', icon: 'hub', active: false },
    { label: 'Posts', icon: 'article', active: false },
    { label: 'Inscriptions', icon: 'how_to_reg', active: false },
    { label: 'Analytics', icon: 'insights', active: false }
  ];
  /** utilisateur connecté */
  currentUser: User | null = null;

  constructor(
    private profileService: ProfileService,
    private userService: UserService,
    private groupService: GroupService,
    private postService: PostService,
    private inscriptionService: InscriptionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();

    this.loadDashboardData();
  }


  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }
  /** récupérer l'utilisateur connecté */
  loadCurrentUser(): void {
    this.profileService.getMyProfile().subscribe({

      next: (user) => {
        this.currentUser = user;
        console.log('Utilisateur connecté', this.currentUser);
      },
      error: (err) => {
        console.error('Erreur récupération profil', err);
      }
    });
  }

  // ── Load all data in parallel ─────────────────────────────────────────────
  loadDashboardData(): void {
    this.dashboardLoading = true;
    forkJoin({
      users: this.userService.getUsers(),
      groups: this.groupService.getGroups(),
      posts: this.postService.getPosts(),
      inscriptions: this.inscriptionService.getAll()
    }).subscribe({
      next: ({ users, groups, posts, inscriptions }) => {
        this.allUsers = users;
        this.allGroups = groups;
        this.allPosts = posts;
        this.allInscriptions = inscriptions;
        this.computeStats();
        this.computeRecentUsers();
        this.dashboardLoading = false;
        // Attendre que le DOM soit rendu avec les canvas
        setTimeout(() => {
          if (this.activeSection() === 'Dashboard') {
            this.initCharts();
          }
        }, 80);
      },
      error: () => {
        this.dashboardLoading = false;
      }
    });
  }

  // ── Compute KPI stats ─────────────────────────────────────────────────────
  private computeStats(): void {
    const totalUsers = this.allUsers.length;
    const totalGroups = this.allGroups.length;
    const totalPosts = this.allPosts.length;

    // Admins, coaches, members
    const admins = this.allUsers.filter(u => u.role === Role.ADMIN || u.role === 'ADMIN').length;
    const coaches = this.allUsers.filter(u => u.role === Role.COACH || u.role === 'COACH').length;
    const members = this.allUsers.filter(u => u.role === Role.USER || u.role === 'USER').length;

    // Active groups = groups with at least 1 member
    const activeGroups = this.allGroups.filter(g => {
      const count = (g as any).memberIds?.length ?? g.members?.length ?? 0;
      return count > 0;
    }).length;

    // Posts with image
    const postsWithImage = this.allPosts.filter(p => !!p.image).length;

    // Max for progress bar normalization
    const maxProgress = Math.max(totalUsers, 1);

    this.stats = [
      {
        label: 'Total Users',
        value: totalUsers.toLocaleString('fr-FR'),
        icon: 'group',
        trend: `${coaches} coach${coaches > 1 ? 's' : ''} · ${admins} admin${admins > 1 ? 's' : ''}`,
        isUp: totalUsers > 0,
        progress: Math.min(100, Math.round((totalUsers / maxProgress) * 100))
      },
      {
        label: 'Total Groups',
        value: totalGroups.toLocaleString('fr-FR'),
        icon: 'hub',
        trend: `${activeGroups} actif${activeGroups > 1 ? 's' : ''} sur ${totalGroups}`,
        isUp: activeGroups > 0,
        progress: totalGroups > 0 ? Math.round((activeGroups / totalGroups) * 100) : 0
      },
      {
        label: 'Total Posts',
        value: totalPosts.toLocaleString('fr-FR'),
        icon: 'article',
        trend: `${postsWithImage} avec image`,
        isUp: postsWithImage > 0,
        progress: totalPosts > 0 ? Math.round((postsWithImage / totalPosts) * 100) : 0
      },
      {
        label: 'Active Members',
        value: members.toLocaleString('fr-FR'),
        icon: 'bolt',
        trend: `${Math.round((members / Math.max(totalUsers, 1)) * 100)}% des utilisateurs`,
        isUp: members > 0,
        progress: totalUsers > 0 ? Math.round((members / totalUsers) * 100) : 0
      }
    ];
  }

  // ── Recent users for dashboard table (5 derniers par ID) ─────────────────
  private computeRecentUsers(): void {
    const getRoleLabel = (role: string) => {
      switch (role) {
        case Role.ADMIN: return 'Admin';
        case Role.COACH: return 'Coach';
        case Role.USER: return 'Member';
        default: return role;
      }
    };

    const getInitials = (user: User): string => {
      const name = user.displayName?.trim();
      if (name) {
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : parts[0].slice(0, 2).toUpperCase();
      }
      return (user.email ?? '??').slice(0, 2).toUpperCase();
    };

    this.recentUsers = [...this.allUsers]
      .sort((a, b) => b.id - a.id)   // les plus récents d'abord
      .slice(0, 5)
      .map(u => ({
        name: u.displayName?.trim() || u.email,
        email: u.email,
        role: getRoleLabel(u.role as string),
        avatar: getInitials(u)
      }));
  }

  // ── Charts dynamiques ─────────────────────────────────────────────────────
  private initCharts(): void {
    // Détruire les anciens avant de recréer
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const C = {
      primary: '#324C40',
      primaryLt: '#547D54',
      accent: '#9EAD84',
      accentSoft: 'rgba(232,239,224,0.5)',
      grid: 'rgba(0,0,0,0.05)'
    };

    const commonOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: C.grid }, border: { display: false } },
        x: { grid: { display: false }, border: { display: false } }
      }
    };

    // ── Line chart : inscriptions par mois (6 derniers mois) ──────────────
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
      };
    });

    // Compter les inscriptions par mois
    const dataByMonth = months.map(m => {
      return this.allInscriptions.filter(i => i.createdAt?.slice(0, 7) === m.key).length;
    });

    const hasRealData = dataByMonth.some(v => v > 0);
    const lineData = hasRealData
      ? dataByMonth
      : [0, 0, 0, 0, 0, this.allInscriptions.length]; // fallback si pas de dates

    if (this.lineChartRef?.nativeElement) {
      this.charts.push(new Chart(this.lineChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: months.map(m => m.label),
          datasets: [{
            label: 'Inscriptions',
            data: lineData,
            borderColor: C.primary,
            backgroundColor: 'rgba(50,76,64,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#ffffff'
          }]
        },
        options: commonOptions
      }));
    }

    // ── Bar chart : posts par mois (6 derniers mois) ──────────────────────
    const postsByMonth = months.map(m =>
      this.allPosts.filter(p => p.createdAt?.slice(0, 7) === m.key).length
    );

    const hasRealPostDates = postsByMonth.some(v => v > 0);
    const barData = hasRealPostDates
      ? postsByMonth
      : [0, 0, 0, 0, 0, this.allPosts.length];

    if (this.barChartRef?.nativeElement) {
      this.charts.push(new Chart(this.barChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: months.map(m => m.label),
          datasets: [{
            label: 'Posts',
            data: barData,
            backgroundColor: C.primaryLt,
            borderRadius: 8,
            barThickness: 20
          }]
        },
        options: commonOptions
      }));
    }

    // ── Doughnut chart : répartition des rôles (données réelles) ─────────
    const admins = this.allUsers.filter(u => u.role === Role.ADMIN || u.role === 'ADMIN').length;
    const coaches = this.allUsers.filter(u => u.role === Role.COACH || u.role === 'COACH').length;
    const members = this.allUsers.filter(u => u.role === Role.USER || u.role === 'USER').length;

    if (this.pieChartRef?.nativeElement) {
      this.charts.push(new Chart(this.pieChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Admin', 'Coach', 'Member'],
          datasets: [{
            data: [admins, coaches, members],
            backgroundColor: [C.primary, C.primaryLt, C.accent],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, padding: 20 }
            }
          }
        }
      }));
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  toggleProfile(): void {
    this.isProfileOpen.set(!this.isProfileOpen());
  }

  navigateTo(item: any): void {
    this.navItems.forEach(n => n.active = false);
    item.active = true;
    this.activeSection.set(item.label);

    if (item.label === 'Dashboard') {
      setTimeout(() => this.initCharts(), 80);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}