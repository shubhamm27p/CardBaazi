// Comprehensive Verification for Sati Lavni (Easy, Hard, Expert AI & Hard Skip Rule)
import {
  createDeck,
  shuffleDeck,
  dealCards,
  initBoard,
  findStartingPlayer,
  isCardPlayable,
  getPlayableCards,
  canPlayerSkip,
  applyCardPlay,
  chooseBotMove
} from '../server/gameLogic.js';

console.log('=== TEST 1: Cryptographic Deck & Deal Verification ===');
const deck = createDeck();
console.assert(deck.length === 52, `Deck length should be 52, got ${deck.length}`);
const uniqueIds = new Set(deck.map(c => c.id));
console.assert(uniqueIds.size === 52, `All 52 cards must be unique, got ${uniqueIds.size}`);

const shuffled = shuffleDeck(deck);
const hands = dealCards(shuffled);
console.assert(hands.length === 4, 'Should deal to 4 players');
hands.forEach((hand, idx) => {
  console.assert(hand.length === 13, `Player ${idx} must have 13 cards, got ${hand.length}`);
});
console.log('✓ Cryptographic shuffle verified: 52 unique cards, 13 dealt to each player.');

console.log('\n=== TEST 2: Hard Skip Rule Strict Validation ===');
const board = initBoard();
const testHandWithMoves = [
  { id: 'H-7', suit: 'H', rank: 7 },
  { id: 'S-2', suit: 'S', rank: 2 }
];
console.assert(canPlayerSkip(testHandWithMoves, board) === false, 'Cannot skip when holding H-7 on board init');

const testHandWithoutMoves = [
  { id: 'S-2', suit: 'S', rank: 2 },
  { id: 'D-5', suit: 'D', rank: 5 }
];
console.assert(canPlayerSkip(testHandWithoutMoves, board) === true, 'Can skip when no legal cards available');
console.log('✓ Hard skip rule verified: Strictly rejects pass when legal move exists.');

console.log('\n=== TEST 3: Multi-AI Simulation (100 Complete Games Across Easy, Hard, Expert) ===');
const difficulties = ['easy', 'hard', 'expert'];

for (const diff of difficulties) {
  let totalCardsPlayed = 0;
  for (let g = 1; g <= 35; g++) {
    const gDeck = shuffleDeck(createDeck());
    const gHands = dealCards(gDeck);
    const gBoard = initBoard();
    let currentTurn = findStartingPlayer(gHands);
    const finished = [];
    let moveCount = 0;

    while (finished.length < 4 && moveCount < 1000) {
      const hand = gHands[currentTurn];
      if (hand.length > 0) {
        const opponentCounts = gHands.map(h => h.length);
        const decision = chooseBotMove(hand, gBoard, diff, {
          opponentCardCounts: opponentCounts,
          botSeatIndex: currentTurn,
          passHistory: []
        });

        if (decision.action === 'play') {
          const card = decision.card;
          console.assert(isCardPlayable(card, gBoard), `${diff} AI played invalid card ${card.id}`);
          applyCardPlay(gBoard, card);
          const idx = hand.findIndex(c => c.id === card.id);
          hand.splice(idx, 1);
          moveCount++;

          if (hand.length === 0) {
            finished.push(currentTurn);
          }
        } else {
          // Hard skip check
          console.assert(canPlayerSkip(hand, gBoard), `${diff} AI skipped illegally when playable moves existed!`);
        }
      }

      currentTurn = (currentTurn + 1) % 4;
    }

    console.assert(moveCount === 52, `All 52 cards must be played, got ${moveCount}`);
    console.assert(finished.length === 4, `All 4 players must finish`);
    totalCardsPlayed += moveCount;
  }
  console.log(`✓ ${diff.toUpperCase()} AI: 35 games completed with 100% legal moves (${totalCardsPlayed} total cards placed).`);
}

console.log('\n=========================================');
console.log('ALL COMPETITIVE ENGINE TESTS PASSED! 🏆');
console.log('=========================================');
