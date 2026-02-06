import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="text-white pt-5 pb-3" style="background-color: #100B00;">
      <div class="container">
        <div class="row">
          <div class="col-md-4 mb-4">
            <h5 class="fw-bold" style="color: #9EAD84;">DailyHelp</h5>
            <p class="small text-secondary">Transformez l'effort individuel en une expérience collective motivante et durable.</p>
          </div>
          <div class="col-md-4 mb-4 text-center">
            <h6>Suivez-nous</h6>
            <div class="d-flex justify-content-center gap-3">
              <a href="#" class="text-white"><i class="bi bi-facebook"></i></a>
              <a href="#" class="text-white"><i class="bi bi-instagram"></i></a>
              <a href="#" class="text-white"><i class="bi bi-twitter-x"></i></a>
            </div>
          </div>
          <div class="col-md-4 mb-4 text-md-end">
            <h6>Liens utiles</h6>
            <ul class="list-unstyled small">
              <li><a href="#" class="text-decoration-none text-secondary">Mentions légales</a></li>
              <li><a href="#" class="text-decoration-none text-secondary">CGU / CGV</a></li>
            </ul>
          </div>
        </div>
        <hr class="bg-secondary">
        <div class="text-center small text-secondary">
          &copy; 2024 DailyHelp - Tous droits réservés.
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}