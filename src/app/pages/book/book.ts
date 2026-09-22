import { Component } from '@angular/core';
import { mock } from 'node:test';
import { mockCard } from '../../models/mock/card.mock';

@Component({
  imports: [],
  selector: 'app-book',
  styleUrl: './book.css',
  templateUrl: './book.html',
})
export class Book {
  protected readonly cards = [mockCard];
}
