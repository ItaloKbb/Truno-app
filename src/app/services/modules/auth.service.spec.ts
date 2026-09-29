import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-config';
import { AuthService } from './auth.service';
import { ProfileStorage } from './profile-storage';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let url: string;
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
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProfileStorage,
          useValue: { loadProfile: () => profile, saveProfile: () => undefined },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    url = `${TestBed.inject(API_BASE_URL)}/auth/sessions`;
  });

  afterEach(() => http.verify());

  it('stores the session returned by POST /auth/sessions and updates the profile', () => {
    let token = '';
    service.login({ nickname: ' lucas ', code: '1234' }).subscribe((session) => {
      token = session.token;
    });

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nickname: 'lucas', code: '1234' });
    request.flush({ token: 'token-1', user: { id: 7, nickname: 'lucas', rankingPoints: 12 } });

    expect(token).toBe('token-1');
    expect(service.session()?.user.rankingPoints).toBe(12);
    expect(profile).toMatchObject({ displayName: 'lucas', username: 'lucas', initials: 'L' });
  });

  it('rejects a session without a numeric user id', () => {
    const errors: Error[] = [];
    service.login({ nickname: 'lucas', code: '1234' }).subscribe({
      error: (error: Error) => errors.push(error),
    });
    http.expectOne(url).flush({ token: 'token-1', user: { id: 'x', nickname: 'lucas' } });

    expect(errors).toHaveLength(1);
    expect(service.session()).toBeNull();
  });

  it('clears the local session on logout without calling the API', () => {
    service.login({ nickname: 'lucas', code: '1234' }).subscribe();
    http
      .expectOne(url)
      .flush({ token: 'token-1', user: { id: 7, nickname: 'lucas', rankingPoints: 0 } });

    service.logout().subscribe();

    expect(service.session()).toBeNull();
  });
});
