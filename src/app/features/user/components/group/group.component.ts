import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicGroupService } from '../../services/public-group.service';
import { InscriptionService } from '../../../admin/services/inscription.service';
import { UserService } from '../../services/user.service';
import { GroupResponse } from '../../../admin/models/group.model';
import { InscriptionResponse, InscriptionRequest } from '../../../admin/models/inscription.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';

interface GroupWithState extends GroupResponse {
  requestLoading?: boolean;
  requestSuccess?: boolean;
  hasPendingOrAcceptedRequest?: boolean;
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule,HeaderComponent, FooterComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  groups: GroupWithState[] = [];
  loading = false;
  currentUserId: number | null = null;

  constructor(
    private groupService: PublicGroupService,
    private inscriptionService: InscriptionService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    
    // 1. Récupérer le profil de l'utilisateur connecté
    this.userService.getMyProfile().pipe(
      catchError(err => {
        console.error('Erreur lors de la récupération du profil', err);
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.loadGroupsAndInscriptions();
      } else {
        // Si non connecté, on charge juste les groupes
        this.loadGroups();
      }
    });
  }

  loadGroupsAndInscriptions(): void {
    if (!this.currentUserId) {
      this.loadGroups();
      return;
    }

    // 2. Charger les groupes et les inscriptions de l'utilisateur en parallèle
    forkJoin({
      groups: this.groupService.getGroups(),
      inscriptions: this.inscriptionService.getByUser(this.currentUserId)
    }).subscribe({
      next: ({ groups, inscriptions }) => {
        this.groups = groups.map(g => {
          // Vérifier si une inscription existe déjà (PENDING ou ACCEPTEE)
          const existingInscription = inscriptions.find(ins => ins.groupId === g.id);
          const hasPendingOrAccepted = !!existingInscription && 
                                      (existingInscription.status === 'PENDING' || existingInscription.status === 'ACCEPTEE');
          
          return {
            ...g,
            requestLoading: false,
            requestSuccess: existingInscription?.status === 'ACCEPTEE',
            hasPendingOrAcceptedRequest: hasPendingOrAccepted
          };
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données', err);
        this.loading = false;
      }
    });
  }

  loadGroups(): void {
    this.loading = true;
    this.groupService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.map(g => ({
          ...g,
          requestLoading: false,
          requestSuccess: false,
          hasPendingOrAcceptedRequest: false
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des groupes', err);
        this.loading = false;
      }
    });
  }

  requestInscription(groupId: number): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group || group.requestSuccess || group.hasPendingOrAcceptedRequest) return;

    group.requestLoading = true;
    const request: InscriptionRequest = { groupId };

    this.inscriptionService.create(request).subscribe({
      next: () => {
        group.requestLoading = false;
        // Une fois envoyée, la demande est en attente (PENDING)
        group.hasPendingOrAcceptedRequest = true;
      },
      error: (err: any) => {
        console.error('Erreur lors de la création de l\'inscription', err);
        group.requestLoading = false;
      }
    });
  }

  getMemberRatio(group: GroupResponse): number {
    const memberCount = group.memberIds ? group.memberIds.length : 0;
    const maxMembers = group.maxMembers || 10;
    return Math.round((memberCount / maxMembers) * 100);
  }
}