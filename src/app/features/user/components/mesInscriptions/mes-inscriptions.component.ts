import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InscriptionService } from '../../../admin/services/inscription.service';
import { UserService } from '../../services/user.service';
import { InscriptionResponse } from '../../../admin/models/inscription.model';
import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';

@Component({
  selector: 'app-mes-inscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './mes-inscriptions.component.html',
  styleUrls: ['./mes-inscriptions.component.scss']
})
export class MesInscriptionsComponent implements OnInit {

  inscriptions: InscriptionResponse[] = [];
  filteredInscriptions: InscriptionResponse[] = [];
  activeFilter: string = 'ALL';
  loading = false;
  userId: number | null = null;

  // ── Stats ───────────────────────────────────────────────────
  get totalRequests(): number { return this.inscriptions.length; }
  get pendingCount(): number { return this.inscriptions.filter(i => i.status === 'PENDING').length; }
  get acceptedCount(): number { return this.inscriptions.filter(i => i.status === 'ACCEPTEE').length; }
  get refusedCount(): number { return this.inscriptions.filter(i => i.status === 'REFUSEE').length; }

  constructor(
    private inscriptionService: InscriptionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.loadInscriptions();
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.loading = false;
      }
    });
  }

  loadInscriptions(): void {
    if (!this.userId) return;

    this.inscriptionService.getByUser(this.userId).subscribe({
      next: (data) => {
        this.inscriptions = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inscriptions', err);
        this.loading = false;
      }
    });
  }

  filterInscriptions(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredInscriptions = this.activeFilter === 'ALL'
      ? [...this.inscriptions]
      : this.inscriptions.filter(i => i.status === this.activeFilter);
  }

  getStatusConfig(status: string): { icon: string; label: string; cls: string } {
    switch (status) {
      case 'PENDING': return { icon: 'bi-hourglass-split', label: 'En attente', cls: 'pending' };
      case 'ACCEPTEE': return { icon: 'bi-check-circle-fill', label: 'Acceptée', cls: 'accepted' };
      case 'REFUSEE': return { icon: 'bi-x-circle-fill', label: 'Refusée', cls: 'refused' };
      default: return { icon: 'bi-question-circle', label: status, cls: 'default' };
    }
  }
}
