import {Component, inject, signal } from '@angular/core';
import {Router} from '@angular/router';
import type { Observable } from 'rxjs';
import type { CreateGameInput, GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';

@Component({
  selector: 'app-lobby',
  styleUrl: './lobby.css',
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly games = inject(GameService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal('');
}



