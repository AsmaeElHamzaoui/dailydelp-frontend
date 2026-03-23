import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PublicGroupService } from '../../services/public-group.service';
import { PostUserService } from '../../services/post-user.service';
import { CommentService } from '../../services/comment.service';
import { GroupResponse } from '../../../admin/models/group.model';
import { PostResponse } from '../../../coach/models/post.model';
import { CommentResponse, CommentRequest } from '../../models/comment.model';
import { UserService } from '../../services/user.service';
import { InscriptionService } from '../../../admin/services/inscription.service';
import { User } from '../../../admin/models/user.model';
import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';

@Component({
  selector: 'app-mes-groupes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './mes-groupes.component.html',
  styleUrls: ['./mes-groupes.component.scss']
})
export class MesGroupesComponent implements OnInit {
  groupId!: number;
  group?: GroupResponse;
  posts: PostResponse[] = [];
  members: User[] = [];
  commentsByPost: { [postId: number]: CommentResponse[] } = {};
  newComments: { [postId: number]: string } = {};
  currentUser: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private groupService: PublicGroupService,
    private postService: PostUserService,
    private commentService: CommentService,
    private userService: UserService,
    private inscriptionService: InscriptionService
  ) { }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => console.error('Error loading profile', err)
    });

    this.route.params.subscribe(params => {
      this.groupId = +params['id'];
      if (this.groupId) {
        this.loadGroupData();
      }
    });
  }

  loadGroupData(): void {
    this.loading = true;
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (group) => {
        this.group = group;
        this.loadPosts();
        this.loadMembers();
      },
      error: (err) => {
        console.error('Error loading group', err);
        this.loading = false;
      }
    });
  }

  loadMembers(): void {
    if (!this.group) return;

    this.userService.getUsers().subscribe({
      next: (allUsers) => {
        const memberIds = this.group?.memberIds || [];
        // Filtrer pour n'avoir que les membres du groupe
        this.members = allUsers.filter(user => memberIds.includes(user.id));
      },
      error: (err) => console.error('Error loading members from UserService', err)
    });
  }

  loadPosts(): void {
    this.postService.getPostsByGroup(this.groupId).subscribe({
      next: (posts) => {
        this.posts = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.posts.forEach(post => {
          this.loadComments(post.id);
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading posts', err);
        this.loading = false;
      }
    });
  }

  loadComments(postId: number): void {
    this.commentService.getCommentsByPost(postId).subscribe({
      next: (comments) => {
        this.commentsByPost[postId] = comments;
      },
      error: (err) => console.error(`Error loading comments for post ${postId}`, err)
    });
  }

  addComment(postId: number): void {
    const content = this.newComments[postId];
    if (!content || content.trim() === '') return;

    const request: CommentRequest = {
      postId: postId,
      userId: this.currentUser?.id,
      content: content
    };

    this.commentService.createComment(request).subscribe({
      next: (comment) => {
        if (!this.commentsByPost[postId]) {
          this.commentsByPost[postId] = [];
        }
        this.commentsByPost[postId].push(comment);
        this.newComments[postId] = '';
      },
      error: (err) => console.error('Error adding comment', err)
    });
  }
}
