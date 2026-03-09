import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthRequest } from '../../../../core/models/auth-request.model';
import { HeaderComponent } from '../../../../shared/components/header';
import { FooterComponent } from '../../../../shared/components/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const authRequest: AuthRequest = this.loginForm.value;

    this.authService.login(authRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Rediriger selon le rôle
        switch (response.role) {
          case 'ADMIN':
            this.router.navigate(['/admin']);
            break;
          case 'COACH':
            this.router.navigate(['/coach']);
            break;
          case 'USER':
            this.router.navigate(['/user']);
            break;
          default:
            this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Email ou mot de passe incorrect';
      }
    });
  }

  // Utilitaire pour marquer tous les champs comme touchés
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}