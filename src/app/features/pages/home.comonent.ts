import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header';
import { FooterComponent } from '../../shared/components/footer';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder, private el: ElementRef) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    this.el.nativeElement.querySelectorAll('.fade-in-section').forEach((section: any) => {
      observer.observe(section);
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Formulaire envoyé', this.contactForm.value);
      alert('Merci ! Votre message a été envoyé.');
      this.contactForm.reset();
    }
  }
}