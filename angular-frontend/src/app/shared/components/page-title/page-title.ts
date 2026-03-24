import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  standalone: true,
  templateUrl: './page-title.html'
})
export class PageTitleComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
}