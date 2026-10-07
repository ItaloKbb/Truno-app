/** Aumento de pontos da mão, no estilo Truco. */
export const TRUCO_CALLS = ['TRUCO', 'RETRUCO', 'VALE_QUATRO'] as const;
export type TrucoCall = (typeof TRUCO_CALLS)[number];

/** Disputa de pontos de naipe antes das vazas. */
export const ENVIDO_CALLS = ['ENVIDO', 'REAL_ENVIDO', 'FALTA_ENVIDO'] as const;
export type EnvidoCall = (typeof ENVIDO_CALLS)[number];

export const STAKE_RESPONSES = ['ACEITO', 'CORRO', 'AUMENTO'] as const;
export type StakeResponse = (typeof STAKE_RESPONSES)[number];

export type StakeKind = 'TRUCO' | 'ENVIDO';

export interface StakeChallenge {
  id: string;
  kind: StakeKind;
  call: TrucoCall | EnvidoCall;
  callerId: string;
  response: StakeResponse | null;
  /** Pontos que a mão passa a valer se o pedido for aceito. */
  pointsIfAccepted: number;
}

export const TRUCO_POINTS: Record<TrucoCall, number> = {
  TRUCO: 3,
  RETRUCO: 6,
  VALE_QUATRO: 9,
};
