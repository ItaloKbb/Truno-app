import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Avatar } from '../../components/avatar/avatar';
import { ProfileStorage } from '../../services/profile-storage';

type Section = 'colecao' | 'conquistas' | 'configuracoes' | 'historico' | 'editar';
type CollectionFilter = 'all' | 'obtained' | 'missing';
type Setting = 'notifications' | 'sounds' | 'publicProfile';
interface Card { name: string; rarity: string; level: number; obtained: boolean; }

@Component({ imports: [Avatar, RouterLink], selector: 'app-profile-section', styleUrl: './profile-section.css', templateUrl: './profile-section.html' })
export class ProfileSection {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly profileStorage = inject(ProfileStorage);
  protected readonly section = this.route.snapshot.data['section'] as Section;
  protected readonly user = this.profileStorage.loadProfile();
  protected readonly activeFilter = signal<CollectionFilter>('all');
  protected readonly searchTerm = signal('');
  protected readonly settings = signal<Record<Setting, boolean>>(this.profileStorage.loadSettings());
  protected readonly draft = signal({ displayName: this.user.displayName, username: this.user.username, avatarUrl: this.user.avatarUrl, bio: 'Jogador competitivo e colecionador de cartas.' });
  protected readonly formError = signal('');
  protected readonly saveMessage = signal('');
  protected readonly accountMessage = signal('');
  protected readonly deactivateConfirmationVisible = signal(false);
  protected readonly deleteConfirmationVisible = signal(false);
  protected readonly accountFormVisible = signal<'email' | 'password' | null>(null);
  protected readonly cards: Card[] = [
    { name: 'Guardião da Floresta', rarity: 'Rara', level: 3, obtained: true }, { name: 'Feiticeira Lunar', rarity: 'Épica', level: 4, obtained: true }, { name: 'Dragão Rubro', rarity: 'Lendária', level: 5, obtained: true }, { name: 'Sentinela de Gelo', rarity: 'Rara', level: 6, obtained: true }, { name: 'Caçador Solar', rarity: 'Desconhecida', level: 0, obtained: false }, { name: 'Oráculo das Marés', rarity: 'Desconhecida', level: 0, obtained: false },
  ];
  protected readonly titles: Record<Section, { title: string; subtitle: string }> = {
    colecao: { title: 'Minha coleção', subtitle: '186 de 300 cartas encontradas' }, conquistas: { title: 'Conquistas', subtitle: '24 conquistas desbloqueadas' }, configuracoes: { title: 'Configurações', subtitle: 'Personalize sua experiência no Truno' }, historico: { title: 'Histórico de partidas', subtitle: 'Acompanhe seus resultados mais recentes' }, editar: { title: 'Editar perfil', subtitle: 'Atualize as informações exibidas para outros jogadores' },
  };
  protected get filteredCards(): Card[] { const filter = this.activeFilter(); const term = this.searchTerm().trim().toLocaleLowerCase(); return this.cards.filter((card) => (filter === 'all' || (filter === 'obtained' ? card.obtained : !card.obtained)) && (!term || card.name.toLocaleLowerCase().includes(term))); }
  protected setFilter(filter: CollectionFilter): void { this.activeFilter.set(filter); }
  protected setSearchTerm(value: string): void { this.searchTerm.set(value); }
  protected toggleSetting(setting: Setting): void { this.settings.update((current) => { const updated = { ...current, [setting]: !current[setting] }; this.profileStorage.saveSettings(updated); return updated; }); }
  protected onAvatarFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.formError.set('Escolha um arquivo de imagem.'); return; }
    if (file.size > 5 * 1024 * 1024) { this.formError.set('A imagem deve ter no máximo 5 MB.'); return; }
    this.updateDraft('avatarUrl', URL.createObjectURL(file));
  }
  protected updateDraft(field: 'displayName' | 'username' | 'avatarUrl' | 'bio', value: string): void { this.draft.update((current) => ({ ...current, [field]: value })); this.formError.set(''); this.saveMessage.set(''); }
  protected saveProfile(): void { const draft = this.draft(); const displayName = draft.displayName.trim(); const username = draft.username.trim(); if (displayName.length < 3) { this.formError.set('O nome de exibição deve ter pelo menos 3 caracteres.'); return; } if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { this.formError.set('Use de 3 a 20 letras, números ou _ no nome de usuário.'); return; } this.user.displayName = displayName; this.user.username = username; this.user.avatarUrl = draft.avatarUrl.trim(); this.user.initials = displayName.split(/\s+/).slice(0, 2).map((name) => name[0]).join('').toUpperCase(); this.profileStorage.saveProfile(); this.saveMessage.set('Alterações salvas com sucesso.'); }
  protected logout(): void { this.accountMessage.set('Sessão encerrada.'); this.router.navigateByUrl('/home'); }
  protected requestDeactivation(): void { this.deactivateConfirmationVisible.set(true); }
  protected cancelDeactivation(): void { this.deactivateConfirmationVisible.set(false); }
  protected deactivateAccount(): void { this.accountMessage.set('Conta desativada nesta demonstração.'); this.deactivateConfirmationVisible.set(false); }
  protected showAccountForm(form: 'email' | 'password'): void { this.accountFormVisible.set(form); this.accountMessage.set(''); }
  protected cancelAccountForm(): void { this.accountFormVisible.set(null); }
  protected saveAccountForm(): void { this.accountMessage.set('Alteração salva nesta demonstração.'); this.accountFormVisible.set(null); }
  protected requestDeletion(): void { this.deleteConfirmationVisible.set(true); }
  protected cancelDeletion(): void { this.deleteConfirmationVisible.set(false); }
  protected deleteAccount(): void { this.accountMessage.set('Solicitação de exclusão registrada nesta demonstração.'); this.deleteConfirmationVisible.set(false); }
}
