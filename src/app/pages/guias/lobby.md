# Lobby (`/lobby`)

O lobby é o ponto de entrada para partidas. Nesta atividade, você vai permitir que o jogador crie uma partida ou entre em uma existente usando um código.

## Objetivo

O lobby deverá criar uma partida, acessar uma existente, mostrar o estado de envio e navegar para `/partida/:id` após o sucesso.

## Vocabulário da atividade

- **lobby** (sala de espera): tela em que o jogador cria ou acessa uma partida.
- **create** (criar): operação `POST /games`.
- **access/join** (acessar/entrar): operação `POST /games/access`.
- **payload** (carga de dados): objeto enviado no corpo do `POST`.
- **mutation** (mutação): operação que altera dados no servidor.
- **pending** (pendente): estado enquanto a resposta ainda não chegou.

## Passo 1 — escolher o serviço correto

Não existe mais `LobbyService`. O contrato atual concentra criação, acesso e ações da partida no `GameService`, em `services/modules/game.service.ts`.

```ts
create(input: CreateGameInput): Observable<GameState>
access(code: string): Observable<GameState>
```

Os dois métodos devolvem o estado completo da partida. O `id` será usado na navegação.

## Passo 2 — preparar os estados

```ts
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import type { CreateGameInput, GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';

@Component({
  selector: 'app-lobby',
  styleUrl: './lobby.css',
  templateUrl: './lobby.html',
})
export class Lobby {
  private readonly games = inject(GameService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal('');
```

`pending` impede cliques duplicados. `errorMessage` mantém a falha visível sem usar `alert()` do navegador.

## Passo 3 — criar uma partida

```ts
protected createGame(name: string): void {
  const input: CreateGameInput = {
    name: name.trim(),
    maxPlayers: 4,
    initialCards: 3,
    roundReward: 10,
    emptyHandReward: 5,
    trophyPrice: 20,
  };

  if (input.name.length < 3) {
    this.errorMessage.set('Digite um nome com pelo menos 3 caracteres.');
    return;
  }

  this.run(this.games.create(input));
}
```

`CreateGameInput` é um **interface contract** (contrato de interface): descreve os campos esperados pela API.

## Passo 4 — entrar com um código

```ts
protected accessGame(code: string): void {
  if (!code.trim()) {
    this.errorMessage.set('Informe o código da partida.');
    return;
  }

  this.run(this.games.access(code));
}

private run(request: Observable<GameState>): void {
  this.pending.set(true);
  this.errorMessage.set('');

  request.subscribe({
    next: (game) => {
      this.pending.set(false);
      void this.router.navigate(['/partida', game.id]);
    },
    error: (error: unknown) => {
      this.pending.set(false);
      this.errorMessage.set(error instanceof Error ? error.message : 'Não foi possível abrir a partida.');
    },
  });
}
```

O método privado `run` remove duplicação. A API converte o código para maiúsculas dentro do serviço; o componente não repete essa regra.

## Passo 5 — ligar os formulários

```html
<section>
  <h2>Criar partida</h2>
  <label for="game-name">Nome da partida</label>
  <input #gameName id="game-name" type="text" />
  <button type="button" [disabled]="pending()" (click)="createGame(gameName.value)">Criar</button>
</section>

<section>
  <h2>Entrar com código</h2>
  <label for="game-code">Código</label>
  <input #gameCode id="game-code" type="text" />
  <button type="button" [disabled]="pending()" (click)="accessGame(gameCode.value)">Entrar</button>
</section>

@if (pending()) {
  <p role="status">Aguarde...</p>
}
@if (errorMessage(); as message) {
  <p role="alert">{{ message }}</p>
}
```

`#gameName` é uma **template reference variable** (variável de referência do template). Para formulários maiores, prefira `ReactiveFormsModule`, como no login.

## Passo 6 — conferir

1. Tente criar uma partida sem nome.
2. Crie uma partida válida e confira `/partida/<id>`.
3. Volte ao lobby e entre com o código da partida.
4. Tente um código inexistente e confira o alerta.

## Extra: chat do lobby

Abaixo de "Entrar com código" fica o componente `app-lobby-chat` (`components/lobby-chat`). É um chat global via HTTP comum, sem WebSocket:

- `GET /chat/messages?after=<id>`: **polling** (consulta periódica) a cada 3s, que traz só as mensagens novas.
- `POST /chat/messages` `{ text }`: envia, com no máximo 280 caracteres e um envio por segundo por jogador.

O `ChatService` (`services/modules/chat.service.ts`) segue o mesmo padrão `readApi` dos outros serviços. Quando uma mensagem contém um código de partida (6 caracteres do alfabeto `A-H J-N P-Z 2-9`), `splitMessage` (em `domain/chat.ts`) transforma esse trecho em um botão, e o clique chama `accessGame(code)`. Na sala de espera, o botão **Enviar no chat** publica o código da mesa.

## Erros comuns

- Importar `LobbyService`: ele não pertence mais ao contrato atual.
- Enviar `hostId`: a API identifica o jogador pelo token.
- Navegar para `/partida` sem o `id`.
- Manter o botão ativo durante o `POST`.
