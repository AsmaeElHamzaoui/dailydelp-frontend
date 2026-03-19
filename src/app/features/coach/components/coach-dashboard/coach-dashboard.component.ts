import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../user/services/user.service';
import { PublicGroupService } from '../../../user/services/public-group.service';
import { ChallengeService } from '../../services/challenge.service';
import { CoachPostService } from '../../services/coach-post.service';
import { GroupResponse } from '../../../admin/models/group.model';
import { ChallengeResponse, ChallengeRequest } from '../../models/challenge.model';
import { PostResponse, PostRequest } from '../../../admin/models/post.model';
import { User } from '../../../../core/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.scss']
})
export class CoachDashboardComponent implements OnInit {

  // ── UI States ───────────────────────────────────────────────────────────
  activeSection = 'Dashboard';
  isSidebarCollapsed = false;
  loading = false;
  processing = false;

  // ── User Info ───────────────────────────────────────────────────────────
  currentUser: User | null = null;

  // ── Data ───────────────────────────────────────────────────────────────
  myGroups: GroupResponse[] = [];
  myChallenges: ChallengeResponse[] = [];
  myPosts: PostResponse[] = [];

  // ── Challenge Form ─────────────────────────────────────────────────────
  showChallengeModal = false;
  isEditingChallenge = false;
  challengeForm: ChallengeRequest = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    visibility: 'PUBLIC'
  };
  editingChallengeId?: number;

  // ── Post Form ──────────────────────────────────────────────────────────
  showPostModal = false;
  isEditingPost = false;
  postForm: PostRequest = {
    groupId: 0,
    content: '',
    image: ''
  };
  editingPostId?: number;

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

  // ── CHALLENGE ACTIONS ──────────────────────────────────────────────────
  openChallengeModal(challenge?: ChallengeResponse): void {
    if (challenge) {
      this.isEditingChallenge = true;
      this.editingChallengeId = challenge.id;
      this.challengeForm = {
        title: challenge.title,
        description: challenge.description,
        startDate: challenge.startDate.split('T')[0],
        endDate: challenge.endDate.split('T')[0],
        visibility: challenge.visibility
      };
    } else {
      this.isEditingChallenge = false;
      this.challengeForm = {
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        visibility: 'PUBLIC'
      };
    }
    this.showChallengeModal = true;
  }

  saveChallenge(): void {
    if (!this.challengeForm.title || !this.challengeForm.startDate || !this.challengeForm.endDate) return;

    this.processing = true;
    const obs = this.isEditingChallenge && this.editingChallengeId
      ? this.challengeService.update(this.editingChallengeId, this.challengeForm)
      : this.challengeService.create(this.challengeForm);

    obs.subscribe({
      next: () => {
        this.showChallengeModal = false;
        this.processing = false;
        if (this.currentUser) this.fetchAllData(this.currentUser.id);
      },
      error: (err) => {
        console.error('Error saving challenge', err);
        this.processing = false;
      }
    });
  }

  deleteChallenge(id: number): void {
    if (!confirm('Supprimer ce challenge ?')) return;
    this.challengeService.delete(id).subscribe(() => {
      if (this.currentUser) this.fetchAllData(this.currentUser.id);
    });
  }

  // ── POST ACTIONS ───────────────────────────────────────────────────────
  openPostModal(post?: PostResponse): void {
    if (post) {
      this.isEditingPost = true;
      this.editingPostId = post.id;
      this.postForm = {
        groupId: post.groupId || 0,
        content: post.content,
        image: post.image || ''
      };
    } else {
      this.isEditingPost = false;
      this.postForm = {
        groupId: this.myGroups.length > 0 ? this.myGroups[0].id : 0,
        content: '',
        image: ''
      };
    }
    this.showPostModal = true;
  }

  savePost(): void {
    if (!this.postForm.content || !this.postForm.groupId) return;

    this.processing = true;
    const obs = this.isEditingPost && this.editingPostId
      ? this.postService.update(this.editingPostId, this.postForm)
      : this.postService.create(this.postForm);

    obs.subscribe({
      next: () => {
        this.showPostModal = false;
        this.processing = false;
        if (this.currentUser) this.fetchAllData(this.currentUser.id);
      },
      error: (err) => {
        console.error('Error saving post', err);
        this.processing = false;
      }
    });
  }

  deletePost(id: number): void {
    if (!confirm('Supprimer cette publication ?')) return;
    this.postService.delete(id).subscribe(() => {
      if (this.currentUser) this.fetchAllData(this.currentUser.id);
    });
  }

  getGroupName(id: number | undefined): string {
    if (id === undefined) return 'Groupe inconnu';
    return this.myGroups.find(g => g.id === id)?.name || 'Groupe inconnu';
  }

  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }
}