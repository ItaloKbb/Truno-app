# Login (`/home`)

A tela de entrada já está em `src/app/pages/home`. Use este guia para entender o formulário que chama um service. Se você criar outra tela com botão de enviar, copie esta forma, não a do catálogo.

## Qual service

`AuthService`, em `src/app/services/auth.service.ts`.

| Ação da tela | Método | O que volta |
| --- | --- | --- |
| Entrar | `login({ email, password })` | `AuthSession` com `token` e `user` |
| Esqueci a senha | `forgotPassword(email)` | `{ message }` |
| Sair, em outra tela | `logout()` | completa mesmo se a rede falhar, e apaga a sessão local |

O service grava a sessão. A tela não mexe em `localStorage` e não envia o token na mão. O interceptor faz isso nas próximas requisições.

A rota `/home` usa `guestGuard`. Quem já entrou é enviado ao lobby.

## Por que aqui não é AsyncPipe

`login()` só deve rodar quando a pessoa envia o formulário. Se você fizer `login$ = this.auth.login(...)` no campo da classe, a requisição sai na hora em que a tela abre, com e-mail vazio.

O fluxo é:

1. O formulário guarda e-mail e senha.
2. O botão chama `submit()`.
3. `submit()` chama `this.auth.login(...).subscribe(...)`.
4. No `next`, navegue para o `returnUrl` ou para `/lobby`.
5. No `error`, mostre `error.message`.

## O que escrever na classe

O arquivo real é `src/app/pages/home/home.ts`. A parte que liga o service é esta:

```ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { safeReturnUrl } from '../../guards/return-url';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  protected submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(safeReturnUrl(returnUrl)).finally(() => this.submitting.set(false));
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Não foi possível entrar.');
      },
    });
  }
}
```

`safeReturnUrl` só aceita um caminho interno. Assim, `?returnUrl=/perfil` volta para o perfil, e um endereço de outro site é ignorado.

`ReactiveFormsModule` precisa estar em `imports`. Sem ele, `formGroup` no HTML não existe.

## O que escrever no template

```html
<form [formGroup]="form" (ngSubmit)="submit()" novalidate>
  <label for="email">E-mail</label>
  <input id="email" type="email" formControlName="email" autocomplete="email" />

  <label for="password">Senha</label>
  <input id="password" type="password" formControlName="password" autocomplete="current-password" />

  <button type="submit" [disabled]="form.invalid || submitting()">
    {{ submitting() ? 'Entrando...' : 'Login' }}
  </button>

  @if (errorMessage(); as message) {
    <p role="alert">{{ message }}</p>
  }
</form>
```

Senha errada: a API responde `401` e o service entrega o erro. A tela continua em `/home` e mostra "E-mail ou senha inválidos."

Senha certa: `next` navega. O botão fica desabilitado enquanto `submitting()` é verdadeiro, para o clique não disparar dois logins.

## Esqueci a senha

É o mesmo service, outro método. Não confirme se o e-mail existe. Mostre a `message` que a API devolveu:

```ts
this.auth.forgotPassword(email).subscribe({
  next: (response) => this.infoMessage.set(response.message),
  error: (error: unknown) => {
    this.errorMessage.set(error instanceof Error ? error.message : 'Não foi possível enviar as instruções.');
  },
});
```

## Como saber se funcionou

1. `npm start`.
2. Abra `/home`.
3. Entre com a senha errada e leia o alerta.
4. Entre com `lucasmartins@truno.app` / `truno1234` e confira se a URL foi para `/lobby`.
5. Abra `/perfil` sem estar logado. A URL deve ganhar `returnUrl`. Depois do login, essa rota abre.

No teste, troque o `AuthService` por um objeto falso. O teste da tela não deve chamar a API de verdade. Veja `src/app/pages/home/home.spec.ts`.
