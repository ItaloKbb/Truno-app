import { InjectionToken } from '@angular/core';

/**
 * Base da API Truno Crazzy (java-web), sem barra final.
 * O CORS do backend precisa liberar a origem do app (`app.cors.allowed-origins`).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://verbose-broccoli-p5wx9jvjpqq3674g-3000.app.github.dev',
});
