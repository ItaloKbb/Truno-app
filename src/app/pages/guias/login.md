# Login (`/home`)

Nesta atividade, você vai entender como um formulário envia dados ao `AuthService`. A tela já existe em `src/app/pages/home`; use o passo a passo para estudar ou reconstruir a integração.

## Objetivo

Ao final, a tela deverá receber `nickname` (apelido) e `code` (código de acesso), validar os campos, impedir envios repetidos, mostrar erros e navegar após o sucesso.

## Vocabulário da atividade

- **form** (formulário): conjunto de campos enviado pelo usuário.
- **validation** (validação): regras verificadas antes do envio.
- **submit** (enviar): evento disparado ao confirmar o formulário.
- **credentials** (credenciais): dados usados para entrar.
- **session** (sessão): objeto com `token` e dados do jogador autenticado.
- **callback** (função de retorno): função executada em `next` ou `error` quando a operação termina.

## Passo 1 — conhecer o contrato

O serviço está em `src/app/services/modules/auth.service.ts`:

```ts
login({ nickname, code }): Observable<AuthSession>
```

O primeiro acesso cria a conta. Nos acessos seguintes, o mesmo apelido deve usar o mesmo código. Não existem e-mail, senha, recuperação de senha nem logout remoto nesta API.

O serviço salva o `token`; a tela não acessa `localStorage` e não monta cabeçalhos HTTP.

## Passo 2 — importar as ferramentas

```ts
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CODE_MAX_LENGTH, CODE_MIN_LENGTH, NICKNAME_MAX_LENGTH } from '../../domain/auth';
import { safeReturnUrl } from '../../guards/return-url';
import { AuthService, messageFromApi } from '../../services/modules/auth.service';
```

`ReactiveFormsModule` habilita **reactive forms** (formulários reativos), nos quais estrutura e regras ficam no TypeScript.

Confirme também que o módulo está registrado no componente:

```ts
@Component({
  imports: [ReactiveFormsModule],
  // demais propriedades do componente
})
```

## Passo 3 — montar o formulário

```ts
private readonly auth = inject(AuthService);
private readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);

protected readonly submitting = signal(false);
protected readonly errorMessage = signal('');

protected readonly form = new FormGroup({
  nickname: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(NICKNAME_MAX_LENGTH)],
  }),
  code: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(CODE_MIN_LENGTH),
      Validators.maxLength(CODE_MAX_LENGTH),
    ],
  }),
});
```

`nonNullable` garante que o valor seja `string`, não `string | null`. `Validators.required` torna o preenchimento obrigatório.

## Passo 4 — enviar somente quando houver confirmação

```ts
protected submit(): void {
  this.errorMessage.set('');

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.submitting.set(true);
  const { nickname, code } = this.form.getRawValue();

  this.auth.login({ nickname, code }).subscribe({
    next: () => {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      void this.router
        .navigateByUrl(safeReturnUrl(returnUrl))
        .finally(() => this.submitting.set(false));
    },
    error: (error: unknown) => {
      this.submitting.set(false);
      this.errorMessage.set(messageFromApi(error, 'Não foi possível entrar. Tente novamente.'));
    },
  });
}
```

Aqui usamos `subscribe`, e não `AsyncPipe`, porque o login é uma **command** (comando): deve acontecer somente após uma ação explícita. `next` representa sucesso; `error`, falha.

`safeReturnUrl` evita **open redirect** (redirecionamento aberto), aceitando somente caminhos internos.

## Passo 5 — ligar o HTML

```html
<form [formGroup]="form" (ngSubmit)="submit()" novalidate>
  <label for="nickname">Apelido</label>
  <input id="nickname" type="text" formControlName="nickname" autocomplete="username" />

  <label for="code">Código de acesso</label>
  <input id="code" type="password" formControlName="code" autocomplete="current-password" />

  <button type="submit" [disabled]="form.invalid || submitting()">
    {{ submitting() ? 'Entrando...' : 'Entrar' }}
  </button>

  @if (errorMessage(); as message) {
    <p role="alert">{{ message }}</p>
  }
</form>
```

`[formGroup]` e `formControlName` são **bindings** (ligações) entre HTML e TypeScript. `[disabled]` é um *property binding*: o Angular controla a propriedade do botão.

## Passo 6 — conferir

1. Envie os campos vazios e confirme que a API não é chamada.
2. Digite um apelido e um código com 4 a 30 caracteres.
3. Confirme que o botão mostra “Entrando...” durante a requisição.
4. Após o sucesso, confira a navegação.
5. Abra `/perfil` sem sessão; depois de entrar, confirme o retorno ao perfil.

## Erros comuns

- Usar `{ email, password }`: esses campos pertenciam a um contrato antigo.
- Criar `new AuthService()`: serviços são obtidos por injeção de dependência.
- Chamar `login()` ao criar a classe: isso enviaria dados antes do usuário confirmar.
- Manipular o token no componente: essa responsabilidade pertence ao armazenamento da sessão e ao interceptor.
