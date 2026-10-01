import { Component, Input, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { PuzzleService } from '../../services/modules/puzzle.service';
import { PuzzleDefinition } from '../../domain/truno-api';

@Component({
  imports: [AsyncPipe],
  selector: 'app-perguntas',
  styleUrl: './perguntas.css',
  templateUrl: './perguntas.html',
})
export class Perguntas {
  protected readonly loadError = signal('');
  @Input({ required: true }) service!: PuzzleService;

  puzzles$!: Observable<PuzzleDefinition[]>;

  ngOnInit() {
    this.puzzles$ = this.service.getAll();
  }
}

 
