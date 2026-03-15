import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { GroupResponse, GroupRequest } from '../../models/group.model';
import { User, Role } from '../../models/user.model';

interface GroupWithMeta extends GroupResponse {
  memberCount?: number;
  colorIndex?: number;
}

interface GroupFormModel {
  id?: number;
  name: string;
  description?: string;
  coachId: number | undefined;
  memberIds: number[];
}

@Component({
  selector: 'app-groupe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groupe.component.html',
  styleUrls: ['./groupe.component.scss']
})
export class GroupComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  groups: GroupWithMeta[] = [];
  filteredGroups: GroupWithMeta[] = [];
  allUsers: User[] = [];
  coaches: User[] = [];
  members: User[] = [];
  activeFilter: string = 'ALL';

  // ── UI states ─────────────────────────────────────────────────────────────
  loading = false;
  saving = false;
  deleting = false;
  showGroupModal = false;
  isEditing = false;
  showDeleteConfirm = false;
  groupToDelete: GroupWithMeta | null = null;

  // ── Forms ─────────────────────────────────────────────────────────────────
  groupForm: GroupFormModel = this.emptyGroup();
  selectedMemberIds: number[] = [];
  formErrors = { name: false, coachId: false };

  // ── Color palette ─────────────────────────────────────────────────────────
  private colorPalette = [
    'indigo', 'teal', 'rose', 'amber', 'sky', 'violet', 'emerald', 'orange'
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalGroups(): number {
    return this.groups.length;
  }

  get totalMembers(): number {
    const ids = new Set<number>();
    this.groups.forEach(g => (g.members ?? []).forEach(m => ids.add(m.id)));
    return ids.size;
  }

  get totalCoaches(): number {
    return new Set(
      this.groups.map(g => g.coachId).filter(id => id !== undefined)
    ).size;
  }

  get avgMembersPerGroup(): number {
    if (!this.totalGroups) return 0;
    return Math.round(
      this.groups.reduce((s, g) => s + (g.members?.length ?? 0), 0) / this.totalGroups
    );
  }

  constructor(
    private groupService: GroupService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.coaches = users.filter(u => u.role === Role.COACH || u.role === 'COACH');
        this.members = users.filter(u => u.role === Role.USER || u.role === 'USER');
        this.loadGroups();
      },
      error: () => {
        this.loadGroups();
      }
    });
  }

  loadGroups(): void {
    this.loading = true;
    this.groupService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.map((g, i) => this.enrichGroup(g, i % this.colorPalette.length));
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Enrichit un GroupResponse brut (avec coachId/coachName/memberIds)
   * en résolvant coach et members depuis allUsers.
   */
  private enrichGroup(g: GroupResponse, colorIndex: number): GroupWithMeta {
    // Résoudre le coach : d'abord dans allUsers, sinon fallback sur coachName
    const coach: User = this.allUsers.find(u => u.id === g.coachId)
      ?? ({ id: g.coachId, displayName: g.coachName, email: '' } as User);

    // Résoudre les membres depuis memberIds
    const members: User[] = (g.memberIds ?? []).map(id =>
      this.allUsers.find(u => u.id === id)
      ?? ({ id, displayName: `Membre #${id}`, email: '' } as User)
    );

    return {
      ...g,
      coach,
      members,
      memberCount: members.length,
      colorIndex
    };
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  filterGroups(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'ALL') {
      this.filteredGroups = [...this.groups];
    } else if (this.activeFilter === 'LARGE') {
      this.filteredGroups = this.groups.filter(g => (g.members?.length ?? 0) >= 5);
    } else if (this.activeFilter === 'SMALL') {
      this.filteredGroups = this.groups.filter(
        g => (g.members?.length ?? 0) > 0 && (g.members?.length ?? 0) < 5
      );
    } else if (this.activeFilter === 'EMPTY') {
      this.filteredGroups = this.groups.filter(g => (g.members?.length ?? 0) === 0);
    } else {
      this.filteredGroups = [...this.groups];
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openGroupModal(): void {
    this.isEditing = false;
    this.groupForm = this.emptyGroup();
    this.selectedMemberIds = [];
    this.resetErrors();
    this.showGroupModal = true;
  }

  editGroup(group: GroupWithMeta): void {
    this.isEditing = true;
    this.groupForm = {
      id: group.id,
      name: group.name,
      description: group.description ?? '',
      coachId: group.coachId,
      memberIds: [...(group.memberIds ?? [])]
    };
    this.selectedMemberIds = [...(group.memberIds ?? [])];
    this.resetErrors();
    this.showGroupModal = true;
  }

  closeGroupModal(): void {
    this.showGroupModal = false;
  }

  closeModalOnOverlay(event: MouseEvent, modal: 'group' | 'delete'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (modal === 'group') this.closeGroupModal();
      if (modal === 'delete') this.closeDeleteConfirm();
    }
  }

  // ── Toggle member ─────────────────────────────────────────────────────────
  toggleMember(userId: number): void {
    const idx = this.selectedMemberIds.indexOf(userId);
    if (idx === -1) {
      this.selectedMemberIds.push(userId);
    } else {
      this.selectedMemberIds.splice(idx, 1);
    }
  }

  isMemberSelected(userId: number): boolean {
    return this.selectedMemberIds.includes(userId);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveGroup(): void {
    if (!this.validateForm()) return;
    this.saving = true;

    const payload: GroupRequest = {
      name: this.groupForm.name,
      description: this.groupForm.description,
      coachId: this.groupForm.coachId!,
      memberIds: [...this.selectedMemberIds]
    };

    if (this.isEditing) {
      const id = this.groupForm.id;
      if (!id) { this.saving = false; return; }

      this.groupService.updateGroup(id, payload).subscribe({
        next: (updated) => {
          const idx = this.groups.findIndex(g => g.id === updated.id);
          if (idx !== -1) {
            const colorIndex = this.groups[idx].colorIndex ?? 0;
            this.groups[idx] = this.enrichGroup(updated, colorIndex);
          }
          this.applyFilter();
          this.saving = false;
          this.closeGroupModal();
        },
        error: () => { this.saving = false; }
      });

    } else {
      this.groupService.createGroup(payload).subscribe({
        next: (created) => {
          const colorIndex = this.groups.length % this.colorPalette.length;
          this.groups.unshift(this.enrichGroup(created, colorIndex));
          this.applyFilter();
          this.saving = false;
          this.closeGroupModal();
        },
        error: () => { this.saving = false; }
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(group: GroupWithMeta): void {
    this.groupToDelete = group;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.groupToDelete = null;
  }

  deleteGroup(): void {
    if (!this.groupToDelete?.id) return;
    this.deleting = true;
    this.groupService.deleteGroup(this.groupToDelete.id).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.id !== this.groupToDelete!.id);
        this.applyFilter();
        this.deleting = false;
        this.closeDeleteConfirm();
      },
      error: () => {
        this.deleting = false;
        this.closeDeleteConfirm();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getGroupColor(group: GroupWithMeta): string {
    return this.colorPalette[group.colorIndex ?? 0];
  }

  getCoachName(group: GroupWithMeta): string {
    if (!group.coach) {
      // Fallback direct sur coachName de l'API
      return group.coachName?.trim() || `Coach #${group.coachId}` || 'Non assigné';
    }
    return group.coach.displayName?.trim() || group.coach.email || `Coach #${group.coachId}`;
  }

  getMembersPreview(group: GroupWithMeta): User[] {
    return (group.members ?? []).slice(0, 4);
  }

  getMembersOverflow(group: GroupWithMeta): number {
    return Math.max(0, (group.members?.length ?? 0) - 4);
  }

  getMemberDisplayName(user: User): string {
    if (!user) return '?';
    return user.displayName?.trim() || user.email || `#${user.id}`;
  }

  getInitials(user: User | undefined): string {
    if (!user) return '?';
    const name = user.displayName?.trim();
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return (user.email ?? '??').slice(0, 2).toUpperCase();
  }

  getSizeLabel(group: GroupWithMeta): string {
    const n = group.members?.length ?? 0;
    if (n === 0) return 'Vide';
    if (n < 5) return 'Petit';
    if (n < 10) return 'Moyen';
    return 'Grand';
  }

  getSizeCls(group: GroupWithMeta): string {
    const n = group.members?.length ?? 0;
    if (n === 0) return 'size-empty';
    if (n < 5) return 'size-small';
    if (n < 10) return 'size-medium';
    return 'size-large';
  }

  private emptyGroup(): GroupFormModel {
    return { id: undefined, name: '', description: '', coachId: undefined, memberIds: [] };
  }

  private validateForm(): boolean {
    this.resetErrors();
    let valid = true;
    if (!this.groupForm.name?.trim()) { this.formErrors.name = true; valid = false; }
    if (!this.groupForm.coachId) { this.formErrors.coachId = true; valid = false; }
    return valid;
  }

  private resetErrors(): void {
    this.formErrors = { name: false, coachId: false };
  }
}