import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast-component/toast-component';
import { AuthStore } from './shared/services/auth-store';
import { NavbarComponent } from './shared/components/navbar-component/navbar-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  private readonly themeStorageKey = 'theme';

  constructor(private readonly authStore: AuthStore) {
    this.applySavedTheme();

    if (this.authStore.token()) {
      this.authStore.loadMe().subscribe({
        error: () => this.authStore.clearSession(),
      });
    }
  }

  private applySavedTheme(): void {
    const savedTheme = localStorage.getItem(this.themeStorageKey);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}