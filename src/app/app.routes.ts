import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

/**
 * As rotas só controlam URL e acesso; quem renderiza a tela é o App,
 * pelo seletor da página (ver app.html).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', canActivate: [guestGuard], children: [] },
  { path: 'book', canActivate: [authGuard], children: [] },
  { path: 'lobby', canActivate: [authGuard], children: [] },
  { path: 'puzzle', canActivate: [authGuard], children: [] },
  { path: 'partida/:id', canActivate: [authGuard], children: [] },
  { path: 'ranking', canActivate: [authGuard], children: [] },
  { path: 'perfil', canActivate: [authGuard], children: [] },
  { path: 'admin', children: [] },
  { path: 'admin/cartas', canActivate: [adminGuard], children: [] },
  { path: 'admin/skills', canActivate: [adminGuard], children: [] },
  { path: 'admin/puzzles', canActivate: [adminGuard], children: [] },
  { path: '**', redirectTo: 'home' },
];
