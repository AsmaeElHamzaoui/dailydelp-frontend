import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../user/services/user.service';
import { PublicGroupService } from '../../../user/services/public-group.service';
import { ChallengeService } from '../../services/challenge.service';
import { CoachPostService } from '../../services/coach-post.service';
import { GroupResponse } from '../../../admin/models/group.model';
import { ChallengeResponse } from '../../models/challenge.model';
import { PostResponse } from '../../../admin/models/post.model';
import { User } from '../../../../core/models/user.model';
import { forkJoin } from 'rxjs';

// New Components
import { ChallengesComponent } from '../challenges/challenges.component';
import { PostesComponent } from '../postes/postes.component';
import { GroupeAssignesComponent } from '../groupeAssignes/groupe-assignes.component';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChallengesComponent, PostesComponent, GroupeAssignesComponent],
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.scss']
})
export class CoachDashboardComponent implements OnInit {

  // ── UI States ───────────────────────────────────────────────────────────
  activeSection = 'Dashboard';
  isSidebarCollapsed = false;
  loading = false;

  // ── User Info ───────────────────────────────────────────────────────────
  currentUser: User | null = null;

  // ── Data (For Statistics) ───────────────────────────────────────────────
  myGroups: GroupResponse[] = [];
  myChallenges: ChallengeResponse[] = [];
  myPosts: PostResponse[] = [];

  navItems = [
    { label: 'Dashboard', icon: 'grid_view' },
    { label: 'Groupes', icon: 'groups' },
    { label: 'Challenges', icon: 'emoji_events' },
    { label: 'Publications', icon: 'forum' }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private groupService: PublicGroupService,
    private challengeService: ChallengeService,
    private postService: CoachPostService
  ) { }

  ngOnInit(): void {
    this.loadCoachData();
  }

  loadCoachData(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.fetchAllData(user.id);
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.loading = false;
      }
    });
  }

  fetchAllData(coachId: number): void {
    forkJoin({
      groups: this.groupService.getGroupsByCoach(coachId),
      challenges: this.challengeService.getMyChallenges(),
      posts: this.postService.getByCoach(coachId)
    }).subscribe({
      next: (res) => {
        this.myGroups = res.groups;
        this.myChallenges = res.challenges;
        this.myPosts = res.posts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching coach data', err);
        this.loading = false;
      }
    });
  }

  setSection(section: string): void {
    this.activeSection = section;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }

  getGroupName(id: number | undefined): string {
    if (id === undefined) return 'Groupe inconnu';
    return this.myGroups.find(g => g.id === id)?.name || 'Groupe inconnu';
  }
}