import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from './navbar-component';
import { AuthStore } from '../../services/auth-store';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let router: Router;

  let authStoreMock: {
    isLoggedIn: jasmine.Spy;
    isAdmin: jasmine.Spy;
    user: jasmine.Spy;
    clearSession: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreMock = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true),
      user: jasmine.createSpy('user').and.returnValue({
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN', 'ROLE_USER'],
      }),
      clearSession: jasmine.createSpy('clearSession'),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('debe mostrar el enlace Admin cuando el usuario es administrador', () => {
    authStoreMock.isAdmin.and.returnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const adminLink = Array.from(compiled.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Admin')
    );

    expect(adminLink).toBeTruthy();
  });

  it('no debe mostrar el enlace Admin cuando el usuario no es administrador', () => {
    authStoreMock.isAdmin.and.returnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const adminLink = Array.from(compiled.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Admin')
    );

    expect(adminLink).toBeFalsy();
  });

  it('debe limpiar la sesión y volver al inicio al pulsar Cerrar sesión', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = Array.from(compiled.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cerrar sesión')
    ) as HTMLButtonElement;

    logoutButton.click();

    expect(authStoreMock.clearSession).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});