import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { UserService }  from '../../services/user.service';
import { GroupService } from '../../services/group.service';
import { PostService }  from '../../services/post.service';
import { User, Role }   from '../../models/user.model';
import { PostResponse } from '../../models/post.model';
import { GroupResponse } from '../../models/group.model';

Chart.register(...registerables);

interface KpiCard {
  label:    string;
  value:    number | string;
  sub:      string;
  icon:     string;
  colorCls: string;
  progress: number;
  trend?:   string;
  trendUp?: boolean;
}

interface RoleDistribution {
  label:    string;
  count:    number;
  pct:      number;
  colorCls: string;
}

// ✅ FIXED: key + label + posts tous présents
interface ActivityByMonth {
  key:   string;
  label: string;
  posts: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('roleChart')      roleChartRef!:      ElementRef;
  @ViewChild('activityChart')  activityChartRef!:  ElementRef;
  @ViewChild('groupSizeChart') groupSizeChartRef!: ElementRef;

  // ── Raw data ──────────────────────────────────────────────────────────────
  users:  User[]          = [];
  groups: GroupResponse[] = [];
  posts:  PostResponse[]  = [];

  // ── UI ────────────────────────────────────────────────────────────────────
  loading     = true;
  chartsReady = false;

  // ── Computed stats ────────────────────────────────────────────────────────
  kpis:              KpiCard[]          = [];
  roleDistribution:  RoleDistribution[] = [];
  activityByMonth:   ActivityByMonth[]  = [];
  topGroups: { name: string; memberCount: number; coachName: string; pct: number }[] = [];

  postsWithImage       = 0;
  postsTextOnly        = 0;
  avgPostLength        = 0;
  mostActiveCoach      = '—';
  mostActiveCoachPosts = 0;
  largestGroup         = '—';
  largestGroupSize     = 0;
  emptyGroupsCount     = 0;

  // ✅ FIXED: getter uniqueCoaches présent dans le composant
  get uniqueCoaches(): number {
    return new Set(
      this.posts
        .map(p => p.coach?.id ?? (p as any).coachId)
        .filter(id => id !== undefined && id !== null)
    ).size;
  }

  private charts: Chart[] = [];

  constructor(
    private userService:  UserService,
    private groupService: GroupService,
    private postService:  PostService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  // ── Load everything in parallel ───────────────────────────────────────────
  loadAll(): void {
    this.loading = true;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    forkJoin({
      users:  this.userService.getUsers(),
      groups: this.groupService.getGroups(),
      posts:  this.postService.getPosts()
    }).subscribe({
      next: ({ users, groups, posts }) => {
        this.users  = users;
        this.groups = groups;
        this.posts  = posts;
        this.computeStats();
        this.loading = false;
        setTimeout(() => this.buildCharts(), 80);
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Compute all derived statistics ────────────────────────────────────────
  private computeStats(): void {
    const totalUsers  = this.users.length;
    const totalGroups = this.groups.length;

    // --- Role counts ---
    const admins  = this.users.filter(u => u.role === Role.ADMIN || u.role === 'ADMIN').length;
    const coaches = this.users.filter(u => u.role === Role.COACH || u.role === 'COACH').length;
    const members = this.users.filter(u => u.role === Role.USER  || u.role === 'USER').length;

    // --- Group member counts ---
    const groupsWithCount = this.groups.map(g => ({
      ...g,
      memberCount: (g as any).memberIds?.length ?? g.members?.length ?? 0,
      coachName:   (g as any).coachName?.trim()
                   ?? g.coach?.displayName?.trim()
                   ?? `Coach #${(g as any).coachId ?? g.coach?.id}`
    }));

    const totalMembers   = groupsWithCount.reduce((s, g) => s + g.memberCount, 0);
    this.emptyGroupsCount = groupsWithCount.filter(g => g.memberCount === 0).length;

    const sorted = [...groupsWithCount].sort((a, b) => b.memberCount - a.memberCount);
    if (sorted.length) {
      this.largestGroup     = sorted[0].name;
      this.largestGroupSize = sorted[0].memberCount;
    }

    this.topGroups = sorted.slice(0, 5).map(g => ({
      name:        g.name,
      memberCount: g.memberCount,
      coachName:   g.coachName,
      pct: sorted[0].memberCount > 0
        ? Math.round((g.memberCount / sorted[0].memberCount) * 100)
        : 0
    }));

    // --- Posts stats ---
    this.postsWithImage = this.posts.filter(p => !!p.image).length;
    this.postsTextOnly  = this.posts.filter(p => !p.image).length;

    const lengths = this.posts.map(p => p.content?.length ?? 0);
    this.avgPostLength = lengths.length
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;

    // --- Most active coach ---
    const coachPostMap = new Map<string, number>();
    this.posts.forEach(p => {
      const name = p.coach?.displayName?.trim()
        || (p as any).coachName?.trim()
        || `Coach #${p.coach?.id ?? (p as any).coachId}`;
      coachPostMap.set(name, (coachPostMap.get(name) ?? 0) + 1);
    });
    if (coachPostMap.size) {
      const top = [...coachPostMap.entries()].sort((a, b) => b[1] - a[1])[0];
      this.mostActiveCoach      = top[0];
      this.mostActiveCoachPosts = top[1];
    }

    // ✅ FIXED: ActivityByMonth avec key + label + posts
    const now    = new Date();
    const months: ActivityByMonth[] = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        posts: 0
      };
    });

    this.posts.forEach(p => {
      const key  = p.createdAt?.slice(0, 7);
      const slot = months.find(m => m.key === key);
      if (slot) slot.posts++;
    });

    this.activityByMonth = months;

    // --- KPIs ---
    this.kpis = [
      {
        label:    'Utilisateurs',
        value:    totalUsers,
        sub:      `${admins} admin · ${coaches} coach · ${members} membre${members > 1 ? 's' : ''}`,
        icon:     'bi-people-fill',
        colorCls: 'kpi-blue',
        progress: Math.min(100, totalUsers),
        trend:    `${coaches} coachs`,
        trendUp:  coaches > 0
      },
      {
        label:    'Groupes',
        value:    totalGroups,
        sub:      `${this.emptyGroupsCount} vide${this.emptyGroupsCount > 1 ? 's' : ''} · ${totalGroups - this.emptyGroupsCount} actif${totalGroups - this.emptyGroupsCount > 1 ? 's' : ''}`,
        icon:     'bi-collection-fill',
        colorCls: 'kpi-green',
        progress: totalGroups > 0
          ? Math.round(((totalGroups - this.emptyGroupsCount) / totalGroups) * 100)
          : 0,
        trend:    `${totalGroups - this.emptyGroupsCount} actifs`,
        trendUp:  totalGroups - this.emptyGroupsCount > 0
      },
      {
        label:    'Publications',
        value:    this.posts.length,
        sub:      `${this.postsWithImage} avec image · ${this.postsTextOnly} texte`,
        icon:     'bi-file-richtext-fill',
        colorCls: 'kpi-amber',
        progress: this.posts.length > 0
          ? Math.min(100, Math.round((this.postsWithImage / this.posts.length) * 100))
          : 0,
        trend:    `${this.postsWithImage} médias`,
        trendUp:  this.postsWithImage > 0
      },
      {
        label:    'Membres / groupe',
        value:    totalGroups > 0 ? (totalMembers / totalGroups).toFixed(1) : '0',
        sub:      `${totalMembers} appartenances au total`,
        icon:     'bi-bar-chart-fill',
        colorCls: 'kpi-violet',
        progress: Math.min(100, totalGroups > 0
          ? Math.round((totalMembers / totalGroups) * 10)
          : 0),
        trend:    this.largestGroup ? `Max : ${this.largestGroupSize}` : '—',
        trendUp:  true
      }
    ];

    // --- Role distribution ---
    this.roleDistribution = [
      { label: 'Admins',  count: admins,  pct: totalUsers ? Math.round((admins  / totalUsers) * 100) : 0, colorCls: 'dist-violet' },
      { label: 'Coachs',  count: coaches, pct: totalUsers ? Math.round((coaches / totalUsers) * 100) : 0, colorCls: 'dist-amber'  },
      { label: 'Membres', count: members, pct: totalUsers ? Math.round((members / totalUsers) * 100) : 0, colorCls: 'dist-green'  }
    ];
  }

  // ── Build Chart.js charts ─────────────────────────────────────────────────
  private buildCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const C = {
      primary: '#1e3a2f',
      lt:      '#2e5c47',
      accent:  '#5aab80',
      violet:  '#7c3aed',
      amber:   '#b07d00',
      grid:    'rgba(30,58,47,.06)'
    };

    // 1. Role doughnut
    if (this.roleChartRef?.nativeElement) {
      this.charts.push(new Chart(this.roleChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Admins', 'Coachs', 'Membres'],
          datasets: [{
            data: [
              this.roleDistribution[0]?.count ?? 0,
              this.roleDistribution[1]?.count ?? 0,
              this.roleDistribution[2]?.count ?? 0
            ],
            backgroundColor: [C.violet, C.amber, C.accent],
            borderWidth: 0,
            hoverOffset: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, padding: 18, font: { family: 'DM Sans', size: 12 } }
            }
          }
        }
      }));
    }

    // 2. Activity bar chart
    if (this.activityChartRef?.nativeElement) {
      this.charts.push(new Chart(this.activityChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.activityByMonth.map(m => m.label),
          datasets: [{
            label: 'Publications',
            data:  this.activityByMonth.map(m => m.posts),
            backgroundColor: this.activityByMonth.map((_, i) =>
              i === this.activityByMonth.length - 1
                ? C.accent
                : 'rgba(90,171,128,.35)'
            ),
            borderRadius: 10,
            borderSkipped: false,
            barThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid:   { color: C.grid },
              border: { display: false },
              ticks:  { font: { family: 'DM Sans' }, color: '#6b8278', stepSize: 1 }
            },
            x: {
              grid:   { display: false },
              border: { display: false },
              ticks:  { font: { family: 'DM Sans' }, color: '#6b8278' }
            }
          }
        }
      }));
    }

    // 3. Group size horizontal bar
    if (this.groupSizeChartRef?.nativeElement) {
      const getCount = (g: GroupResponse) =>
        (g as any).memberIds?.length ?? g.members?.length ?? 0;

      const empty  = this.groups.filter(g => getCount(g) === 0).length;
      const small  = this.groups.filter(g => { const n = getCount(g); return n > 0 && n < 5; }).length;
      const medium = this.groups.filter(g => { const n = getCount(g); return n >= 5 && n < 10; }).length;
      const large  = this.groups.filter(g => getCount(g) >= 10).length;

      this.charts.push(new Chart(this.groupSizeChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Vides', 'Petits (<5)', 'Moyens (5-9)', 'Grands (10+)'],
          datasets: [{
            label: 'Groupes',
            data:  [empty, small, medium, large],
            backgroundColor: [
              'rgba(200,200,200,.6)',
              'rgba(90,171,128,.45)',
              C.accent,
              C.primary
            ],
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 32
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              beginAtZero: true,
              grid:   { color: C.grid },
              border: { display: false },
              ticks:  { font: { family: 'DM Sans' }, color: '#6b8278', stepSize: 1 }
            },
            y: {
              grid:   { display: false },
              border: { display: false },
              ticks:  { font: { family: 'DM Sans' }, color: '#6b8278' }
            }
          }
        }
      }));
    }

    this.chartsReady = true;
  }
}