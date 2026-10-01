import { Component, inject, Input, Output, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { CardService } from '../../services/modules/card.service';
import { Observable } from 'rxjs';
import { CardSuit, CatalogCard } from '../../domain/truno-api';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-book',
  styleUrl: './book.css',
  templateUrl: './book.html',
  imports: [AsyncPipe],
})
export class Book {
  @Input({ required: true }) service!: CardService;
  @Output() navigate = new EventEmitter<string>();

  loadError$ = signal(false);

  cards$!: Observable<CatalogCard[]>;
  naipe$!: CardSuit;

  ngOnInit(): void {
    this.cards$ = this.service.getAll();
  }
  go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }
}
