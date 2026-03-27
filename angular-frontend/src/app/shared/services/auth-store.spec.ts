import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStore } from './auth-store';
import { AuthService } from './auth-service';
import { AuthenticatedUser } from '../interfaces/auth';

describe('AuthStore', () => {
  let store: AuthStore;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    localStorage.clear();

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['me']);
    authServiceSpy.me.and.returnValue(
      of({
        id: 1,
        email: 'test@example.com',
        roles: ['ROLE_USER'],
      } as AuthenticatedUser)
    );

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe guardar el token en memoria y en localStorage con setSession', () => {
    store.setSession('jwt-token-demo');

    expect(store.token()).toBe('jwt-token-demo');
    expect(localStorage.getItem('token')).toBe('jwt-token-demo');
    expect(store.isLoggedIn()).toBeTrue();
  });

  it('debe limpiar token, usuario y localStorage con clearSession', () => {
    store.setSession('jwt-token-demo');
    store.setUser({
      id: 2,
      email: 'admin@example.com',
      roles: ['ROLE_ADMIN'],
    });

    store.clearSession();

    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(store.isLoggedIn()).toBeFalse();
    expect(store.isAdmin()).toBeFalse();
  });

  it('debe cargar el usuario autenticado con loadMe', (done) => {
    store.loadMe().subscribe({
      next: (user) => {
        expect(authServiceSpy.me).toHaveBeenCalled();
        expect(user.email).toBe('test@example.com');
        expect(store.user()?.email).toBe('test@example.com');
        expect(store.isAdmin()).toBeFalse();
        done();
      },
    });
  });

  it('debe detectar isAdmin cuando el usuario tiene ROLE_ADMIN', () => {
    store.setUser({
      id: 3,
      email: 'root@example.com',
      roles: ['ROLE_ADMIN', 'ROLE_USER'],
    });

    expect(store.isAdmin()).toBeTrue();
  });
});