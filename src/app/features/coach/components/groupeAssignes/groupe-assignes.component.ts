import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicGroupService } from '../../../user/services/public-group.service';
import { GroupResponse } from '../../../admin/models/group.model';
import { CoachPostService } from '../../services/coach-post.service';
import { UserService } from '../../../user/services/user.service';
import { InscriptionService } from '../../../admin/services/inscription.service';
import { FormsModule } from '@angular/forms';
import { PostRequest, PostResponse } from '../../../admin/models/post.model';
import { User } from '../../../admin/models/user.model';

@Component({
  selector: 'app-groupe-assignes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groupe-assignes.component.html',
  styleUrls: ['./groupe-assignes.component.scss']
})
export class GroupeAssignesComponent implements OnInit {
  @Input() coachId?: number;

  // -- State --
  groups: GroupResponse[] = [];
  posts: PostResponse[] = [];
  selectedGroup: GroupResponse | null = null;
  coachProfile: User | null = null;

  loading = false;
  loadingPosts = false;
  processing = false;
  isDetailView = false;

  // -- Form --
  quickPostContent = '';
  composerImage = '';

  constructor(
    private groupService: PublicGroupService,
    private postService: CoachPostService,
    private userService: UserService,
    private inscriptionService: InscriptionService
  ) { }

  ngOnInit(): void {
    this.loadCoachProfile();
    if (this.coachId) {
      this.loadGroups();
    }
  }

  // -- Data Loading --
  loadGroups(): void {
    if (!this.coachId) return;
    this.loading = true;
    this.groupService.getGroupsByCoach(this.coachId).subscribe({
      next: (res) => {
        this.groups = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading coach groups', err);
        this.loading = false;
      }
    });
  }

  loadCoachProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (user) => this.coachProfile = user as User,
      error: (err) => console.error('Error loading profile', err)
    });
  }

  loadPosts(groupId: number): void {
    this.loadingPosts = true;
    this.postService.getByGroup(groupId).subscribe({
      next: (res) => {
        // Sort by date descending
        this.posts = res.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loadingPosts = false;
      },
      error: (err: any) => {
        console.error('Error loading group posts', err);
        this.loadingPosts = false;
      }
    });
  }

  // -- UI Actions --
  showDetails(group: GroupResponse): void {
    this.loading = true;
    this.groupService.getGroupById(group.id).subscribe({
      next: (res) => {
        this.selectedGroup = res;
        this.isDetailView = true;
        this.loading = false;
        this.loadPosts(group.id);
        this.loadMembers(group.id);
      },
      error: (err: any) => {
        console.error('Error loading group details', err);
        this.loading = false;
      }
    });
  }

  loadMembers(groupId: number): void {
    this.inscriptionService.getByGroup(groupId).subscribe({
      next: (inscriptions) => {
        if (this.selectedGroup && this.selectedGroup.id === groupId) {
          // Temporarily show all members (ignoring status) to verify connectivity
          this.selectedGroup.members = inscriptions.map(ins => ({
            id: ins.userId,
            displayName: ins.userName,
            email: ''
          } as User));
        }
      },
      error: (err) => console.error('Error loading members', err)
    });
  }

  closeDetails(): void {
    this.isDetailView = false;
    this.selectedGroup = null;
    this.posts = [];
    this.resetForm();
  }

  createQuickPost(): void {
    if (!this.selectedGroup || !this.quickPostContent.trim() || !this.coachId) return;

    this.processing = true;
    const request: PostRequest = {
      content: this.quickPostContent,
      groupId: this.selectedGroup.id,
      image: this.composerImage || undefined
    };

    this.postService.create(request).subscribe({
      next: () => {
        alert('Post publié avec succès !');
        this.resetForm();
        this.loadPosts(this.selectedGroup!.id);
      },
      error: (err: any) => {
        console.error('Error creating post', err);
        this.processing = false;
      }
    });
  }

  public resetForm(): void {
    this.quickPostContent = '';
    this.composerImage = '';
    this.processing = false;
  }

  // -- Helpers (Senior Architecture) --
  trackById(index: number, item: any): number {
    return item.id;
  }

  getMemberInitials(member: User): string {
    if (!member.displayName) return 'U';
    return member.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
