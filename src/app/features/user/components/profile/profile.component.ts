import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService, ProfileUpdateRequest } from '../../services/user.service';
import { User } from '../../../../core/models/user.model';

interface ProfileForm {
  displayName: string;
  bio:         string;
  timezone:    string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  // ── Display state ─────────────────────────────────────────────────────────
  email     = '';
  username  = '';
  role      = '';
  avatarUrl: string | null = null;

  // ── UI signals ────────────────────────────────────────────────────────────
  isEditing     = signal(false);
  isSaving      = signal(false);
  isLoading     = signal(true);
  saveSuccess   = signal(false);
  saveError     = signal('');
  avatarHovered = signal(false);

  // ── Form ──────────────────────────────────────────────────────────────────
  form: ProfileForm = { displayName: '', bio: '', timezone: 'UTC+1:00 — Paris, Brussels' };
  private formSnapshot: ProfileForm = { ...this.form };

  timezones = [
    'UTC−12:00 — Baker Island',
    'UTC−8:00  — Los Angeles',
    'UTC−5:00  — New York',
    'UTC+0:00  — London',
    'UTC+1:00  — Paris, Brussels',
    'UTC+2:00  — Cairo, Athens',
    'UTC+3:00  — Moscow',
    'UTC+5:30  — Mumbai',
    'UTC+8:00  — Beijing, Singapore',
    'UTC+9:00  — Tokyo',
    'UTC+12:00 — Auckland'
  ];

  private roleColors: Record<string, string> = {
    admin:   'role--admin',
    coach:   'role--manager',
    user:    'role--user',
    guest:   'role--guest'
  };

  get roleClass(): string {
    return this.roleColors[this.role.toLowerCase()] ?? 'role--user';
  }

  get initials(): string {
    const name = this.form.displayName || this.username;
    return name.slice(0, 2).toUpperCase();
  }

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: User) => this.hydrateFromUser(user),
      error: () => {
        // Fallback: seed from JWT claims if API fails
        const email = this.authService.getUserEmail();
        const role  = this.authService.getUserRole();
        if (email) {
          this.email    = email;
          this.username = email.split('@')[0];
          this.form.displayName = this.username;
          this.formSnapshot = { ...this.form };
        }
        if (role) this.role = role;
        this.isLoading.set(false);
      }
    });

    // Restore locally cached avatar (instant, no flash)
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) this.avatarUrl = savedAvatar;
  }

  private hydrateFromUser(user: User): void {
    this.email     = user.email;
    this.username  = user.email.split('@')[0];
    this.role      = user.role;
    this.avatarUrl = user.avatarUrl ?? localStorage.getItem('user_avatar');

    this.form = {
      displayName: user.displayName  || this.username,
      bio:         user.bio          || '',
      timezone:    user.timezone     || 'UTC+1:00 — Paris, Brussels'
    };
    this.formSnapshot = { ...this.form };
    this.isLoading.set(false);
  }

  // ── Avatar ────────────────────────────────────────────────────────────────

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.avatarUrl = dataUrl;

      // Persist locally as fallback; also push to server
      localStorage.setItem('user_avatar', dataUrl);
      this.userService.updateProfile({ avatarUrl: dataUrl }).subscribe();
    };
    reader.readAsDataURL(file);
  }

  // ── Edit flow ─────────────────────────────────────────────────────────────

  startEdit(): void {
    this.formSnapshot = { ...this.form };
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.form = { ...this.formSnapshot };
    this.isEditing.set(false);
    this.saveError.set('');
  }

  saveChanges(): void {
    this.isSaving.set(true);
    this.saveError.set('');

    const payload: ProfileUpdateRequest = {
      displayName: this.form.displayName.trim(),
      bio:         this.form.bio.trim(),
      timezone:    this.form.timezone
    };

    this.userService.updateProfile(payload).subscribe({
      next: (updated: User) => {
        this.hydrateFromUser(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        const msg = err.error?.message ?? 'Failed to save changes. Please try again.';
        this.saveError.set(msg);
      }
    });
  }
}