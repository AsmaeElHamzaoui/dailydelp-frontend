import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Habit, HabitService } from '../../services/habit.service';
import { CheckInService, CheckInResponseDTO, CheckInRequestDTO } from '../../services/check-in.service';

interface HabitWithMeta extends Habit {
  checkIn?: CheckInResponseDTO | null;
  checkInLoading?: boolean;
  streak?: number;
  weeklyProgress?: number; // 0–7
}

@Component({
  selector: 'app-habit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habit.component.html',
  styleUrls: ['./habit.component.scss']
})
export class HabitComponent implements OnInit {

  @Input() userEmail: string = '';

  // ── Data ────────────────────────────────────────────────────────────────────
  habits: HabitWithMeta[] = [];
  filteredHabits: HabitWithMeta[] = [];
  activeFilter: string = 'ALL';

  // ── UI states ───────────────────────────────────────────────────────────────
  loading = false;
  saving = false;

  showHabitModal = false;
  isEditing = false;

  showDeleteConfirm = false;
  habitToDelete: HabitWithMeta | null = null;

  showCheckInModal = false;
  selectedHabit: HabitWithMeta | null = null;

  // ── Forms ───────────────────────────────────────────────────────────────────
  habitForm: Habit = this.emptyHabit();
  formErrors = { title: false, type: false, frequency: false };

  checkInForm: CheckInRequestDTO = this.emptyCheckIn();
  checkInSaving = false;
  checkInDeleting = false;

  // ── Stats ───────────────────────────────────────────────────────────────────
  get totalHabits(): number { return this.habits.length; }

  get completedToday(): number {
    return this.habits.filter(h => h.checkIn?.status === true).length;
  }

  get completionRate(): number {
    if (!this.totalHabits) return 0;
    return Math.round((this.completedToday / this.totalHabits) * 100);
  }

  get longestStreak(): number {
    return Math.max(0, ...this.habits.map(h => h.streak ?? 0));
  }

  constructor(
    private habitService: HabitService,
    private checkInService: CheckInService
  ) {}

  ngOnInit(): void {
    this.loadHabits();
  }

  // ── Load ────────────────────────────────────────────────────────────────────

  loadHabits(): void {
    this.loading = true;
    this.habitService.getHabits().subscribe({
      next: (data) => {
        this.habits = data.map(h => ({
          ...h,
          checkIn: null,
          checkInLoading: false,
          streak: this.mockStreak(),
          weeklyProgress: this.mockWeeklyProgress()
        }));
        this.applyFilter();
        this.loadAllCheckIns();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadAllCheckIns(): void {
    this.habits.forEach(habit => {
      if (!habit.id) return;
      habit.checkInLoading = true;
      this.checkInService.getCheckInByHabit(habit.id).subscribe({
        next: (ci) => { habit.checkIn = ci; habit.checkInLoading = false; },
        error: () => { habit.checkIn = null; habit.checkInLoading = false; }
      });
    });
  }

  // ── Filter ──────────────────────────────────────────────────────────────────

  filterHabits(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredHabits = this.activeFilter === 'ALL'
      ? [...this.habits]
      : this.habits.filter(h => h.type === this.activeFilter);
  }

  // ── Habit Modal ─────────────────────────────────────────────────────────────

  openHabitModal(): void {
    this.isEditing = false;
    this.habitForm = this.emptyHabit();
    this.resetErrors();
    this.showHabitModal = true;
  }

  editHabit(habit: HabitWithMeta): void {
    this.isEditing = true;
    this.habitForm = { ...habit };
    this.resetErrors();
    this.showHabitModal = true;
  }

  closeHabitModal(): void { this.showHabitModal = false; }

  closeModalOnOverlay(event: MouseEvent, modal: 'habit' | 'checkin' | 'delete'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'habit') this.closeHabitModal();
      if (modal === 'checkin') this.closeCheckInModal();
      if (modal === 'delete') this.closeDeleteConfirm();
    }
  }

  saveHabit(): void {
    if (!this.validateForm()) return;
    this.saving = true;

    if (this.isEditing && this.habitForm.id !== undefined) {
      this.habitService.updateHabit(this.habitForm.id, this.habitForm).subscribe({
        next: (updated) => {
          const idx = this.habits.findIndex(h => h.id === updated.id);
          if (idx !== -1) {
            this.habits[idx] = { ...this.habits[idx], ...updated };
          }
          this.applyFilter();
          this.saving = false;
          this.closeHabitModal();
        },
        error: () => { this.saving = false; }
      });
    } else {
      this.habitService.createHabit(this.habitForm).subscribe({
        next: (created) => {
          this.habits.unshift({ ...created, checkIn: null, streak: 0, weeklyProgress: 0 });
          this.applyFilter();
          this.saving = false;
          this.closeHabitModal();
        },
        error: () => { this.saving = false; }
      });
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  confirmDelete(habit: HabitWithMeta): void {
    this.habitToDelete = habit;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.habitToDelete = null;
  }

  deleteHabit(): void {
    if (!this.habitToDelete?.id) return;
    this.habitService.deleteHabit(this.habitToDelete.id).subscribe({
      next: () => {
        this.habits = this.habits.filter(h => h.id !== this.habitToDelete!.id);
        this.applyFilter();
        this.closeDeleteConfirm();
      },
      error: () => { this.closeDeleteConfirm(); }
    });
  }

  // ── Check-In Modal ──────────────────────────────────────────────────────────

  openCheckInModal(habit: HabitWithMeta): void {
    this.selectedHabit = habit;
    if (habit.checkIn) {
      this.checkInForm = {
        date: habit.checkIn.date,
        status: habit.checkIn.status,
        note: habit.checkIn.note ?? ''
      };
    } else {
      this.checkInForm = this.emptyCheckIn();
    }
    this.showCheckInModal = true;
  }

  closeCheckInModal(): void {
    this.showCheckInModal = false;
    this.selectedHabit = null;
  }

  saveCheckIn(): void {
  if (!this.selectedHabit?.id) return;

  this.checkInSaving = true;

  const payload = {
    ...this.checkInForm,
    date: new Date(this.checkInForm.date).toISOString()
  };

  this.checkInService
    .createOrUpdateCheckIn(this.selectedHabit.id, payload)
    .subscribe({
      next: (ci) => {
        const h = this.habits.find(x => x.id === this.selectedHabit!.id);
        if (h) h.checkIn = ci;
        this.checkInSaving = false;
        this.closeCheckInModal();
      },
      error: () => {
        this.checkInSaving = false;
      }
    });
}

  deleteCheckIn(): void {
    if (!this.selectedHabit?.id) return;
    this.checkInDeleting = true;
    this.checkInService.deleteCheckIn(this.selectedHabit.id).subscribe({
      next: () => {
        const h = this.habits.find(x => x.id === this.selectedHabit!.id);
        if (h) h.checkIn = null;
        this.checkInDeleting = false;
        this.closeCheckInModal();
      },
      error: () => { this.checkInDeleting = false; }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getTypeConfig(type: string): { icon: string; label: string; cls: string } {
    const map: Record<string, { icon: string; label: string; cls: string }> = {
      SPORT:    { icon: 'bi-bicycle',     label: 'Sport',        cls: 'sport'    },
      WELLNESS: { icon: 'bi-heart-pulse', label: 'Bien-être',    cls: 'wellness' },
      CUSTOM:   { icon: 'bi-star',        label: 'Personnalisé', cls: 'custom'   },
      HEALTH:   { icon: 'bi-activity',    label: 'Santé',        cls: 'health'   },
      LEARNING: { icon: 'bi-book',        label: 'Apprentissage',cls: 'learning' },
      MINDSET:  { icon: 'bi-brain',       label: 'Mindset',      cls: 'mindset'  },
      SOCIAL:   { icon: 'bi-people',      label: 'Social',       cls: 'social'   },
    };
    return map[type] || { icon: 'bi-circle', label: type, cls: 'custom' };
  }

  getFrequencyLabel(freq: string): string {
    return { DAILY: 'Quotidienne', WEEKLY: 'Hebdomadaire', MONTHLY: 'Mensuelle' }[freq] ?? freq;
  }

  getFrequencyMax(freq: string): number {
    return { DAILY: 7, WEEKLY: 4, MONTHLY: 1 }[freq] ?? 7;
  }

  getStreakLabel(streak: number): string {
    if (streak >= 30) return '🏆';
    if (streak >= 10) return '🔥';
    if (streak >= 3)  return '⚡';
    return '';
  }

  getHeatmapCells(habit: HabitWithMeta): { active: boolean }[] {
    // Generates 30 mock cells; replace with real data when API supports it
    return Array.from({ length: 30 }, (_, i) => ({
      active: habit.checkIn?.status === true
        ? Math.random() > 0.35
        : Math.random() > 0.75
    }));
  }

  progressPercent(habit: HabitWithMeta): number {
    const max = this.getFrequencyMax(habit.frequency);
    return Math.round(((habit.weeklyProgress ?? 0) / max) * 100);
  }

  todayIso(): string {
    return new Date().toISOString();
  }

  private emptyHabit(): Habit {
    return { title: '', description: '', frequency: 'DAILY', type: 'CUSTOM', isPublic: false };
  }

  private emptyCheckIn(): CheckInRequestDTO {
    return { date: new Date().toISOString(), status: true, note: '' };
  }

  private validateForm(): boolean {
    this.resetErrors();
    let valid = true;
    if (!this.habitForm.title?.trim()) { this.formErrors.title = true; valid = false; }
    if (!this.habitForm.type)          { this.formErrors.type  = true; valid = false; }
    if (!this.habitForm.frequency)     { this.formErrors.frequency = true; valid = false; }
    return valid;
  }

  private resetErrors(): void {
    this.formErrors = { title: false, type: false, frequency: false };
  }

  // Temporary mock helpers – replace with real streak/progress API data
  private mockStreak(): number { return Math.floor(Math.random() * 21); }
  private mockWeeklyProgress(): number { return Math.floor(Math.random() * 8); }
}