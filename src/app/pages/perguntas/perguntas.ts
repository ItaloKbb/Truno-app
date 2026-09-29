import { Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { PuzzleService } from '../../services/modules/puzzle.service';


@Component({
  imports: [AsyncPipe],
  selector: 'app-perguntas',
  styleUrl: './perguntas.css',
  templateUrl: './perguntas.html',
})
export class Perguntas {
  protected readonly loadError = signal('');
  protected readonly puzzles$ = inject(PuzzleService)
    .getAll()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message :'Falha ao carregar as perguntas. Tente novamente mais tarde.');
        return of(null);
      })
    );

}

