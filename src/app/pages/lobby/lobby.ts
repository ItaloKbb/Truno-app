import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CreateGameInput, GameState } from '../../domain/truno-api';
import { GameService } from '../../services/modules/game.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

type FormFields = 'name' | 'maxPlayers' | 'initialCards' | 'roundReward' | 'emptyHandReward' | 'trophyPrice';

@Component({
  selector: 'app-lobby',
  imports: [ReactiveFormsModule],
  styleUrl: './lobby.css',
  templateUrl: './lobby.html',
})
export class Lobby {
  @Input({ required: true }) games!: GameService;
  @Output() navigate = new EventEmitter<string>();

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = new FormGroup({

    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)],
    }),

    maxPlayers: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(2),
        Validators.max(6),
      ],
    }),

    initialCards: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(3),
        Validators.max(5),
      ],
    }),

    roundReward: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(5),
      ],
    }),

    emptyHandReward: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(6),
        Validators.max(10),
      ],
    }),

    trophyPrice: new FormControl<number | null>(null, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(20),
        Validators.max(40),
      ],
    }),


  });

  protected createGame(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const input: CreateGameInput = {
      name: value.name.trim(),
      maxPlayers: Number(value.maxPlayers),
      initialCards: Number(value.initialCards),
      roundReward: Number(value.roundReward),
      emptyHandReward: Number(value.emptyHandReward),
      trophyPrice: Number(value.trophyPrice),
    };

    if (input.name.length < 3) {
      this.errorMessage.set('Digite um nome com pelo menos 3 caracteres.');
      return;
    }

    const numbers = [input.maxPlayers, input.initialCards, input.roundReward, input.emptyHandReward, input.trophyPrice];
    if (!numbers.every(Number.isInteger)) {
      this.errorMessage.set('Use apenas números inteiros nos parâmetros da partida.');
      return;
    }

    this.run(this.games.create(input));
  }

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
        this.navigate.emit(`/partida/${game.id}`);
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Não foi possível abrir a partida.',
        );
      },
    });
  }

  protected fieldError(field: FormFields): string {
    const control = this.form.controls[field];

    if (!control || (!control.touched && !control.dirty) || !control.errors) {
      return '';
    }

    const errors = control.errors;

    switch (field) {
      case 'name':
        if (errors['required']) return 'Informe o nome.';
        if (errors['minlength']) return `Use pelo menos ${errors['minlength'].requiredLength} caracteres.`;
        if (errors['maxlength']) return `Use até ${errors['maxlength'].requiredLength} caracteres.`;
        break;

      case 'maxPlayers':
        if (errors['required']) return 'Informe o número de jogadores.';
        if (errors['min']) return `O mínimo é de ${errors['min'].min} jogadores.`;
        if (errors['max']) return `O máximo é de ${errors['max'].max} jogadores.`;
        break;

      case 'initialCards':
        if (errors['required']) return 'Informe a quantidade de cartas iniciais.';
        if (errors['min']) return `Mínimo de ${errors['min'].min} cartas.`;
        if (errors['max']) return `Máximo de ${errors['max'].max} cartas.`;
        break;

      case 'roundReward':
        if (errors['required']) return 'Informe a recompensa de rodada.';
        if (errors['min']) return `O valor mínimo é ${errors['min'].min}.`;
        if (errors['max']) return `O valor máximo é ${errors['max'].max}.`;
        break;

      case 'emptyHandReward':
        if (errors['required']) return 'Informe a recompensa de mão vazia.';
        if (errors['min']) return `O valor mínimo é ${errors['min'].min}.`;
        if (errors['max']) return `O valor máximo é ${errors['max'].max}.`;
        break;

      case 'trophyPrice':
        if (errors['required']) return 'Informe o preço do troféu.';
        if (errors['min']) return `O valor mínimo é ${errors['min'].min}.`;
        if (errors['max']) return `O valor máximo é ${errors['max'].max}.`;
        break;
    }

    return '';
  }


}





