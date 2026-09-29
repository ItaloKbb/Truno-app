import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { CardService } from '../../services/card.service';

@Component({
  imports: [AsyncPipe],
  selector: 'app-book',
  styleUrl: './book.css',
  templateUrl: './book.html',
})
export class Book {
  protected readonly loadError = signal('');
  protected readonly cards$ = inject(CardService)
    .getAll()
    .pipe(
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as cartas.');
        return of(null);
      }),
    );
}
