# Perfil do jogador

## Rotas

| Rota | Página | Objetivo |
| --- | --- | --- |
| `/perfil` | Visão geral | Exibir identidade, progresso e resumo da conta. |
| `/perfil/editar` | Editar perfil | Atualizar dados públicos do jogador. |
| `/perfil/colecao` | Coleção | Consultar cartas obtidas e progresso de raridades. |
| `/perfil/conquistas` | Conquistas | Mostrar medalhas, missões e metas desbloqueadas. |
| `/perfil/configuracoes` | Configurações | Preferências e segurança da conta. |

## 1. Visão geral (`/perfil`)

### Cabeçalho

- Avatar do jogador, com botão para alterar a imagem.
- Nome de exibição e `@usuario`.
- Nível atual e uma barra de experiência (`1.250 / 1.500 XP`).
- Botão **Editar perfil**.

### Estatísticas rápidas

- Partidas jogadas.
- Vitórias e taxa de vitória.
- Sequência atual de vitórias.
- Moedas e gemas disponíveis.

### Conteúdo principal

- Card **Progresso da coleção**: quantidade de cartas coletadas, barra percentual e atalho para a coleção.
- Card **Conquistas recentes**: três últimas conquistas desbloqueadas e atalho para todas.
- Card **Atividade recente**: últimas partidas, resultado, oponente e data.
- Card **Próxima meta**: uma missão em andamento com recompensa e progresso.

### Estado vazio

Para conta nova, exibir uma mensagem de boas-vindas e CTAs para **Jogar primeira partida** e **Ver coleção**. Estatísticas devem começar em zero, sem blocos vazios sem explicação.

## 2. Editar perfil (`/perfil/editar`)

### Campos

- Foto de perfil (upload, prévia e remoção).
- Nome de exibição — obrigatório, entre 3 e 24 caracteres.
- Nome de usuário — único, entre 3 e 20 caracteres, apenas letras, números e `_`.
- Biografia — opcional, até 160 caracteres, com contador.
- Carta favorita — seletor entre as cartas já obtidas.

### Ações e validações

- Botões **Salvar alterações** e **Cancelar**.
- Desabilitar salvar enquanto não houver alterações ou se algum campo estiver inválido.
- Exibir feedback de sucesso após salvar e mensagens junto ao campo com erro.
- Avisar antes de sair caso existam alterações não salvas.

## 3. Coleção (`/perfil/colecao`)

### Estrutura

- Total de cartas: `obtidas / total` e percentual geral.
- Filtros por raridade, tipo, elemento e status (`todas`, `obtidas`, `não obtidas`).
- Busca por nome da carta.
- Grade responsiva com imagem, nome, raridade, nível e quantidade.

### Interações

- Ao selecionar uma carta, abrir detalhes: atributos, descrição, origem e histórico de obtenção.
- Cartas bloqueadas mostram silhueta, raridade e dica de como desbloquear; não revelam os atributos.
- Botão para ordenar por nome, raridade, nível ou aquisição mais recente.

### Estados

- Carregando: skeletons na grade.
- Sem resultados: informar que nenhum filtro encontrou cartas e oferecer **Limpar filtros**.

## 4. Conquistas (`/perfil/conquistas`)

- Resumo no topo: conquistas desbloqueadas, total de pontos e percentual concluído.
- Abas ou filtros: `todas`, `desbloqueadas` e `em progresso`.
- Cada conquista deve apresentar ícone, título, descrição, progresso, recompensa e data de desbloqueio quando aplicável.
- Conquistas bloqueadas mantêm a descrição visível, porém com aparência reduzida.
- Destaque uma conquista próxima de ser completada na parte superior da página.

## 5. Configurações (`/perfil/configuracoes`)

### Preferências

- Idioma.
- Efeitos sonoros e música.
- Notificações de missões, eventos e desafios.
- Visibilidade do perfil: público, apenas amigos ou privado.

### Conta e segurança

- E-mail cadastrado e ação para alterar.
- Alterar senha.
- Sessões ativas, com opção de encerrar sessões desconhecidas.
- Botão de exclusão de conta separado das demais ações, com confirmação explícita.

## Navegação e responsividade

- Desktop: menu lateral fixo do perfil com avatar, nome e links das cinco seções.
- Mobile: cabeçalho compacto e navegação horizontal rolável ou menu suspenso.
- O item da página atual deve permanecer visualmente destacado.
- Todos os controles precisam de rótulos acessíveis, foco visível e contraste adequado.

## Dados mínimos necessários

```ts
interface Profile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  coins: number;
  gems: number;
  favoriteCardId?: string;
}
```

Além do perfil, serão necessárias estruturas para estatísticas, atividades, cartas da coleção, conquistas e preferências. Enquanto a API não estiver pronta, usar dados mockados seguindo esses mesmos campos.
