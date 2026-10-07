import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CARD_SUITS, CARD_VALUES, SKILL_TYPES, cardAsset, cardLabel,
  type CatalogCard, type SkillDefinition,
} from '../../domain/truno-api';
import { AdminService, AdminSessionStore, type AdminPuzzle, type PuzzleInput, type SkillInput } from '../../services/modules/admin.service';
import { CardService } from '../../services/modules/card.service';

export type AdminSection = 'home' | 'cartas' | 'skills' | 'puzzles';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  @Input() section: AdminSection = 'home';

  private readonly api = inject(AdminService);
  private readonly cardService = inject(CardService);
  private readonly router = inject(Router);
  protected readonly session = inject(AdminSessionStore);

  protected readonly suits = CARD_SUITS;
  protected readonly values = CARD_VALUES;
  protected readonly types = SKILL_TYPES;
  protected readonly cards = signal<CatalogCard[]>([]);
  protected readonly skills = signal<SkillDefinition[]>([]);
  protected readonly puzzles = signal<AdminPuzzle[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected username = '';
  protected password = '';
  protected selectedCardId: number | null = null;
  protected editingSkillId: number | null = null;
  protected editingPuzzleId: number | null = null;
  protected skillFormOpen = false;
  protected puzzleFormOpen = false;
  protected skillDraft: SkillInput = this.emptySkill();
  protected puzzleDraft: PuzzleInput = this.emptyPuzzle();

  ngOnInit(): void {
    if (!this.session.token()) return;
    this.api.verify().subscribe({
      next: () => this.load(),
      error: () => this.error.set('A sessão expirou. Entre novamente.'),
    });
  }

  protected login(): void {
    this.error.set('');
    this.saving.set(true);
    this.api.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.saving.set(false);
        this.password = '';
        const requested = this.router.routerState.snapshot.root.queryParamMap.get('returnUrl');
        const destination = requested && ['/admin/cartas', '/admin/skills', '/admin/puzzles'].includes(requested)
          ? requested : '/admin/cartas';
        void this.router.navigateByUrl(destination);
      },
      error: (error: Error) => {
        this.saving.set(false);
        this.error.set(error.message);
      },
    });
  }

  protected logout(): void {
    this.api.logout().subscribe(() => void this.router.navigateByUrl('/admin'));
  }

  protected load(): void {
    this.error.set('');
    if (this.section === 'home') return;
    this.loading.set(true);
    if (this.section === 'puzzles') {
      this.api.puzzles().subscribe({
        next: puzzles => { this.puzzles.set(puzzles); this.loading.set(false); },
        error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      });
      return;
    }
    forkJoin({ cards: this.cardService.getAll(), skills: this.api.skills() }).subscribe({
      next: ({ cards, skills }) => {
        this.cards.set(cards);
        this.skills.set(skills);
        this.loading.set(false);
      },
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
    });
  }

  protected cardName(card: CatalogCard): string { return cardLabel(card.valor, card.naipe); }
  protected cardImage(card: CatalogCard): string { return cardAsset(card.valor, card.naipe); }
  protected cardSkill(card: CatalogCard): SkillDefinition | undefined {
    return this.skills().find(skill => skill.valor === card.valor && skill.naipe === card.naipe);
  }

  protected newSkill(card?: CatalogCard): void {
    this.error.set('');
    this.success.set('');
    this.editingSkillId = null;
    this.skillDraft = this.emptySkill();
    this.selectedCardId = card?.id ?? null;
    this.skillFormOpen = true;
  }

  protected editSkill(skill: SkillDefinition): void {
    this.error.set('');
    this.success.set('');
    this.editingSkillId = skill.id;
    this.skillDraft = { name: skill.name, description: skill.description,
      type: skill.type, naipe: skill.naipe, valor: skill.valor };
    this.selectedCardId = this.cards().find(card => card.valor === skill.valor && card.naipe === skill.naipe)?.id ?? null;
    this.skillFormOpen = true;
  }

  protected saveSkill(): void {
    const card = this.cards().find(item => item.id === this.selectedCardId);
    if (!card) { this.error.set('Escolha uma carta.'); return; }
    const input = { ...this.skillDraft, name: this.skillDraft.name.trim(),
      description: this.skillDraft.description.trim(), valor: card.valor, naipe: card.naipe };
    if (!input.name || !input.description) { this.error.set('Preencha nome e descrição.'); return; }
    this.error.set('');
    this.saving.set(true);
    this.api.saveSkill(input, this.editingSkillId ?? undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.skillFormOpen = false;
        this.success.set('Skill salva.');
        this.load();
      },
      error: (error: Error) => { this.saving.set(false); this.error.set(error.message); },
    });
  }

  protected deleteSkill(skill: SkillDefinition): void {
    if (!window.confirm(`Excluir a skill "${skill.name}"?`)) return;
    this.error.set('');
    this.api.deleteSkill(skill.id).subscribe({
      next: () => { this.skillFormOpen = false; this.success.set('Skill excluída.'); this.load(); },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected newPuzzle(): void {
    this.error.set('');
    this.success.set('');
    this.editingPuzzleId = null;
    this.puzzleDraft = this.emptyPuzzle();
    this.puzzleFormOpen = true;
  }

  protected editPuzzle(puzzle: AdminPuzzle): void {
    this.error.set('');
    this.success.set('');
    this.editingPuzzleId = puzzle.id;
    this.puzzleDraft = { question: puzzle.question, alternativas: [...puzzle.alternativas],
      alternativaCorreta: puzzle.alternativaCorreta };
    this.puzzleFormOpen = true;
  }

  protected addAlternative(): void { this.puzzleDraft.alternativas.push(''); }
  protected removeAlternative(index: number): void {
    if (this.puzzleDraft.alternativas.length <= 2) return;
    this.puzzleDraft.alternativas.splice(index, 1);
    if (this.puzzleDraft.alternativaCorreta === index) this.puzzleDraft.alternativaCorreta = 0;
    else if (this.puzzleDraft.alternativaCorreta > index) this.puzzleDraft.alternativaCorreta--;
  }

  protected savePuzzle(): void {
    const input = { question: this.puzzleDraft.question.trim(),
      alternativas: this.puzzleDraft.alternativas.map(item => item.trim()),
      alternativaCorreta: this.puzzleDraft.alternativaCorreta };
    if (!input.question || input.alternativas.some(item => !item)) {
      this.error.set('Preencha a pergunta e todas as alternativas.'); return;
    }
    this.error.set('');
    this.saving.set(true);
    this.api.savePuzzle(input, this.editingPuzzleId ?? undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.puzzleFormOpen = false;
        this.success.set('Puzzle salvo.');
        this.load();
      },
      error: (error: Error) => { this.saving.set(false); this.error.set(error.message); },
    });
  }

  protected deletePuzzle(puzzle: AdminPuzzle): void {
    if (!window.confirm(`Excluir o puzzle "${puzzle.question}"?`)) return;
    this.error.set('');
    this.api.deletePuzzle(puzzle.id).subscribe({
      next: () => { this.puzzleFormOpen = false; this.success.set('Puzzle excluído.'); this.load(); },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  private emptySkill(): SkillInput {
    return { name: '', description: '', type: SKILL_TYPES[0], naipe: CARD_SUITS[0], valor: CARD_VALUES[0] };
  }

  private emptyPuzzle(): PuzzleInput {
    return { question: '', alternativas: ['', '', '', ''], alternativaCorreta: 0 };
  }
}
