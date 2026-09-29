import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { ProfileStorage } from './profile-storage';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const profile = {
    displayName: '',
    username: '',
    initials: '',
    avatarUrl: '',
    level: 1,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProfileStorage,
          useValue: {
            loadProfile: () => profile,
            saveProfile: () => undefined,
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the session returned by POST /api/auth/login and updates the profile', () => {
    let token = '';
    service
      .login({ email: 'lucasmartins@truno.app', password: 'truno1234' })
      .subscribe((session) => {
        token = session.token;
      });

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'lucasmartins@truno.app',
      password: 'truno1234',
    });
    request.flush({
      token: 'token-1',
      user: {
        id: 'user-lucas',
        name: 'Lucas Martins',
        email: 'lucasmartins@truno.app',
        url: '',
        coin: { id: 'coin-lucas', balance: 15750 },
      },
    });

    expect(token).toBe('token-1');
    expect(service.session()?.user.name).toBe('Lucas Martins');
    expect(profile).toMatchObject({
      displayName: 'Lucas Martins',
      username: 'lucasmartins',
      initials: 'LM',
    });
  });

  it('clears the local session when logout is called', () => {
    service.login({ email: 'lucasmartins@truno.app', password: 'truno1234' }).subscribe();
    http.expectOne('/api/auth/login').flush({
      token: 'token-1',
      user: {
        id: 'user-lucas',
        name: 'Lucas Martins',
        email: 'lucasmartins@truno.app',
        url: '',
        coin: { id: 'coin-lucas', balance: 0 },
      },
    });

    service.logout().subscribe();
    const logout = http.expectOne('/api/auth/logout');
    expect(logout.request.headers.get('Authorization')).toBe('Bearer token-1');
    logout.flush(null);

    expect(service.session()).toBeNull();
  });
});
