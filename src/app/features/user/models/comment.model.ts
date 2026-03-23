export interface CommentRequest {
  postId: number;
  userId: number;
  content: string;
}

export interface CommentResponse {
  id: number;
  postId: number;
  postContent: string;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}
