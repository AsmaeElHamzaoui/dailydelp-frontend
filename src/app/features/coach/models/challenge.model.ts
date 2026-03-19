export interface ChallengeRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: string;
}

export interface ChallengeResponse {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  coachId: number;
}
