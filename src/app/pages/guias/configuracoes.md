# Configurações (`/perfil/configuracoes`)

Esta tela não usa `ProfileService`. Preferência de notificação, som e perfil público fica no navegador, no `ProfileStorage`. Sair da conta usa o `AuthService`. São dois services, com motivos diferentes.

## Qual service usar

| Ação | Service | Por quê |
| --- | --- | --- |
| Ler e gravar os interruptores | `ProfileStorage` | A API de perfil não tem `PUT` de preferências. O contrato local é `ProfileSettings`. |
| Sair | `AuthService.logout()` | Apaga o token e avisa `POST /api/auth/logout`. |
| Nome, XP, coleção | Nenhum destes | Isso é a visão geral e as outras rotas do perfil. |

`ProfileSettings` tem três booleanos: `notifications`, `sounds` e `publicProfile`. A tela já chama `loadSettings()` e `saveSettings()`. Não troque isso por `getProfile()`.

## Interruptores

O padrão que já está em `profile-section.ts` é o certo:

```ts
private readonly profileStorage = inject(ProfileStorage);
protected readonly settings = signal<ProfileSettings>(this.profileStorage.loadSettings());

protected toggleSetting(setting: ProfileSettingKey): void {
  this.settings.update((current) => {
    const updated = { ...current, [setting]: !current[setting] };
    this.profileStorage.saveSettings(updated);
    return updated;
  });
}
```

`loadSettings()` na criação do `signal` lê o `localStorage` uma vez. `toggleSetting` grava o objeto inteiro, não uma chave solta. Recarregar `/perfil/configuracoes` mostra o último valor porque o storage devolveu o que foi salvo.

No template, o botão lê o signal e chama o método:

```html
<button
  type="button"
  [class.off]="!settings().sounds"
  (click)="toggleSetting('sounds')"
  aria-label="Alternar efeitos sonoros"
>
</button>
```

`settings()` com parênteses é a leitura do signal. Sem os parênteses, o HTML recebe a função, não o booleano.

Não coloque `AsyncPipe` aqui. `loadSettings()` devolve o objeto na hora, não um `Observable`.

## Sair da conta

Logout é formulário de uma ação só: o clique. Igual ao login, usa `subscribe`.

```ts
private readonly auth = inject(AuthService);
private readonly router = inject(Router);
protected readonly accountMessage = signal('');

protected logout(): void {
  this.auth.logout().subscribe(() => {
    this.accountMessage.set('Sessão encerrada.');
    void this.router.navigateByUrl('/home');
  });
}
```

`logout()` já limpa a sessão local antes do `POST`. Se a rede cair, o `subscribe` ainda segue para `/home`, porque o service engole o erro da requisição e completa. A pessoa não fica presa numa tela que exige login com o token já apagado.

O botão:

```html
<button type="button" (click)="logout()">Sair da conta</button>
@if (accountMessage(); as message) {
  <p role="status">{{ message }}</p>
}
```

`role="status"` e não `role="alert"`: sair deu certo. Alerta é para falha.

Depois do logout, abrir `/lobby` ou `/perfil` redireciona para `/home?returnUrl=...`. Se a sessão continuar valendo, `AuthService.logout()` não foi chamado, ou outro código gravou o token de novo.

## O que não fazer nesta tela

- Não busque `getProfile()` para preencher os três interruptores. O perfil remoto não tem `notifications`.
- Não apague o token com `localStorage.removeItem` na tela. Quem conhece a chave é o `AuthSessionStore`, chamado por `logout()`.
- Não trate "Desativar conta" e "Excluir conta" como logout. Esses botões da tela atual são demonstração e não têm endpoint. Deixe-os como estão até existir service para eles.
