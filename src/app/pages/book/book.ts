import { Component, inject, signal } from '@angular/core';
import  {AsyncPipe} from '@angular/common';
import {catchError, of} from 'rxjs';
import {CardService} from '../../services/modules/card.service';

@Component({
  selector: 'app-book',
  styleUrl: './book.css',
  templateUrl: './book.html',
  imports: [AsyncPipe],
})
export class Book {
  protected readonly loadError$ = signal(' ');
  protected readonly cards$ = inject(CardService)
  .getAll()
  .pipe(
    catchError((error) => {
      this.loadError$.set(error instanceof Error ? error.message : 'Falha ao carregar cartas. Tente novamente mais tarde.');
      return of([]);
    })
  );
}