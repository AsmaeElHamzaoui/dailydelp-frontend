import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { PostResponse } from '../../models/post.model';

interface PostWithMeta extends PostResponse {
  expanded?: boolean;
  colorIndex?: number;
}

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  allPosts: PostWithMeta[] = [];
  filteredPosts: PostWithMeta[] = [];

  // ── UI states ─────────────────────────────────────────────────────────────
  loading = false;
  deleting = false;

  // ── Delete confirm ────────────────────────────────────────────────────────
  showDeleteConfirm = false;
  postToDelete: PostWithMeta | null = null;

  // ── Image lightbox ────────────────────────────────────────────────────────
  lightboxImage: string | null = null;

  // ── Filters & Search ─────────────────────────────────────────────────────
  searchQuery = '';
  activeFilter: 'ALL' | 'WITH_IMAGE' | 'NO_IMAGE' = 'ALL';

  // ── Sort ──────────────────────────────────────────────────────────────────
  sortDir: 'newest' | 'oldest' = 'newest';

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 9;

  private colorPalette = [
    'indigo', 'teal', 'rose', 'amber', 'sky', 'violet', 'emerald', 'orange'
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────
  get totalPosts(): number { return this.allPosts.length; }
  get postsWithImage(): number { return this.allPosts.filter(p => p.image).length; }
  get uniqueCoaches(): number {
    return new Set(this.allPosts.map(p => p.coach?.id).filter(Boolean)).size;
  }
  get uniqueGroups(): number {
    return new Set(this.allPosts.map(p => p.group?.id).filter(Boolean)).size;
  }

  // ── Pagination computed ───────────────────────────────────────────────────
  get totalPages(): number {
    return Math.ceil(this.filteredPosts.length / this.pageSize);
  }
  get paginatedPosts(): PostWithMeta[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPosts.slice(start, start + this.pageSize);
  }
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadPosts(): void {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (posts) => {
        this.allPosts = posts.map((p, i) => ({
          ...p,
          expanded: false,
          colorIndex: i % this.colorPalette.length
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  setFilter(filter: 'ALL' | 'WITH_IMAGE' | 'NO_IMAGE'): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleSort(): void {
    this.sortDir = this.sortDir === 'newest' ? 'oldest' : 'newest';
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allPosts];

    if (this.activeFilter === 'WITH_IMAGE') result = result.filter(p => !!p.image);
    if (this.activeFilter === 'NO_IMAGE')   result = result.filter(p => !p.image);

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.content?.toLowerCase().includes(q) ||
        p.coach?.displayName?.toLowerCase().includes(q) ||
        p.group?.name?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return this.sortDir === 'newest' ? db - da : da - db;
    });

    this.filteredPosts = result;
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Expand / Collapse text ────────────────────────────────────────────────
  toggleExpand(post: PostWithMeta): void {
    post.expanded = !post.expanded;
  }

  isLongContent(content: string): boolean {
    return content?.length > 180;
  }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  openLightbox(imageUrl: string): void {
    this.lightboxImage = imageUrl;
  }

  closeLightbox(): void {
    this.lightboxImage = null;
  }

  closeLightboxOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('lightbox-overlay')) {
      this.closeLightbox();
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(post: PostWithMeta): void {
    this.postToDelete = post;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.postToDelete = null;
  }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeDeleteConfirm();
    }
  }

  deletePost(): void {
    if (!this.postToDelete?.id) return;
    this.deleting = true;
    this.postService.deletePost(this.postToDelete.id).subscribe({
      next: () => {
        this.allPosts = this.allPosts.filter(p => p.id !== this.postToDelete!.id);
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
  getColor(post: PostWithMeta): string {
    return this.colorPalette[post.colorIndex ?? 0];
  }

  getInitials(displayName: string | undefined): string {
    if (!displayName?.trim()) return '?';
    const parts = displayName.trim().split(' ').filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  getCoachName(post: PostWithMeta | null | undefined): string {
  if (!post) return '';

  // Cas 1 : objet coach complet avec displayName
  if (post.coach?.displayName?.trim()) {
    return post.coach.displayName.trim();
  }

  // Cas 2 : objet coach avec email uniquement
  if (post.coach?.email) {
    return post.coach.email;
  }

  // Cas 3 : champ plat coachName renvoyé par l'API
  if ((post as any).coachName?.trim()) {
    return (post as any).coachName.trim();
  }

  // Cas 4 : fallback sur coachId
  const coachId = post.coach?.id ?? (post as any).coachId;
  if (coachId) return `Coach #${coachId}`;

  return 'Coach inconnu';
}

getGroupName(post: PostWithMeta | null | undefined): string {
  if (!post) return '';

  // Cas 1 : objet group complet avec name
  if (post.group?.name?.trim()) {
    return post.group.name.trim();
  }

  // Cas 2 : champ plat groupName renvoyé par l'API
  if ((post as any).groupName?.trim()) {
    return (post as any).groupName.trim();
  }

  // Cas 3 : fallback sur groupId
  const groupId = post.group?.id ?? (post as any).groupId;
  if (groupId) return `Groupe #${groupId}`;

  return 'Groupe inconnu';
}

  truncate(text: string, limit: number): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '…' : text;
  }

  isImageUrl(value: string | undefined): boolean {
    if (!value) return false;
    return value.startsWith('http') || value.startsWith('/') || value.startsWith('data:');
  }
}