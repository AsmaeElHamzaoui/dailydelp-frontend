import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg sticky-top shadow-sm" style="background-color: #324C40;">
      <div class="container">
        <a class="navbar-brand fw-bold text-white" href="#">
          <span style="color: #9EAD84;">Daily</span>Help
        </a>
        <button class="navbar-toggler border-white" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon" style="filter: invert(1);"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link text-white" href="#hero">Accueil</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="#about">À propos</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="#services">Services</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="#contact">Contact</a></li>
            <li class="nav-item ms-lg-3">
              <a class="btn btn-outline-light rounded-pill" routerLink="/auth/login">Connexion</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class HeaderComponent {}