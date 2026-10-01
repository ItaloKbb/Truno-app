import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { safeReturnUrl } from './guards/return-url';
import { Book } from './pages/book/book';
import { Home } from './pages/home/home';
import { Lobby } from './pages/lobby/lobby';
import { Partida } from './pages/partida/partida';
import { Profile } from './pages/profile/profile';
import { Ranking } from './pages/ranking/ranking';
import { AuthService } from './services/modules/auth.service';
import { GameService } from './services/modules/game.service';
import { ProfileService } from './services/modules/profile.service';

/**
 * Raiz da aplicação: concentra o gerenciamento de rotas e a injeção de
 * dependências das telas. As telas recebem seus services via @Input e pedem
 * navegação via @Output, sem conhecer Router nem routerLink.
 */
@Component({
  imports: [Home, Book, Lobby, Partida, Ranking, Profile],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly gameService = inject(GameService);
  protected readonly profileService = inject(ProfileService);

  protected readonly title = signal('Truno-app');

  /** Rota ativa (path do app.routes), usada pelo @switch do template. */
  protected readonly page = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root.firstChild?.routeConfig?.path ?? ''),
    ),
    { initialValue: '' },
  );

  protected onLoggedIn(): void {
    const returnUrl = this.router.routerState.snapshot.root.queryParamMap.get('returnUrl');
    void this.navigate(safeReturnUrl(returnUrl));
  }

  protected navigate(url: string): Promise<boolean> {
    return this.router.navigateByUrl(url);
  }
}
