import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { safeReturnUrl } from './guards/return-url';
import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { AuthService } from './services/modules/auth.service';
import { ProfileService } from './services/modules/profile.service';

/**
 * Raiz da aplicação: concentra o gerenciamento de rotas e a injeção de
 * dependências das telas. As telas recebem seus services via @Input e pedem
 * navegação via @Output, sem conhecer Router nem routerLink.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  protected readonly title = signal('Truno-app');

  protected onActivate(page: unknown): void {
    if (page instanceof Home) {
      page.auth = this.auth;
      page.loggedIn.subscribe(() => {
        const returnUrl = this.router.routerState.snapshot.root.queryParamMap.get('returnUrl');
        void this.navigate(safeReturnUrl(returnUrl));
      });
    } else if (page instanceof Profile) {
      page.profiles = this.profileService;
      page.navigate.subscribe((url) => void this.navigate(url));
    }
  }

  protected navigate(url: string): Promise<boolean> {
    return this.router.navigateByUrl(url);
  }
}
