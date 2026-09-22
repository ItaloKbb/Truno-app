import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { profileUser } from '../profile/profile.data';

type Section = 'colecao' | 'conquistas' | 'configuracoes' | 'historico' | 'editar';
type CollectionFilter = 'all' | 'obtained' | 'missing';
type Setting = 'notifications' | 'sounds' | 'publicProfile';
interface Card { name: string; rarity: string; level: number; obtained: boolean; }

@Component({ imports: [RouterLink], selector: 'app-profile-section', styleUrl: './profile-section.css', templateUrl: './profile-section.html' })
export class ProfileSection {
  private readonly route = inject(ActivatedRoute);
  protected readonly section = this.route.snapshot.data['section'] as Section;
  protected readonly user = profileUser;
  protected readonly activeFilter = signal<CollectionFilter>('all');
  protected readonly searchTerm = signal('');
  protected readonly settings = signal<Record<Setting, boolean>>({ notifications: true, sounds: true, publicProfile: false });
  protected readonly draft = signal({ displayName: this.user.displayName, username: this.user.username, bio: 'Jogador competitivo e colecionador de cartas.' });
  protected readonly formError = signal('');
  protected readonly saveMessage = signal('');
  protected readonly cards: Card[] = [
    { name: 'Guardião da Floresta', rarity: 'Rara', level: 3, obtained: true }, { name: 'Feiticeira Lunar', rarity: 'Épica', level: 4, obtained: true }, { name: 'Dragão Rubro', rarity: 'Lendária', level: 5, obtained: true }, { name: 'Sentinela de Gelo', rarity: 'Rara', level: 6, obtained: true }, { name: 'Caçador Solar', rarity: 'Desconhecida', level: 0, obtained: false }, { name: 'Oráculo das Marés', rarity: 'Desconhecida', level: 0, obtained: false },
  ];
  protected readonly titles: Record<Section, { title: string; subtitle: string }> = {
    colecao: { title: 'Minha coleção', subtitle: '186 de 300 cartas encontradas' }, conquistas: { title: 'Conquistas', subtitle: '24 conquistas desbloqueadas' }, configuracoes: { title: 'Configurações', subtitle: 'Personalize sua experiência no Truno' }, historico: { title: 'Histórico de partidas', subtitle: 'Acompanhe seus resultados mais recentes' }, editar: { title: 'Editar perfil', subtitle: 'Atualize as informações exibidas para outros jogadores' },
  };
  protected get filteredCards(): Card[] { const filter = this.activeFilter(); const term = this.searchTerm().trim().toLocaleLowerCase(); return this.cards.filter((card) => (filter === 'all' || (filter === 'obtained' ? card.obtained : !card.obtained)) && (!term || card.name.toLocaleLowerCase().includes(term))); }
  protected setFilter(filter: CollectionFilter): void { this.activeFilter.set(filter); }
  protected setSearchTerm(value: string): void { this.searchTerm.set(value); }
  protected toggleSetting(setting: Setting): void { this.settings.update((current) => ({ ...current, [setting]: !current[setting] })); }
  protected updateDraft(field: 'displayName' | 'username' | 'bio', value: string): void { this.draft.update((current) => ({ ...current, [field]: value })); this.formError.set(''); this.saveMessage.set(''); }
  protected saveProfile(): void { const draft = this.draft(); const displayName = draft.displayName.trim(); const username = draft.username.trim(); if (displayName.length < 3) { this.formError.set('O nome de exibição deve ter pelo menos 3 caracteres.'); return; } if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { this.formError.set('Use de 3 a 20 letras, números ou _ no nome de usuário.'); return; } this.user.displayName = displayName; this.user.username = username; this.user.initials = displayName.split(/\s+/).slice(0, 2).map((name) => name[0]).join('').toUpperCase(); this.saveMessage.set('Alterações salvas com sucesso.'); }
}
