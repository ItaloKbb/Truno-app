import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/modules/auth.service';
import { Home } from './home';

@Component({ template: '' })
class LobbyStub {}

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let auth: { login: ReturnType<typeof vi.fn> };

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

  function fill(nickname: string, code = ''): void {
    const nicknameInput = fixture.nativeElement.querySelector('#nickname') as HTMLInputElement;
    nicknameInput.value = nickname;
    nicknameInput.dispatchEvent(new Event('input'));
    const codeInput = fixture.nativeElement.querySelector('#code') as HTMLInputElement;
    codeInput.value = code;
    codeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  it('keeps login disabled until nickname and code are valid', () => {
    expect(submitButton().disabled).toBe(true);

    fill('lucas', '123');
    expect(submitButton().disabled).toBe(true);

    fill('lucas', '1234');
    expect(submitButton().disabled).toBe(false);
  });

  it('shows the API error when the credentials are rejected', async () => {
    auth.login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { message: 'Código inválido.' } }),
      ),
    );
    fill('lucas', 'errado');

    submitButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Código inválido.');
    expect(auth.login).toHaveBeenCalledWith({ nickname: 'lucas', code: 'errado' });
  });

  it('opens the lobby after the API returns a session', async () => {
    auth.login.mockReturnValue(
      of({ token: 'token-1', user: { id: 1, nickname: 'lucas', rankingPoints: 0 } }),
    );
    fill('lucas', '1234');

    submitButton().click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/lobby');
  });
});
