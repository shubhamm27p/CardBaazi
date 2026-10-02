// Sati Lavni Card UI and Graphic Helpers - Premium Casino-Quality Edition

export const SUIT_ICONS = {
  H: `<svg viewBox="0 0 24 24" class="suit-svg heart-svg" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  D: `<svg viewBox="0 0 24 24" class="suit-svg diamond-svg" aria-hidden="true"><path fill="currentColor" d="M12 2L3.5 12 12 22l8.5-10L12 2z"/></svg>`,
  C: `<svg viewBox="0 0 24 24" class="suit-svg club-svg" aria-hidden="true"><path fill="currentColor" d="M12 2a4 4 0 0 0-4 4c0 .35.05.69.13 1.01A4 4 0 0 0 5 11a4 4 0 0 0 3.86 3.99L7.5 21h9l-1.36-6.01A4 4 0 0 0 19 11a4 4 0 0 0-3.13-3.99c.08-.32.13-.66.13-1.01a4 4 0 0 0-4-4z"/></svg>`,
  S: `<svg viewBox="0 0 24 24" class="suit-svg spade-svg" aria-hidden="true"><path fill="currentColor" d="M12 2C9.5 6 4 10.5 4 14.5A4.5 4.5 0 0 0 8.5 19c1.6 0 3-.8 3.8-2L11 21h2l-1.3-4c.8 1.2 2.2 2 3.8 2a4.5 4.5 0 0 0 4.5-4.5C20 10.5 14.5 6 12 2z"/></svg>`
};

export const SUIT_NAMES = {
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
  S: 'Spades'
};

export const SUIT_SYMBOLS = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠'
};

export const RANK_NAMES = {
  1: 'Ace',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Jack',
  12: 'Queen',
  13: 'King'
};

export function isRedSuit(suit) {
  return suit === 'H' || suit === 'D';
}

/**
 * Creates DOM card element for player hand or animations
 * Premium casino-quality playing card with ivory finish, crisp serif rank, and clean suit icons
 */
export function createCardElement(card, options = {}) {
  const {
    isPlayable = false,
    isSelected = false,
    isInteractive = true,
    isMini = false,
    showBack = false
  } = options;

  const cardDiv = document.createElement('div');
  const isRed = isRedSuit(card.suit);
  const isSeven = card.rank === 7;

  cardDiv.className = `playing-card suit-${card.suit.toLowerCase()} ${isRed ? 'is-red' : 'is-black'} ${isSeven ? 'is-seven' : ''}`;
  cardDiv.dataset.cardId = card.id;
  cardDiv.dataset.suit = card.suit;
  cardDiv.dataset.rank = card.rank;
  cardDiv.setAttribute('role', 'button');
  cardDiv.setAttribute('aria-label', `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`);
  cardDiv.setAttribute('tabindex', isPlayable ? '0' : '-1');

  if (isPlayable) {
    cardDiv.classList.add('is-playable');
  } else if (!showBack && isInteractive) {
    cardDiv.classList.add('is-dimmed');
  }

  if (isSelected) {
    cardDiv.classList.add('is-selected');
  }

  if (isMini) {
    cardDiv.classList.add('card-mini');
  }

  // Realistic Casino Playing Card Back Design
  if (showBack) {
    cardDiv.classList.add('card-back');
    cardDiv.innerHTML = `
      <div class="card-back-pattern">
        <div class="card-back-border">
          <div class="card-back-lattice"></div>
          <div class="card-back-center-medallion">
            <span class="medallion-icon">♠ ♥ ♦ ♣</span>
          </div>
        </div>
      </div>
    `;
    return cardDiv;
  }

  const iconSvg = SUIT_ICONS[card.suit];

  // Authentic Playing Card Center Graphic
  let centerContent = '';
  if (card.rank === 7) {
    // Distinctive 7 pivot card with gold numeric accent and suit insignia
    centerContent = `
      <div class="card-center-seven">
        <span class="seven-num">7</span>
        <div class="seven-icon">${iconSvg}</div>
      </div>
    `;
  } else if (card.rank === 1) {
    // Ace: Grand, high-definition central suit emblem
    centerContent = `
      <div class="card-center-ace">
        ${iconSvg}
      </div>
    `;
  } else if (card.rank >= 11) {
    // Court Cards: Jack, Queen, King with royal initials & court framing
    const faceTitle = card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : 'K';
    centerContent = `
      <div class="card-center-court">
        <div class="court-top-pip">${iconSvg}</div>
        <div class="court-letter">${faceTitle}</div>
        <div class="court-bottom-pip">${iconSvg}</div>
      </div>
    `;
  } else {
    // Number cards (2..6, 8..10): Clean, bold, classic center suit symbol
    centerContent = `
      <div class="card-center-pip">
        ${iconSvg}
      </div>
    `;
  }

  cardDiv.innerHTML = `
    <div class="card-inner-frame">
      <div class="card-corner top-left">
        <span class="card-rank">${card.label}</span>
        <span class="card-suit-icon">${iconSvg}</span>
      </div>
      <div class="card-center">
        ${centerContent}
      </div>
      <div class="card-corner bottom-right">
        <span class="card-rank">${card.label}</span>
        <span class="card-suit-icon">${iconSvg}</span>
      </div>
    </div>
  `;

  return cardDiv;
}

/**
 * Creates visual card for the board slot (miniature physical card component)
 */
export function renderBoardSlotCard(card) {
  const isRed = isRedSuit(card.suit);
  const icon = SUIT_ICONS[card.suit];
  const isSeven = card.rank === 7;

  return `
    <div class="slot-card ${isRed ? 'is-red' : 'is-black'} ${isSeven ? 'is-seven-card' : ''}" data-suit="${card.suit}" data-rank="${card.rank}">
      <div class="slot-corner top-left">
        <span class="slot-rank">${card.label}</span>
      </div>
      <div class="slot-center">
        <span class="slot-suit">${icon}</span>
      </div>
      <div class="slot-corner bottom-right">
        <span class="slot-rank">${card.label}</span>
      </div>
    </div>
  `;
}
