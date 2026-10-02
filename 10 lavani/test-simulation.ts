import {
  createDeck,
  shuffleDeck,
  dealStage1Cards,
  dealStage2Cards,
  RANKS,
  SUITS,
} from './src/engine/deck';
import {
  isCardPlayable,
  getPlayableCards,
  evaluateTrickWinner,
} from './src/engine/rules';
import {
  createInitialState,
  startNewGame,
  passHukumToPartner,
  partnerSelectHukumAndDeal,
  proceedToHukumSelection,
  selectHukumAndDealStage2,
  playCard,
  resolveTrick,
} from './src/engine/gameEngine';
import { chooseAICard } from './src/engine/ai';
import type { PlayerId, Suit, AIDifficulty } from './src/types/game';

console.log('====================================================');
console.log('🧪 RUNNING "PASS HUKUM TO PARTNER" TEST SUITE');
console.log('====================================================\n');

// 1. Deck Composition Verification
console.log('Test 1: Strict 32-Card Deck Verification');
const deck = createDeck();
if (deck.length !== 32) throw new Error(`Expected 32 cards, got ${deck.length}`);
const disallowedRanks = ['2', '3', '4', '5', '6'];
for (const card of deck) {
  if (disallowedRanks.includes(card.rank)) {
    throw new Error(`Forbidden rank ${card.rank} found in deck!`);
  }
}
const dehlas = deck.filter((c) => c.isDehla);
if (dehlas.length !== 4) throw new Error(`Expected 4 Dehlas, got ${dehlas.length}`);
console.log('✅ Deck has exactly 32 cards (7, 8, 9, 10, J, Q, K, A only)');
console.log(`✅ Exactly 4 Dehlas verified: ${dehlas.map((d) => d.id).join(', ')}\n`);

// 2. Stage 1 Deal: First 4 Cards Dealt -> Evaluate Hand
console.log('Test 2: Stage 1 Deal (First 4 cards) -> Evaluate Hand');
let state = createInitialState({ soundEnabled: false });
state = startNewGame(state, 'p1');

if (state.phase !== 'evaluateHand') {
  throw new Error(`Expected evaluateHand phase, got ${state.phase}`);
}
if (state.dealingStage !== 1) {
  throw new Error(`Expected dealingStage 1, got ${state.dealingStage}`);
}
if (state.players.p1.hand.length !== 4) {
  throw new Error(`Expected 4 cards in Stage 1, got ${state.players.p1.hand.length}`);
}
if (state.remainingDeck.length !== 16) {
  throw new Error(`Expected 16 remaining cards in deck, got ${state.remainingDeck.length}`);
}
console.log('✅ Stage 1 dealt 4 cards to human; 16 remaining cards undealt; phase is evaluateHand');

// 3. User clicks "PASS TO PARTNER" -> Partner decides Hukum
console.log('\nTest 3: Step 3 — Click "PASS TO PARTNER" -> Partner decides Hukum');
state = passHukumToPartner(state);
if (state.phase !== 'partnerChoosingHukum') {
  throw new Error(`Expected partnerChoosingHukum phase, got ${state.phase}`);
}
if (state.trumpChooserId !== 'p3') {
  throw new Error(`Expected trumpChooserId to be partner p3, got ${state.trumpChooserId}`);
}
console.log('✅ Passed Hukum to partner; phase is partnerChoosingHukum (No card exchange/replacement)');

// 4. Partner Priya evaluates hand, chooses Hukum & deals remaining 4 cards
console.log('\nTest 4: Partner Priya evaluates her hand & chooses Hukum');
const { nextState: stateAfterPartner, chosenHukum } = partnerSelectHukumAndDeal(state);
state = stateAfterPartner;

if (!['spades', 'hearts', 'diamonds', 'clubs'].includes(chosenHukum)) {
  throw new Error(`Invalid chosen Hukum: ${chosenHukum}`);
}
if (state.trumpSuit !== chosenHukum) {
  throw new Error(`Expected trumpSuit to be ${chosenHukum}, got ${state.trumpSuit}`);
}
if (state.dealingStage !== 2) {
  throw new Error(`Expected dealingStage 2, got ${state.dealingStage}`);
}
if (state.players.p1.hand.length !== 8) {
  throw new Error(`Expected human to have 8 cards, got ${state.players.p1.hand.length}`);
}
if (state.players.p2.hand.length !== 8 || state.players.p3.hand.length !== 8 || state.players.p4.hand.length !== 8) {
  throw new Error('All AI players must have 8 cards');
}
if (state.remainingDeck.length !== 0) {
  throw new Error(`Expected remainingDeck to be empty, got ${state.remainingDeck.length}`);
}
if (state.phase !== 'playing') {
  throw new Error(`Expected playing phase, got ${state.phase}`);
}
console.log(`✅ Partner Priya decided Hukum: ${chosenHukum.toUpperCase()}; 8 cards dealt each; game started!`);

// 5. Direct "CHOOSE HUKUM" Flow (Human chooses Hukum)
console.log('\nTest 5: Step 4 — Click "CHOOSE HUKUM" Directly');
let stateDirect = createInitialState({ soundEnabled: false });
stateDirect = startNewGame(stateDirect, 'p1');
stateDirect = proceedToHukumSelection(stateDirect);

if (stateDirect.phase !== 'selectTrump') {
  throw new Error(`Expected selectTrump phase, got ${stateDirect.phase}`);
}
stateDirect = selectHukumAndDealStage2(stateDirect, 'hearts');
if (stateDirect.trumpSuit !== 'hearts' || stateDirect.players.p1.hand.length !== 8) {
  throw new Error('Direct Hukum selection did not set hearts or deal 8 cards');
}
if (stateDirect.phase !== 'playing') {
  throw new Error(`Expected playing phase, got ${stateDirect.phase}`);
}
console.log('✅ Direct Choose Hukum flow verified: Human chose Hearts; 8 cards dealt; game started');

// 6. Full 8-Trick Match Simulations (5 games, alternating paths)
console.log('\nTest 6: Simulating 5 Full 8-Trick Matches');
const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard', 'medium', 'hard'];

for (let g = 0; g < difficulties.length; g++) {
  const diff = difficulties[g];
  let simState = createInitialState({ difficulty: diff, soundEnabled: false });
  simState = startNewGame(simState, 'p1');

  if (g % 2 === 0) {
    // Pass to Partner flow -> Partner decides Hukum
    simState = passHukumToPartner(simState);
    const { nextState } = partnerSelectHukumAndDeal(simState);
    simState = nextState;
  } else {
    // Direct Choose Hukum flow -> Human chooses Hukum
    simState = proceedToHukumSelection(simState);
    const chosenSuit: Suit = 'clubs';
    simState = selectHukumAndDealStage2(simState, chosenSuit);
  }

  if (simState.players.p1.hand.length !== 8) {
    throw new Error(`Expected 8 cards in hand after Stage 2, got ${simState.players.p1.hand.length}`);
  }

  let turnsCount = 0;
  while (simState.phase !== 'roundOver' && turnsCount < 200) {
    if (simState.phase === 'trickResolving') {
      simState = resolveTrick(simState);
      continue;
    }

    if (simState.phase === 'playing') {
      const activePlayerId = simState.currentTurn;
      const activePlayer = simState.players[activePlayerId];

      const playable = getPlayableCards(
        activePlayer.hand,
        simState.currentTrick.leadSuit
      );

      if (playable.length === 0) {
        throw new Error(`Player ${activePlayerId} has no playable cards! Hand size: ${activePlayer.hand.length}`);
      }

      const cardToPlay = chooseAICard({
        playerId: activePlayerId,
        hand: activePlayer.hand,
        leadSuit: simState.currentTrick.leadSuit,
        trumpSuit: simState.trumpSuit,
        currentTrick: simState.currentTrick,
        trickHistory: simState.trickHistory,
        difficulty: simState.settings.difficulty,
      });

      simState = playCard(simState, activePlayerId, cardToPlay.id);
      turnsCount++;
    }
  }

  if (simState.phase !== 'roundOver') {
    throw new Error(`Game ${g + 1} did not finish properly! Phase: ${simState.phase}`);
  }

  const teamADehlas = simState.teamScores.teamA.dehlas.length;
  const teamBDehlas = simState.teamScores.teamB.dehlas.length;
  const totalDehlas = teamADehlas + teamBDehlas;
  const totalTricks = simState.teamScores.teamA.tricksWon + simState.teamScores.teamB.tricksWon;

  if (totalDehlas !== 4) {
    throw new Error(`Expected 4 total Dehlas captured, got ${totalDehlas}`);
  }
  if (totalTricks !== 8) {
    throw new Error(`Expected 8 total tricks played, got ${totalTricks}`);
  }

  console.log(
    `  Match ${g + 1} (${diff}): Team A ${teamADehlas} Dehlas (${simState.teamScores.teamA.tricksWon} tricks) vs Team B ${teamBDehlas} Dehlas (${simState.teamScores.teamB.tricksWon} tricks) -> Finished cleanly!`
  );
}

console.log('\n====================================================');
console.log('🎉 ALL TESTS PASSED! PARTNER DECIDES HUKUM FLOW VERIFIED');
console.log('====================================================\n');
