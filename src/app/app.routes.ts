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
    path: 'lobby',
    loadComponent: () => import('./pages/lobby/lobby').then((module) => module.Lobby),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
