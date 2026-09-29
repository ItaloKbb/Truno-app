import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import type { GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';
import { Lobby } from './lobby';

describe('Lobby', () => {
  let fixture: ComponentFixture<Lobby>;
  let games: { create: ReturnType<typeof vi.fn>; access: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    games = {
      create: vi.fn(() => of({ id: 42 } as GameState)),
      access: vi.fn(() => of({ id: 42 } as GameState)),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [Lobby],
      providers: [
        { provide: GameService, useValue: games },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Lobby);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('creates a game and navigates to its route', () => {
    const nameInput = fixture.nativeElement.querySelector('#game-name') as HTMLInputElement;
    nameInput.value = '  Mesa do Lucas  ';
    const createButton = fixture.nativeElement.querySelector('#create-form button') as HTMLButtonElement;
    createButton.click();

    expect(games.create).toHaveBeenCalledWith({
      name: 'Mesa do Lucas',
      maxPlayers: 4,
      initialCards: 3,
      roundReward: 10,
      emptyHandReward: 5,
      trophyPrice: 20,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/partida', 42]);
  });

  it('shows a validation error for a short game name', () => {
    const nameInput = fixture.nativeElement.querySelector('#game-name') as HTMLInputElement;
    nameInput.value = 'ab';
    const createButton = fixture.nativeElement.querySelector('#create-form button') as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    expect(games.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Digite um nome com pelo menos 3 caracteres.');
  });

  it('accesses a game by code and navigates to its route', () => {
    const codeInput = fixture.nativeElement.querySelector('#game-code') as HTMLInputElement;
    codeInput.value = 'abc123';
    const accessButton = fixture.nativeElement.querySelector('#access-form button') as HTMLButtonElement;
    accessButton.click();

    expect(games.access).toHaveBeenCalledWith('abc123');
    expect(router.navigate).toHaveBeenCalledWith(['/partida', 42]);
  });
});
