# Partida (`/partida/:id`)

Nesta atividade, você vai ler o identificador da URL, carregar o `GameState` e atualizar a tela com o estado devolvido por cada ação.

## Objetivo

Exibir uma partida real e compreender o padrão usado por `start`, `playCard`, `answerPuzzle`, `buyTrophy`, `readyForNextRound` e `cancel`.

## Vocabulário da atividade

- **route parameter** (parâmetro de rota): valor dinâmico da URL; em `/partida/5`, o `id` é `5`.
- **state** (estado): retrato completo da partida em um instante.
- **action/mutation** (ação/mutação): comando que modifica a partida.
- **aggregate response** (resposta agregada): estado completo devolvido após a ação.
- **conflict** (conflito): resposta HTTP `409`, comum quando o estado mudou antes da sua ação.

## Passo 1 — conhecer o contrato

`GameService` não tem `getById`. O método de leitura é:

```ts
getState(gameId: number): Observable<GameState>
```

Todas as ações também devolvem `GameState`. Portanto, após uma ação bem-sucedida, substitua o estado local pela resposta. Não tente reproduzir no navegador as regras de turno, vencedor ou recompensa.

## Passo 2 — ler o `id` e carregar

```ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Observable } from 'rxjs';
import type { GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';

@Component({
  selector: 'app-partida',
  styleUrl: './partida.css',
  templateUrl: './partida.html',
})
export class Partida implements OnInit {
  private readonly games = inject(GameService);
  private readonly route = inject(ActivatedRoute);
  private readonly gameId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly game = signal<GameState | null>(null);
  protected readonly loading = signal(true);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!Number.isInteger(this.gameId) || this.gameId <= 0) {
      this.loading.set(false);
      this.errorMessage.set('Identificador de partida inválido.');
      return;
    }

    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.games.getState(this.gameId).subscribe({
      next: (game) => {
        this.game.set(game);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Falha ao carregar a partida.');
      },
    });
  }
}
```

`snapshot` é uma fotografia dos parâmetros quando o componente é criado. Ele basta se a tela for recriada ao trocar de partida. Se o mesmo componente permanecer aberto durante mudanças de `id`, use `paramMap` como `Observable`.

## Passo 3 — desenhar o estado

```html
@if (errorMessage(); as message) {
  <p role="alert">{{ message }}</p>
} @else if (game(); as current) {
  <h1>{{ current.name }}</h1>
  <p>Código: {{ current.code }}</p>
  <p>Fase: {{ current.phase }}</p>
  <p>Rodada: {{ current.roundNumber }}</p>

  <ul>
    @for (player of current.players; track player.id) {
      <li>
        <strong>{{ player.nickname }}</strong>
        <span>{{ player.handSize }} cartas</span>
        <span>{{ player.trophies }} troféus</span>
        @if (player.host) { <span>Anfitrião</span> }
      </li>
    } @empty {
      <li>Aguardando jogadores.</li>
    }
  </ul>

  <h2>Sua mão</h2>
  @for (card of current.hand; track card.handCardId) {
    <button type="button" [disabled]="pending()" (click)="play(card.handCardId)">
      {{ card.valor }} de {{ card.naipe }}
    </button>
  }
} @else if (loading()) {
  <p>Carregando a partida...</p>
}
```

`current.hand` contém somente a mão do jogador autenticado. Para adversários, a API fornece apenas `handSize`. Isso evita expor informação secreta.

## Passo 4 — executar ações

```ts
protected play(handCardId: number | null): void {
  if (handCardId === null) return;
  this.run(this.games.playCard(this.gameId, handCardId));
}

protected start(): void {
  this.run(this.games.start(this.gameId));
}

private run(request: Observable<GameState>): void {
  this.pending.set(true);
  this.errorMessage.set('');

  request.subscribe({
    next: (updated) => {
      this.game.set(updated);
      this.pending.set(false);
    },
    error: (error: unknown) => {
      this.pending.set(false);
      this.errorMessage.set(error instanceof Error ? error.message : 'A ação não pôde ser concluída.');
    },
  });
}
```

O método `run` centraliza o padrão. Ele não acrescenta uma carta nem muda o turno manualmente; aceita o novo estado calculado pela API.

## Passo 5 — tratar perguntas pendentes

Quando `current.pendingPuzzle` existir, mostre `question` e `alternatives`. O índice clicado é enviado a:

```ts
this.games.answerPuzzle(this.gameId, puzzle.challengeId, alternativeIndex)
```

A pergunta pública nunca informa a resposta correta. Quem decide o resultado é o servidor.

## Checklist

- [ ] O `id` vem da rota e é validado como número positivo.
- [ ] O estado retornado substitui o anterior.
- [ ] Somente `handCardId` é enviado ao jogar.
- [ ] Botões ficam desabilitados durante uma ação.
- [ ] Um erro `409` é mostrado e pode ser seguido por nova leitura do estado.

## Atualização e nomes das fases

A tela consulta o estado da partida automaticamente a cada dois segundos, sem
recarregar a página. A API continua sendo a fonte de verdade; a tela só aplica
respostas com uma versão (`stateVersion`) igual ou mais recente que a exibida.
Entre rodadas, a fase aparece como **Fase de compra de troféus** e cada jogador
pode confirmar **PRONTO**. O botão fica verde quando a API indicar que o
jogador autenticado já confirmou a prontidão.
