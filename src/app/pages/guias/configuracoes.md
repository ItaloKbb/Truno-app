# Configurações (`/perfil/configuracoes`)

Esta tela trabalha com dados locais. As preferências ficam no navegador por meio de `ProfileStorage`; sair da conta usa `AuthService`.

## Objetivo

Ler e salvar preferências, explicar a diferença entre estado local e remoto e encerrar a sessão com segurança.

## Vocabulário da atividade

- **settings** (configurações): preferências escolhidas pelo usuário.
- **storage** (armazenamento): lugar onde os dados são guardados.
- **localStorage** (armazenamento local): API do navegador que persiste texto entre recargas.
- **persistence** (persistência): capacidade de manter um valor após fechar ou recarregar a tela.
- **toggle** (alternar): trocar um booleano entre `true` e `false`.
- **logout/sign out** (sair): encerrar a sessão local.

## Passo 1 — separar responsabilidades

| Ação | Classe correta | Motivo |
| --- | --- | --- |
| Ler e salvar preferências | `ProfileStorage` | Os valores ficam no navegador. |
| Encerrar a sessão | `AuthService` | Ele conhece o armazenamento da autenticação. |
| Buscar estatísticas | `ProfileService` | Esses dados pertencem à API. |

A tela não deve chamar `localStorage` diretamente. O `ProfileStorage` encapsula a chave, o JSON e os valores padrão.

## Passo 2 — criar o signal de configurações

```ts
import type { ProfileSettingKey, ProfileSettings } from '../../domain/profile';
import { ProfileStorage } from '../../services/modules/profile-storage';

private readonly profileStorage = inject(ProfileStorage);

protected readonly settings = signal<ProfileSettings>(
  this.profileStorage.loadSettings(),
);
```

`loadSettings()` é síncrono: devolve o objeto imediatamente. Por isso não usamos `AsyncPipe`.

## Passo 3 — alternar e persistir

```ts
protected toggleSetting(setting: ProfileSettingKey): void {
  this.settings.update((current) => {
    const updated = { ...current, [setting]: !current[setting] };
    this.profileStorage.saveSettings(updated);
    return updated;
  });
}
```

`[setting]` é uma **computed property** (propriedade computada): a chave vem do parâmetro. O objeto é copiado para manter uma atualização imutável.

```html
<button
  type="button"
  [attr.aria-pressed]="settings().sounds"
  (click)="toggleSetting('sounds')"
>
  Sons: {{ settings().sounds ? 'ativados' : 'desativados' }}
</button>
```

`aria-pressed` informa o estado do botão a leitores de tela.

## Passo 4 — sair da conta

```ts
private readonly auth = inject(AuthService);
private readonly router = inject(Router);

protected logout(): void {
  this.auth.logout().subscribe(() => {
    void this.router.navigateByUrl('/home');
  });
}
```

O contrato atual não chama um endpoint remoto de logout. `AuthService.logout()` limpa a sessão local e devolve um `Observable<void>` concluído.

```html
<button type="button" (click)="logout()">Sair da conta</button>
```

## Passo 5 — conferir a persistência

1. Altere uma preferência.
2. Recarregue a página.
3. Confirme que o valor foi mantido.
4. Saia da conta.
5. Tente abrir `/perfil` e confirme o redirecionamento para `/home`.

## Erros comuns

- Usar `ProfileService` para preferências que não existem na API.
- Chamar `localStorage.removeItem` no componente.
- Esquecer os parênteses de um signal: use `settings()`, não `settings`.
- Tratar “Excluir conta” como logout. São ações diferentes e exigem contratos diferentes.
