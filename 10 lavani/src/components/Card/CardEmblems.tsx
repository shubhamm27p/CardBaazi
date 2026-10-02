import React from 'react';
import type { Rank, Suit } from '../../types/game';

interface EmblemProps {
  suit: Suit;
  rank: Rank;
  isDehla?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * High-definition ornamental center emblems for each suit,
 * styled with traditional royal Indian playing-card aesthetics (Ganjifa / Royal Court).
 */
export const CenterEmblem: React.FC<EmblemProps> = ({
  suit,
  rank,
  isDehla = false,
  size = 'large',
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const primaryColor = isRed ? '#c41e3a' : '#1e293b';
  const secondaryColor = isRed ? '#e11d48' : '#0f172a';
  const goldLight = '#fef08a';

  const isCourt = ['J', 'Q', 'K'].includes(rank);
  const isAce = rank === 'A';

  // Dimensions based on card size
  const svgWidth = size === 'small' ? 36 : size === 'medium' ? 52 : 68;
  const svgHeight = size === 'small' ? 44 : size === 'medium' ? 64 : 84;

  return (
    <div className={`card-center-emblem size-${size}`} data-suit={suit}>
      <svg
        viewBox="0 0 100 120"
        width={svgWidth}
        height={svgHeight}
        className="emblem-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`grad-suit-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>

          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>

          <radialGradient id={`glow-${suit}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isRed ? 'rgba(225,29,72,0.12)' : 'rgba(15,23,42,0.08)'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Filters */}
          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Radiant Aura Ring */}
        <circle cx="50" cy="60" r="46" fill={`url(#glow-${suit})`} />
        <circle
          cx="50"
          cy="60"
          r="44"
          fill="none"
          stroke={isDehla ? 'url(#gold-grad)' : isRed ? 'rgba(196,30,58,0.18)' : 'rgba(30,41,59,0.14)'}
          strokeWidth={isDehla ? '1.5' : '1'}
          strokeDasharray={isDehla ? '3,2' : 'none'}
        />

        {/* Dehla Special Royal Laurel Wreath */}
        {isDehla && (
          <g transform="translate(50, 60)" stroke="url(#gold-grad)" fill="none" strokeWidth="1.2">
            {/* Laurel leaves left & right */}
            <path d="M-36,-15 C-42,0 -38,25 -20,38 C-26,24 -24,4 -22,-6" />
            <path d="M36,-15 C42,0 38,25 20,38 C26,24 24,4 22,-6" />
            <circle cx="-35" cy="0" r="2.5" fill="url(#gold-grad)" />
            <circle cx="-28" cy="18" r="2.5" fill="url(#gold-grad)" />
            <circle cx="35" cy="0" r="2.5" fill="url(#gold-grad)" />
            <circle cx="28" cy="18" r="2.5" fill="url(#gold-grad)" />
          </g>
        )}

        {/* SUIT-SPECIFIC ORNATE CENTERPIECE */}
        {suit === 'spades' && (
          <g filter="url(#subtle-shadow)">
            {/* Ornate Background Filigree */}
            <path
              d="M32,45 C24,42 22,54 28,62 C34,70 44,72 48,82 L52,82 C56,72 66,70 72,62 C78,54 76,42 68,45 C58,49 54,60 50,68 C46,60 42,49 32,45 Z"
              fill={primaryColor}
              opacity="0.12"
            />
            {/* Main Royal Spade Symbol */}
            <path
              d="M50,22 C48,25 31,48 31,64 C31,76 40,82 48,80 C47,84 45,92 42,96 L58,96 C55,92 53,84 52,80 C60,82 69,76 69,64 C69,48 52,25 50,22 Z"
              fill={`url(#grad-suit-${suit})`}
            />
            {/* Inner Filigree Floral Scroll */}
            <path
              d="M50,38 C47,44 38,58 38,66 C38,72 44,75 48,74 C47,77 46,84 44,88 L56,88 C54,84 53,77 52,74 C56,75 62,72 62,66 C62,58 53,44 50,38 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Central Crown Jewel / Star */}
            <polygon
              points="50,48 52,54 58,54 53,58 55,64 50,60 45,64 47,58 42,54 48,54"
              fill="url(#gold-grad)"
            />
          </g>
        )}

        {suit === 'hearts' && (
          <g filter="url(#subtle-shadow)">
            {/* Ornate Background Filigree Aura */}
            <path
              d="M50,34 C44,22 24,20 18,34 C12,48 24,66 50,92 C76,66 88,48 82,34 C76,20 56,22 50,34 Z"
              fill={primaryColor}
              opacity="0.12"
            />
            {/* Main Royal Heart Symbol */}
            <path
              d="M50,36 C45,24 28,22 24,36 C20,50 32,68 50,90 C68,68 80,50 76,36 C72,22 55,24 50,36 Z"
              fill={`url(#grad-suit-${suit})`}
            />
            {/* Inner Intricate Filigree Line */}
            <path
              d="M50,44 C46,34 34,32 30,42 C26,52 36,66 50,82 C64,66 74,52 70,42 C66,32 54,34 50,44 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Central Lotus Heart Motif */}
            <path
              d="M50,50 C46,54 42,58 42,63 C42,67 46,69 50,68 C54,69 58,67 58,63 C58,58 54,54 50,50 Z"
              fill="url(#gold-grad)"
            />
          </g>
        )}

        {suit === 'diamonds' && (
          <g filter="url(#subtle-shadow)">
            {/* Ornate Background Starburst */}
            <path
              d="M50,16 L84,60 L50,104 L16,60 Z"
              fill={primaryColor}
              opacity="0.12"
            />
            {/* Radiant Rays */}
            <line x1="50" y1="18" x2="50" y2="102" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.6" />
            <line x1="18" y1="60" x2="82" y2="60" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.6" />
            {/* Main Faceted Diamond Symbol */}
            <polygon
              points="50,22 78,60 50,98 22,60"
              fill={`url(#grad-suit-${suit})`}
            />
            {/* Inner Facet Geometry */}
            <polygon
              points="50,32 70,60 50,88 30,60"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Center Royal Gem Core */}
            <polygon
              points="50,44 60,60 50,76 40,60"
              fill="url(#gold-grad)"
            />
          </g>
        )}

        {suit === 'clubs' && (
          <g filter="url(#subtle-shadow)">
            {/* Ornate Background Filigree */}
            <circle cx="50" cy="40" r="22" fill={primaryColor} opacity="0.1" />
            <circle cx="34" cy="62" r="22" fill={primaryColor} opacity="0.1" />
            <circle cx="66" cy="62" r="22" fill={primaryColor} opacity="0.1" />

            {/* Main Royal Club Symbol */}
            <path
              d="M50,20 C42,20 36,27 36,36 C36,41 38,46 42,49 C35,46 25,50 22,57 C19,65 24,75 34,75 C39,75 44,72 46,67 C45,74 44,88 40,94 L60,94 C56,88 55,74 54,67 C56,72 61,75 66,75 C76,75 81,65 78,57 C75,50 65,46 58,49 C62,46 64,41 64,36 C64,27 58,20 50,20 Z"
              fill={`url(#grad-suit-${suit})`}
            />
            {/* Inner Filigree Loops */}
            <circle cx="50" cy="36" r="8" fill="none" stroke="#ffffff" strokeWidth="1.1" opacity="0.8" />
            <circle cx="35" cy="61" r="8" fill="none" stroke="#ffffff" strokeWidth="1.1" opacity="0.8" />
            <circle cx="65" cy="61" r="8" fill="none" stroke="#ffffff" strokeWidth="1.1" opacity="0.8" />
            {/* Center Golden Chakra Knot */}
            <polygon
              points="50,51 53,57 59,57 54,61 56,67 50,63 44,67 46,61 41,57 47,57"
              fill="url(#gold-grad)"
            />
          </g>
        )}

        {/* COURT CARD (J, Q, K) ROYAL CROWN / CREST TOPPING */}
        {isCourt && (
          <g transform="translate(50, 16)" filter="url(#subtle-shadow)">
            {/* Mini Royal Crown on top of suit emblem */}
            <path
              d="M-14,-2 L-10,6 L-4,0 L0,7 L4,0 L10,6 L14,-2 L11,9 L-11,9 Z"
              fill="url(#gold-grad)"
            />
            <circle cx="-14" cy="-3" r="1.5" fill={goldLight} />
            <circle cx="0" cy="-1" r="2" fill={goldLight} />
            <circle cx="14" cy="-3" r="1.5" fill={goldLight} />
          </g>
        )}

        {/* ACE GRAND CORONET */}
        {isAce && (
          <g transform="translate(50, 14)">
            <circle cx="0" cy="0" r="3" fill="url(#gold-grad)" />
            <path d="M-12,2 Q0,-4 12,2 Q0,0 -12,2" fill="url(#gold-grad)" />
          </g>
        )}

        {/* DEHLA GOLD RIBBON BADGE */}
        {isDehla && (
          <g transform="translate(50, 106)">
            {/* Ribbon Background */}
            <rect
              x="-26"
              y="-7"
              width="52"
              height="14"
              rx="4"
              fill="url(#gold-grad)"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            {/* Ribbon Notch details */}
            <polygon points="-26,-7 -31,0 -26,7" fill="#78350f" opacity="0.4" />
            <polygon points="26,-7 31,0 26,7" fill="#78350f" opacity="0.4" />
            {/* Text */}
            <text
              x="0"
              y="3.5"
              textAnchor="middle"
              fill="#271a00"
              fontSize="7.5"
              fontFamily="var(--font-royal, 'Cinzel', serif)"
              fontWeight="900"
              letterSpacing="0.8"
            >
              ★ 10 DEHLA ★
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Authentic, luxury Indian physical playing-card back.
 * Features an intricate symmetrical mandala / guilloche lattice pattern
 * with an antique gold crest and rich royal crimson/navy ground.
 */
export const LuxuryCardBack: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
  size = 'large',
}) => {
  return (
    <div className={`luxury-card-back size-${size}`} data-testid="luxury-card-back">
      <svg
        viewBox="0 0 140 200"
        className="card-back-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Deep Royal Wine / Crimson Gradient */}
          <linearGradient id="back-ground" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#450a0a" />
            <stop offset="50%" stopColor="#2e0505" />
            <stop offset="100%" stopColor="#1a0202" />
          </linearGradient>

          {/* Antique Gold Gradient */}
          <linearGradient id="back-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#aa7c11" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          {/* Intricate Repeating Lattice Pattern */}
          <pattern id="royal-lattice" width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M0,8 L8,0 L16,8 L8,16 Z"
              fill="none"
              stroke="#d4af37"
              strokeWidth="0.6"
              opacity="0.22"
            />
            <circle cx="8" cy="8" r="1.2" fill="#d4af37" opacity="0.35" />
            <circle cx="0" cy="8" r="0.8" fill="#d4af37" opacity="0.25" />
            <circle cx="8" cy="0" r="0.8" fill="#d4af37" opacity="0.25" />
          </pattern>
        </defs>

        {/* 1. White Card Margin Frame (Simulating 3mm physical card border) */}
        <rect x="0" y="0" width="140" height="200" rx="9" fill="#ffffff" />

        {/* 2. Deep Crimson / Gold Inset Field */}
        <rect
          x="6"
          y="6"
          width="128"
          height="188"
          rx="6"
          fill="url(#back-ground)"
          stroke="url(#back-gold)"
          strokeWidth="1.5"
        />

        {/* 3. Outer Filigree Line */}
        <rect
          x="9"
          y="9"
          width="122"
          height="182"
          rx="4.5"
          fill="none"
          stroke="url(#back-gold)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
          opacity="0.7"
        />

        {/* 4. Fine Lattice Field */}
        <rect
          x="11"
          y="11"
          width="118"
          height="178"
          rx="4"
          fill="url(#royal-lattice)"
        />

        {/* 5. Four Corner Filigree Fans */}
        {/* Top-Left */}
        <g transform="translate(12, 12)">
          <path d="M0,18 Q8,8 18,0" stroke="url(#back-gold)" strokeWidth="1" fill="none" opacity="0.85" />
          <path d="M0,12 Q6,6 12,0" stroke="url(#back-gold)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle cx="4" cy="4" r="1.5" fill="url(#back-gold)" />
        </g>
        {/* Top-Right */}
        <g transform="translate(128, 12) scale(-1, 1)">
          <path d="M0,18 Q8,8 18,0" stroke="url(#back-gold)" strokeWidth="1" fill="none" opacity="0.85" />
          <path d="M0,12 Q6,6 12,0" stroke="url(#back-gold)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle cx="4" cy="4" r="1.5" fill="url(#back-gold)" />
        </g>
        {/* Bottom-Left */}
        <g transform="translate(12, 188) scale(1, -1)">
          <path d="M0,18 Q8,8 18,0" stroke="url(#back-gold)" strokeWidth="1" fill="none" opacity="0.85" />
          <path d="M0,12 Q6,6 12,0" stroke="url(#back-gold)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle cx="4" cy="4" r="1.5" fill="url(#back-gold)" />
        </g>
        {/* Bottom-Right */}
        <g transform="translate(128, 188) scale(-1, -1)">
          <path d="M0,18 Q8,8 18,0" stroke="url(#back-gold)" strokeWidth="1" fill="none" opacity="0.85" />
          <path d="M0,12 Q6,6 12,0" stroke="url(#back-gold)" strokeWidth="0.8" fill="none" opacity="0.65" />
          <circle cx="4" cy="4" r="1.5" fill="url(#back-gold)" />
        </g>

        {/* 6. Central Symmetrical Royal Medallion */}
        <g transform="translate(70, 100)">
          {/* Outer Sunburst Petals */}
          <circle cx="0" cy="0" r="38" fill="#1c0303" stroke="url(#back-gold)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="34" fill="none" stroke="url(#back-gold)" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.8" />
          <circle cx="0" cy="0" r="29" fill="#2d0505" stroke="url(#back-gold)" strokeWidth="1" />

          {/* 8-Point Radial Lotus Star */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
            <g key={idx} transform={`rotate(${angle})`}>
              <path d="M0,-28 Q4,-20 0,-15 Q-4,-20 0,-28 Z" fill="url(#back-gold)" opacity="0.85" />
              <circle cx="0" cy="-29" r="1.2" fill="#ffffff" />
            </g>
          ))}

          {/* Inner Medallion Center Shield */}
          <circle cx="0" cy="0" r="15" fill="#450a0a" stroke="url(#back-gold)" strokeWidth="1.2" />

          {/* Four Interlaced Suit Emblems in Center */}
          {/* Top: Spade ♠ */}
          <path d="M0,-12 C-1,-11 -4,-6 -4,-4 C-4,-2 -2,-1 0,-2 C2,-1 4,-2 4,-4 C4,-6 1,-11 0,-12 Z" fill="url(#back-gold)" />
          {/* Bottom: Heart ♥ */}
          <path d="M0,12 C-1,11 -4,6 -4,4 C-4,2 -2,1 0,2 C2,1 4,2 4,4 C4,6 1,11 0,12 Z" transform="rotate(180)" fill="url(#back-gold)" />
          {/* Left: Diamond ♦ */}
          <polygon points="-12,0 -8,-3 -4,0 -8,3" fill="url(#back-gold)" />
          {/* Right: Club ♣ */}
          <circle cx="9" cy="0" r="2" fill="url(#back-gold)" />
          <circle cx="12" cy="-2" r="1.6" fill="url(#back-gold)" />
          <circle cx="12" cy="2" r="1.6" fill="url(#back-gold)" />

          {/* Center Golden Pearl */}
          <circle cx="0" cy="0" r="3" fill="#ffffff" stroke="url(#back-gold)" strokeWidth="0.8" />
        </g>
      </svg>
    </div>
  );
};
