import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChallengeService } from '../../services/challenge.service';
import { ChallengeResponse, ChallengeRequest } from '../../models/challenge.model';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.scss']
})
export class ChallengesComponent implements OnInit {
  challenges: ChallengeResponse[] = [];
  filteredChallenges: ChallengeResponse[] = [];
  activeFilter: string = 'ALL';
  loading = false;
  processing = false;

  // ── Stats ──────────────────────────────────────────────────────────
  get totalChallenges(): number { return this.challenges.length; }
  get activeChallenges(): number {
    const now = new Date();
    return this.challenges.filter(c => new Date(c.startDate) <= now && new Date(c.endDate) >= now).length;
  }
  get completedChallenges(): number {
    const now = new Date();
    return this.challenges.filter(c => new Date(c.endDate) < now).length;
  }

  // ── Challenge Form ─────────────────────────────────────────────────────
  showModal = false;
  isEditing = false;
  showDeleteConfirm = false;
  challengeToDelete: ChallengeResponse | null = null;
  form: ChallengeRequest = this.emptyForm();
  editingId?: number;

  constructor(private challengeService: ChallengeService) { }

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.challengeService.getMyChallenges().subscribe({
      next: (res) => {
        this.challenges = res;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading challenges', err);
        this.loading = false;
      }
    });
  }

  filterChallenges(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'ALL') {
      this.filteredChallenges = [...this.challenges];
    } else {
      this.filteredChallenges = this.challenges.filter(c => c.visibility === this.activeFilter);
    }
  }

  openModal(challenge?: ChallengeResponse): void {
    if (challenge) {
      this.isEditing = true;
      this.editingId = challenge.id;
      this.form = {
        title: challenge.title,
        description: challenge.description,
        startDate: challenge.startDate.split('T')[0],
        endDate: challenge.endDate.split('T')[0],
        visibility: challenge.visibility
      };
    } else {
      this.isEditing = false;
      this.form = this.emptyForm();
    }
    this.showModal = true;
  }

  save(): void {
    if (!this.form.title || !this.form.startDate || !this.form.endDate) return;

    const payload: ChallengeRequest = {
      ...this.form,
      startDate: new Date(this.form.startDate).toISOString(),
      endDate: new Date(this.form.endDate).toISOString()
    };

    this.processing = true;

    const obs = this.isEditing && this.editingId
      ? this.challengeService.update(this.editingId, payload)
      : this.challengeService.create(payload);

    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.processing = false;
        this.loadChallenges();
      },
      error: (err) => {
        console.error('Error saving challenge', err);
        this.processing = false;
      }
    });
  }

  confirmDelete(challenge: ChallengeResponse): void {
    this.challengeToDelete = challenge;
    this.showDeleteConfirm = true;
  }

  deleteChallenge(): void {
    if (!this.challengeToDelete) return;
    this.challengeService.delete(this.challengeToDelete.id).subscribe({
      next: () => {
        this.loadChallenges();
        this.showDeleteConfirm = false;
        this.challengeToDelete = null;
      },
      error: (err) => console.error('Error deleting challenge', err)
    });
  }

  private emptyForm(): ChallengeRequest {
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      visibility: 'PUBLIC'
    };
  }

  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }
}
