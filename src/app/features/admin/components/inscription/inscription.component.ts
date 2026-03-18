import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscriptionService } from '../../services/inscription.service';
import { InscriptionResponse } from '../../models/inscription.model';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscription.component.html',
  styleUrls: ['./inscription.component.scss']
})
export class InscriptionComponent implements OnInit {

  inscriptions: InscriptionResponse[] = [];
  filteredInscriptions: InscriptionResponse[] = [];
  activeFilter: string = 'PENDING';
  loading = false;
  processingId: number | null = null;

  // ── Stats ───────────────────────────────────────────────────
  get totalCount(): number { return this.inscriptions.length; }
  get pendingCount(): number { return this.inscriptions.filter(i => i.status === 'PENDING').length; }
  get acceptedCount(): number { return this.inscriptions.filter(i => i.status === 'ACCEPTEE').length; }
  get refusedCount(): number { return this.inscriptions.filter(i => i.status === 'REFUSEE').length; }

  constructor(private inscriptionService: InscriptionService) { }

  ngOnInit(): void {
    this.loadInscriptions();
  }

  loadInscriptions(): void {
    this.loading = true;
    this.inscriptionService.getAll().subscribe({
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

  filterInscriptions(status: string): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'ALL') {
      this.filteredInscriptions = [...this.inscriptions];
    } else {
      this.filteredInscriptions = this.inscriptions.filter(i => i.status === this.activeFilter);
    }
  }

  acceptInscription(ins: InscriptionResponse): void {
    this.processingId = ins.id;
    this.inscriptionService.accept(ins.id).subscribe({
      next: () => {
        const index = this.inscriptions.findIndex(i => i.id === ins.id);
        if (index !== -1) {
          this.inscriptions[index].status = 'ACCEPTEE';
        }
        this.applyFilter();
        this.processingId = null;
      },
      error: (err) => {
        console.error('Error accepting inscription', err);
        this.processingId = null;
      }
    });
  }

  refuseInscription(ins: InscriptionResponse): void {
    this.processingId = ins.id;
    this.inscriptionService.refuse(ins.id).subscribe({
      next: () => {
        const index = this.inscriptions.findIndex(i => i.id === ins.id);
        if (index !== -1) {
          this.inscriptions[index].status = 'REFUSEE';
        }
        this.applyFilter();
        this.processingId = null;
      },
      error: (err) => {
        console.error('Error refusing inscription', err);
        this.processingId = null;
      }
    });
  }

  getStatusConfig(status: string): { icon: string; label: string; cls: string } {
    switch (status) {
      case 'PENDING': return { icon: 'bi-hourglass-split', label: 'En attente', cls: 'pending' };
      case 'ACCEPTEE': return { icon: 'bi-check-circle-fill', label: 'Acceptée', cls: 'accepted' };
      case 'REFUSEE': return { icon: 'bi-x-circle-fill', label: 'Refusée', cls: 'refused' };
      default: return { icon: 'bi-question-circle', label: status, cls: 'default' };
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
}
