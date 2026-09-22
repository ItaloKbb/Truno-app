import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((module) => module.Book),
  },

  {
    path: 'book',
    loadComponent: () => import('./pages/book/book').then((module) => module.Book),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'perfil/colecao',
    loadComponent: () => import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'colecao' },
  },
  {
    path: 'perfil/conquistas',
    loadComponent: () => import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'conquistas' },
  },
  {
    path: 'perfil/configuracoes',
    loadComponent: () => import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'configuracoes' },
  },
  {
    path: 'perfil/historico',
    loadComponent: () => import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'historico' },
  },
  {
    path: 'perfil/editar',
    loadComponent: () => import('./pages/profile-section/profile-section').then((module) => module.ProfileSection),
    data: { section: 'editar' },
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
