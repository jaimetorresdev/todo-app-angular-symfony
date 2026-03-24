import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './landing-page-component.html'
})
export class LandingPageComponent {}