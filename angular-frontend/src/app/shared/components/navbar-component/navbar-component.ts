import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../services/auth-store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar-component.html',
})
export class NavbarComponent {
  private readonly themeStorageKey = 'theme';
  currentTheme: 'light' | 'dark' = 'light';

  constructor(
    public readonly store: AuthStore,
    private readonly router: Router
  ) {
    this.currentTheme = this.getCurrentTheme();
  }

  logout(): void {
    this.store.clearSession();
    this.router.navigateByUrl('/');
  }

  toggleTheme(): void {
    const isDark = document.documentElement.classList.toggle('dark');
    this.currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem(this.themeStorageKey, this.currentTheme);
  }

  private getCurrentTheme(): 'light' | 'dark' {
    const savedTheme = localStorage.getItem(this.themeStorageKey);
    return savedTheme === 'dark' ? 'dark' : 'light';
  }
}
