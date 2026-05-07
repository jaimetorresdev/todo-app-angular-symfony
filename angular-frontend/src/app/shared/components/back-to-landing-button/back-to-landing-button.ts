import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-to-landing-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './back-to-landing-button.html'
})
export class BackToLandingButtonComponent {}