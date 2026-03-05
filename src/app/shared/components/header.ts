import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<nav class="navbar navbar-expand-lg sticky-top shadow-sm header-navbar">
  <div class="container">

    <a class="navbar-brand fw-bold text-white">
      <span class="brand-accent">Daily</span>Help
    </a>

    <button class="navbar-toggler border-white"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon icon-white"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarNav">

      <ul class="navbar-nav ms-auto align-items-center">

        <li class="nav-item">
          <a class="nav-link text-white" href="#hero">Accueil</a>
        </li>

        <li class="nav-item">
          <a class="nav-link text-white" href="#about">À propos</a>
        </li>

        <li class="nav-item">
          <a class="nav-link text-white" href="#services">Services</a>
        </li>

        <li class="nav-item">
          <a class="nav-link text-white" href="#contact">Contact</a>
        </li>

        <!-- Si NON connecté -->
        <li class="nav-item ms-lg-3" *ngIf="!isAuthenticated">
          <a class="btn btn-outline-light rounded-pill" routerLink="/auth/login">
            Connexion
          </a>
        </li>

        <!-- Icon utilisateur -->
        <li class="nav-item ms-lg-3 user-wrapper"
            *ngIf="isAuthenticated && role === 'USER'">

          <div class="user-icon"
               (click)="toggleMenu()">
            <i class="bi bi-person-circle"></i>
          </div>

          <!-- POPUP -->
          <div class="user-popup"
               *ngIf="menuOpen">

            <a routerLink="/user" class="popup-item">
              <i class="bi bi-speedometer2"></i>
              Mon espace
            </a>

            <a routerLink="/profile" class="popup-item">
              <i class="bi bi-person"></i>
              Profil
            </a>

            <div class="divider"></div>

            <button class="popup-item logout"
                    (click)="logout()">
              <i class="bi bi-box-arrow-right"></i>
              Déconnexion
            </button>

          </div>

        </li>

      </ul>

    </div>
  </div>
</nav>
  `,
  styles: [`

/* NAVBAR */

.header-navbar{
  background:#324C40;
  padding:12px 0;
}

.brand-accent{
  color:#9EAD84;
}

.nav-link{
  margin-left:12px;
  font-weight:500;
}

.icon-white{
  filter:invert(1);
}

/* USER ICON */

.user-wrapper{
  position:relative;
}

.user-icon{
  width:42px;
  height:42px;
  border-radius:50%;
  background:#547D54;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  color:white;
  font-size:20px;
  transition:0.3s;
}

.user-icon:hover{
  background:#38573F;
  transform:scale(1.05);
}

/* POPUP */

.user-popup{
  position:absolute;
  right:0;
  top:55px;
  width:200px;
  background:white;
  border-radius:14px;
  box-shadow:0 15px 40px rgba(0,0,0,0.2);
  padding:8px;
  animation:popup 0.2s ease;
  z-index:1000;
}

/* ITEMS */

.popup-item{
  width:100%;
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-radius:10px;
  text-decoration:none;
  color:#324C40;
  font-weight:500;
  border:none;
  background:none;
}

.popup-item i{
  color:#547D54;
}

.popup-item:hover{
  background:#f4f6f4;
}

/* LOGOUT */

.logout{
  color:#c0392b;
}

.logout i{
  color:#c0392b;
}

.logout:hover{
  background:#fff1f0;
}

/* DIVIDER */

.divider{
  height:1px;
  background:#eee;
  margin:6px 0;
}

/* ANIMATION */

@keyframes popup{
  from{
    opacity:0;
    transform:translateY(-10px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}

`]
})
export class HeaderComponent {

  isAuthenticated = false;
  role: string | null = null;
  menuOpen = false;

  constructor(private authService: AuthService){}

  ngOnInit(): void {

    this.isAuthenticated = this.authService.isLoggedIn();
    this.role = this.authService.getUserRole();

    this.authService.isAuthenticated$.subscribe(status=>{
      this.isAuthenticated = status;
      this.role = this.authService.getUserRole();
    });
  }

  toggleMenu(){
    this.menuOpen = !this.menuOpen;
  }

  logout(){
    this.authService.logout();
  }

}