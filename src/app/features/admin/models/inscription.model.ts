export interface InscriptionRequest {
  userId: number;
  groupId: number;
}

export interface InscriptionResponse {
  id: number;

  userId: number;
  userName: string;

  groupId: number;
  groupName: string;

  status: 'PENDING' | 'ACCEPTEE' | 'REFUSEE';

  createdAt: string;
}