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
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'perfil/colecao',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'colecao' },
  },
  {
    path: 'perfil/conquistas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'conquistas' },
  },
  {
    path: 'perfil/configuracoes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'configuracoes' },
  },
  {
    path: 'perfil/historico',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'historico' },
  },
  {
    path: 'perfil/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'editar' },
  },
  { path: '**', redirectTo: 'home' },
];
