import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  },
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/book/book').then((module) => module.Book),
  },
  {
    path: 'lobby',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/lobby/lobby').then((module) => module.Lobby),
  },
  {
    path: 'partida/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/partida/partida').then((module) => module.Partida),
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ranking/ranking').then((module) => module.Ranking),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
  },
  { path: '**', redirectTo: 'home' },
];
