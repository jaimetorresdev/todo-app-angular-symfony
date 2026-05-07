import { Injectable, computed, signal } from '@angular/core';
import { AuthenticatedUser } from '../interfaces/auth';
import { AuthService } from './auth-service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly storageKey = 'token';

  readonly token = signal<string | null>(null);
  readonly user = signal<AuthenticatedUser | null>(null);

  readonly isLoggedIn = computed(() => !!this.token());
  readonly isAdmin = computed(() => this.user()?.roles?.includes('ROLE_ADMIN') ?? false);

  constructor(private readonly authApi: AuthService) {
    const fromStorage = localStorage.getItem(this.storageKey);
    if (fromStorage) this.token.set(fromStorage);
  }

  setSession(token: string): void {
    this.token.set(token);
    localStorage.setItem(this.storageKey, token);
  }

  setUser(user: AuthenticatedUser | null): void {
    this.user.set(user);
  }

  clearSession(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem(this.storageKey);
  }

  loadMe() {
    return this.authApi.me().pipe(tap((u) => this.user.set(u)));
  }
}