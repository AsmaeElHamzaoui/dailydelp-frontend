import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, Role } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  allUsers: User[] = [];
  filteredUsers: User[] = [];

  // ── UI states ─────────────────────────────────────────────────────────────
  loading = false;
  deleting = false;

  // ── Delete confirm ────────────────────────────────────────────────────────
  showDeleteConfirm = false;
  userToDelete: User | null = null;

  // ── Filters & Search ─────────────────────────────────────────────────────
  searchQuery = '';
  activeRoleFilter: string = 'ALL';

  // ── Sort ──────────────────────────────────────────────────────────────────
  sortField: keyof User | '' = '';
  sortDir: 'asc' | 'desc' = 'asc';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 10;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalUsers(): number { return this.allUsers.length; }
  get totalAdmins(): number { return this.allUsers.filter(u => u.role === Role.ADMIN || u.role === 'ADMIN').length; }
  get totalCoaches(): number { return this.allUsers.filter(u => u.role === Role.COACH || u.role === 'COACH').length; }
  get totalMembers(): number { return this.allUsers.filter(u => u.role === Role.USER || u.role === 'USER').length; }

  // ── Pagination computed ───────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Filter / Search / Sort ────────────────────────────────────────────────
  filterByRole(role: string): void {
    this.activeRoleFilter = role;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    // Role filter
    if (this.activeRoleFilter !== 'ALL') {
      result = result.filter(u => u.role === this.activeRoleFilter);
    }

    // Search filter
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (this.sortField) {
      result.sort((a, b) => {
        const valA = (a[this.sortField as keyof User] ?? '') as string;
        const valB = (b[this.sortField as keyof User] ?? '') as string;
        const cmp = String(valA).localeCompare(String(valB));
        return this.sortDir === 'asc' ? cmp : -cmp;
      });
    }

    this.filteredUsers = result;
  }

  sortBy(field: keyof User): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applyFilters();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeDeleteConfirm();
    }
  }

  deleteUser(): void {
    if (!this.userToDelete?.id) return;
    this.deleting = true;
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter(u => u.id !== this.userToDelete!.id);
        this.applyFilters();
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
        }
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
  getInitials(user: User): string {
    const name = user.displayName?.trim();
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return (user.email ?? '??').slice(0, 2).toUpperCase();
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case Role.ADMIN: return 'Admin';
      case Role.COACH: return 'Coach';
      case Role.USER: return 'Membre';
      default: return role;
    }
  }

  getRoleCls(role: string): string {
    switch (role) {
      case Role.ADMIN: return 'role-admin';
      case Role.COACH: return 'role-coach';
      case Role.USER: return 'role-user';
      default: return '';
    }
  }

  getAvatarCls(user: User): string {
    const colors = ['indigo', 'teal', 'rose', 'amber', 'sky', 'violet', 'emerald', 'orange'];
    return colors[user.id % colors.length];
  }

  getSortIcon(field: keyof User): string {
    if (this.sortField !== field) return 'bi-chevron-expand';
    return this.sortDir === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down';
  }
}