export class CoinEngine {
  /**
   * Initialize a new coin engine for a match.
   * @param {Array<{id: string, team?: string, coins?: number}>} players 
   */
  constructor(players) {
    this.players = players.map(p => ({
      id: p.id,
      team: p.team || 'NONE',
      coins: p.coins !== undefined ? p.coins : 100
    }));
  }

  getBalances() {
    return this.players;
  }

  /**
   * Settles a team-based win (e.g. 28 Point, Mendikot, or 7 Lavani in team mode).
   * @param {string} winningTeamId - The ID of the winning team (e.g. 'TEAM_A')
   * @returns {Object} { changes: { [playerId]: number }, newBalances: { [playerId]: number } }
   */
  settleTeamWin(winningTeamId) {
    const winners = this.players.filter(p => p.team === winningTeamId);
    const losers = this.players.filter(p => p.team !== winningTeamId && p.team !== 'NONE');
    
    let totalLosingCoins = 0;
    losers.forEach(l => {
      totalLosingCoins += l.coins;
    });

    const rewardPerWinner = Math.floor(totalLosingCoins / (winners.length || 1));
    const remainder = totalLosingCoins % (winners.length || 1); // Give remainder to first winner if any
    
    const changes = {};
    const newBalances = {};
    
    this.players = this.players.map(p => {
      let change = 0;
      if (p.team === winningTeamId) {
        change = rewardPerWinner + (winners.indexOf(p) === 0 ? remainder : 0);
      } else if (p.team !== 'NONE') {
        change = -p.coins; // lose everything they had
      }
      
      changes[p.id] = change;
      const finalBalance = p.coins + change;
      newBalances[p.id] = finalBalance;
      
      return { ...p, coins: finalBalance };
    });

    return { changes, newBalances };
  }
  
  /**
   * Settles an individual-based win (e.g. 7 Lavani in individual mode).
   * @param {string} winnerId - The ID of the winning player
   * @returns {Object} { changes: { [playerId]: number }, newBalances: { [playerId]: number } }
   */
  settleIndividualWin(winnerId) {
    const losers = this.players.filter(p => p.id !== winnerId);
    
    let totalLosingCoins = 0;
    losers.forEach(l => {
      totalLosingCoins += l.coins;
    });
    
    const changes = {};
    const newBalances = {};
    
    this.players = this.players.map(p => {
      let change = 0;
      if (p.id === winnerId) {
        change = totalLosingCoins;
      } else {
        change = -p.coins;
      }
      
      changes[p.id] = change;
      const finalBalance = p.coins + change;
      newBalances[p.id] = finalBalance;
      
      return { ...p, coins: finalBalance };
    });

    return { changes, newBalances };
  }
}
