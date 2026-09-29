# Lobby (`/lobby`)

A pasta `src/app/pages/lobby` já existe e a rota `/lobby` já está protegida. O HTML de hoje é estático: os nomes das mesas estão escritos na tela. A sua tarefa é pedir as mesas ao `LobbyService` e permitir criar uma mesa nova.

Não gere o componente de novo.

## Qual service

`LobbyService`.

| Método | Uso na tela |
| --- | --- |
| `getAll()` | Lista as mesas ao abrir |
| `getById(id)` | Detalhe, se você quiser uma rota `/lobby/:id` |
| `create(room)` | Botão "Criar mesa" |

Uma `LobbyRoom` tem `id`, `name`, `hostId`, `visibility` (`PUBLICA` ou `PRIVADA`), `maxPlayers` (`2` ou `4`), `playerIds`, `pointsToWin` (`12`, `15` ou `30`) e `status` (`ABERTA`, `EM_JOGO` ou `ENCERRADA`).

O corpo do `create` é um `CreateLobbyRoom`: `name`, `hostId`, `visibility`, `maxPlayers` e `pointsToWin`. O `hostId` é o `user.id` da sessão, não um texto digitado.

## Listar

Siga o catálogo. Troque `CardService.getAll` por `LobbyService.getAll`.

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { LobbyService } from '../../services/lobby.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-lobby',
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly lobby = inject(LobbyService);

  protected readonly loadError = signal('');
  protected readonly rooms$ = this.lobby.getAll().pipe(
    catchError((error: unknown) => {
      this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as mesas.');
      return of(null);
    }),
  );
}
```

`AsyncPipe` entra em `imports`. O componente já se chama `Lobby`. Mantenha o `selector: 'app-lobby'`.

```html
@if (loadError(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (rooms$ | async; as rooms) {
  <ul>
    @for (room of rooms; track room.id) {
      <li>
        <strong>{{ room.name }}</strong>
        <span>{{ room.status }}</span>
        <span>{{ room.playerIds.length }}/{{ room.maxPlayers }}</span>
        <span>{{ room.pointsToWin }} pontos</span>
      </li>
    } @empty {
      <li>Nenhuma mesa aberta.</li>
    }
  </ul>
} @else {
  <p>Carregando mesas...</p>
}
```

Você pode manter o visual que já está em `lobby.html`. O que sai são os textos fixos de mesa. No lugar deles, entra o `@for`.

## Criar uma mesa

Criar é formulário, como o login. A lista continua sendo `AsyncPipe`. São duas coisas no mesmo componente.

```ts
import { AuthService } from '../../services/auth.service';

private readonly auth = inject(AuthService);
protected readonly creating = signal(false);
protected readonly createError = signal('');

protected createRoom(name: string): void {
  const hostId = this.auth.session()?.user.id;
  if (!hostId || name.trim().length < 3) {
    this.createError.set('Entre na conta e escolha um nome com pelo menos 3 letras.');
    return;
  }

  this.creating.set(true);
  this.lobby
    .create({
      name: name.trim(),
      hostId,
      visibility: 'PUBLICA',
      maxPlayers: 2,
      pointsToWin: 12,
    })
    .subscribe({
      next: () => {
        this.creating.set(false);
        this.createError.set('');
        this.reload.set(this.reload() + 1);
      },
      error: (error: unknown) => {
        this.creating.set(false);
        this.createError.set(error instanceof Error ? error.message : 'Falha ao criar a mesa.');
      },
    });
}
```

A lista não atualiza sozinha depois do `POST`, porque o `AsyncPipe` já recebeu o primeiro array. Force uma nova leitura com um `signal` que entra no `pipe`:

```ts
private readonly reload = signal(0);

protected readonly rooms$ = toObservable(this.reload).pipe(
  switchMap(() => this.lobby.getAll()),
  catchError((error: unknown) => {
    this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as mesas.');
    return of(null);
  }),
);
```

Importe `toObservable` de `@angular/core/rxjs-interop` e `switchMap`, `catchError`, `of` de `rxjs`. Cada vez que `reload` muda, `getAll()` roda de novo.

No HTML, um campo e um botão chamam `createRoom`. Desabilite o botão com `[disabled]="creating()"`. Mostre `createError()` num `role="alert"` separado do erro da lista. São falhas diferentes: uma é "não consegui ler as mesas", a outra é "não consegui criar".

Nome com menos de 3 caracteres, `maxPlayers` fora de `2` ou `4`, ou `pointsToWin` fora de `12`, `15` e `30` faz a API responder `400`. O service transforma isso em "Falha ao criar a mesa."

## Confira

Logado, `/lobby` mostra "Mesa rápida" e "Desafio valendo quatro", que são as mesas da API. Crie "Mesa do Lucas" e veja a terceira aparecer sem recarregar o navegador.
