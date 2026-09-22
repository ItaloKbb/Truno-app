import { Component } from '@angular/core';
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
