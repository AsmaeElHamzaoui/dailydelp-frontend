import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachPostService } from '../../services/coach-post.service';
import { PublicGroupService } from '../../../user/services/public-group.service';
import { PostResponse, PostRequest } from '../../../admin/models/post.model';
import { GroupResponse } from '../../../admin/models/group.model';

@Component({
  selector: 'app-postes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './postes.component.html',
  styleUrls: ['./postes.component.scss']
})
export class PostesComponent implements OnInit {
  @Input() coachId?: number;
  posts: PostResponse[] = [];
  groups: GroupResponse[] = [];
  loading = false;
  processing = false;

  // ── Post Form ──────────────────────────────────────────────────────────
  showModal = false;
  isEditing = false;
  form: PostRequest = {
    groupId: 0,
    content: '',
    image: ''
  };
  editingId?: number;

  constructor(
    private postService: CoachPostService,
    private groupService: PublicGroupService
  ) { }

  ngOnInit(): void {
    if (this.coachId) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.coachId) return;
    this.loading = true;

    // Load groups and posts
    this.groupService.getGroupsByCoach(this.coachId).subscribe(groups => {
      this.groups = groups;
      if (this.coachId) {
        this.postService.getByCoach(this.coachId).subscribe({
          next: (posts) => {
            this.posts = posts;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading posts', err);
            this.loading = false;
          }
        });
      }
    });
  }

  openModal(post?: PostResponse): void {
    if (post) {
      this.isEditing = true;
      this.editingId = post.id;
      this.form = {
        groupId: post.groupId || 0,
        content: post.content,
        image: post.image || ''
      };
    } else {
      this.isEditing = false;
      this.form = {
        groupId: this.groups.length > 0 ? this.groups[0].id : 0,
        content: '',
        image: ''
      };
    }
    this.showModal = true;
  }

  save(): void {
    if (!this.form.content || !this.form.groupId) return;

    this.processing = true;
    const obs = this.isEditing && this.editingId
      ? this.postService.update(this.editingId, this.form)
      : this.postService.create(this.form);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.processing = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Error saving post', err);
        this.processing = false;
      }
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette publication ?')) return;
    this.postService.delete(id).subscribe(() => {
      this.loadData();
    });
  }

  getGroupName(id: number | undefined): string {
    if (id === undefined) return 'Groupe inconnu';
    return this.groups.find(g => g.id === id)?.name || 'Groupe inconnu';
  }
}
