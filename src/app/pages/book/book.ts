import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { cardLabel, type CatalogCard, type SkillDefinition, type SkillType } from '../../domain/truno-api';
import { CardService } from '../../services/modules/card.service';
import { SkillService } from '../../services/modules/skill.service';

/** Carta do catálogo com as habilidades vinculadas pelo mesmo naipe e valor. */
interface BookCard extends CatalogCard {
  label: string;
  skills: SkillDefinition[];
}

interface BookView {
  cards: BookCard[];
  /** Falha só das habilidades: as cartas continuam visíveis. */
  skillsError: string;
}

const SKILL_ICON: Record<SkillType, string> = {
  BLOCK: '⛔',
  THEFT: '🫳',
  INVERTS: '🔄',
  BUY: '➕',
  BURN: '🔥',
  SURPRISE: '🎁',
  PUZZLE: '❓',
  CHANGEOFHANDS: '🤝',
  BOMB: '💣',
  SHIELD: '🛡️',
};

@Component({
  selector: 'app-book',
  styleUrls: ['../lobby/lobby.css', './book.css'],
  templateUrl: './book.html',
  imports: [AsyncPipe],
})
export class Book implements OnInit {
  @Input({ required: true }) service!: CardService;
  @Input({ required: true }) skills!: SkillService;
  @Output() navigate = new EventEmitter<string>();

  protected readonly loadError = signal('');
  protected readonly onlyWithSkills = signal(false);

  book$!: Observable<BookView | null>;

  ngOnInit(): void {
    const skills$ = this.skills.getAll().pipe(
      map((skills) => ({ skills, error: '' })),
      catchError((error: unknown) =>
        of({ skills: [] as SkillDefinition[], error: error instanceof Error ? error.message : 'Falha ao carregar as habilidades.' }),
      ),
    );

    this.book$ = forkJoin([this.service.getAll(), skills$]).pipe(
      map(([cards, { skills, error }]) => ({
        cards: cards.map((card) => ({
          ...card,
          label: cardLabel(card.valor, card.naipe),
          skills: skills.filter((skill) => skill.naipe === card.naipe && skill.valor === card.valor),
        })),
        skillsError: error,
      })),
      catchError((error: unknown) => {
        this.loadError.set(error instanceof Error ? error.message : 'Falha ao carregar as cartas.');
        return of(null);
      }),
    );
  }

  visible(cards: BookCard[]): BookCard[] {
    return this.onlyWithSkills() ? cards.filter((card) => card.skills.length > 0) : cards;
  }

  skilledCount(cards: BookCard[]): number {
    return cards.filter((card) => card.skills.length > 0).length;
  }

  icon(type: SkillType): string {
    return SKILL_ICON[type];
  }

  toggleOnlyWithSkills(event: Event): void {
    this.onlyWithSkills.set((event.target as HTMLInputElement).checked);
  }

  go(event: Event, url: string): void {
    event.preventDefault();
    this.navigate.emit(url);
  }
}
