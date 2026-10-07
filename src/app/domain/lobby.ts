import type { PointsToWin } from './game';

export const LOBBY_VISIBILITIES = ['PUBLICA', 'PRIVADA'] as const;
export type LobbyVisibility = (typeof LOBBY_VISIBILITIES)[number];

export const LOBBY_STATUSES = ['ABERTA', 'EM_JOGO', 'ENCERRADA'] as const;
export type LobbyStatus = (typeof LOBBY_STATUSES)[number];

export type TableSize = 2 | 4;

export interface LobbyRoom {
  id: string;
  name: string;
  hostId: string;
  visibility: LobbyVisibility;
  maxPlayers: TableSize;
  playerIds: string[];
  pointsToWin: PointsToWin;
  status: LobbyStatus;
}

export interface CreateLobbyRoom {
  name: string;
  hostId: string;
  visibility: LobbyVisibility;
  maxPlayers: TableSize;
  pointsToWin: PointsToWin;
}
