export interface CoinPlayer {
  id: string;
  team?: string;
  coins?: number;
}

export interface CoinSettlementResult {
  changes: Record<string, number>;
  newBalances: Record<string, number>;
}

export class CoinEngine {
  players: Required<CoinPlayer>[];
  constructor(players: CoinPlayer[]);
  getBalances(): Required<CoinPlayer>[];
  settleTeamWin(winningTeamId: string): CoinSettlementResult;
  settleIndividualWin(winnerId: string): CoinSettlementResult;
}
