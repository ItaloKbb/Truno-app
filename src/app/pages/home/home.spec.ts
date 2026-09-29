import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Home } from './home';

@Component({ template: '' })
class LobbyStub {}

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let auth: { login: ReturnType<typeof vi.fn>; forgotPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = {
      login: vi.fn(),
      forgotPassword: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([{ path: 'lobby', component: LobbyStub }]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function fill(email: string, password = ''): void {
    const emailInput = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    const passwordInput = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement | null;
    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  }

  it('keeps login disabled until email and password are valid', () => {
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fill('lucasmartins@truno.app', 'truno1234');

    expect(button.disabled).toBe(false);
  });

  it('shows the API error when the credentials are rejected', async () => {
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 401, error: { message: 'E-mail ou senha inválidos.' } }),
      ),
    );
    fill('lucasmartins@truno.app', 'senhaerrada');

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha inválidos.');
    expect(auth.login).toHaveBeenCalledWith({
      email: 'lucasmartins@truno.app',
      password: 'senhaerrada',
    });
  });

  it('opens the lobby after the API returns a session', async () => {
    auth.login.mockReturnValue(
      of({
        token: 'token-1',
        user: {
          id: 'user-lucas',
          name: 'Lucas Martins',
          email: 'lucasmartins@truno.app',
          url: '',
          coin: { id: 'coin-lucas', balance: 15750 },
        },
      }),
    );
    fill('lucasmartins@truno.app', 'truno1234');

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/lobby');
  });

  it('asks the API to send password instructions without confirming the account', async () => {
    auth.forgotPassword.mockReturnValue(
      of({ message: 'Se existir uma conta com esse e-mail, enviaremos as instruções.' }),
    );
    (fixture.nativeElement.querySelector('button.link') as HTMLButtonElement).click();
    fixture.detectChanges();
    fill('outra@truno.app');

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.forgotPassword).toHaveBeenCalledWith('outra@truno.app');
    expect(fixture.nativeElement.textContent).toContain('enviaremos as instruções');
  });
});
