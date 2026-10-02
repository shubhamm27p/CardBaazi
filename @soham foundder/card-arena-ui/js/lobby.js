// Lobby logic

let playersReady = 3;
const totalPlayers = 4;

function sendChat(msgText) {
  const chatMessages = document.getElementById('chatMessages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg';
  msgEl.innerHTML = `<strong class="text-gold">YOU:</strong> ${msgText}`;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function fillWithAI() {
  // Replace Player 4 with AI
  const p4Card = document.getElementById('player4Card');
  p4Card.innerHTML = `
    <div class="connection-dot conn-excellent" title="Excellent Connection"></div>
    <div class="player-avatar">🤖</div>
    <div class="player-name">AI Bot</div>
    <div class="player-level">Level 50</div>
    <div class="ready-status status-ready">✓ READY</div>
    <div style="font-size: 10px; color: #e74c3c; margin-top: 5px; font-weight: bold;">TEAM 2 (OPPONENT)</div>
  `;
  
  // Update UI
  document.getElementById('roomStatusText').innerText = "ALL PLAYERS READY";
  document.getElementById('readyCounter').innerText = "ALL PLAYERS READY";
  document.getElementById('readyCounter').style.color = "var(--success)";
  document.getElementById('readyCounter').style.borderColor = "var(--success)";
  
  // Hide AI button
  document.getElementById('btnForceAI').style.display = 'none';
  
  // System message
  const chatMessages = document.getElementById('chatMessages');
  const sysMsg = document.createElement('div');
  sysMsg.className = 'chat-msg system';
  sysMsg.innerText = '🤖 AI joined the match.';
  chatMessages.appendChild(sysMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Start countdown
  startMatchCountdown();
}

function startMatchCountdown() {
  const overlay = document.getElementById('countdownOverlay');
  const countNum = document.getElementById('countdownNumber');
  
  setTimeout(() => {
    overlay.classList.add('active');
    
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countNum.innerText = count;
      } else if (count === 0) {
        countNum.innerText = "PLAY!";
      } else {
        clearInterval(interval);
        // Transition to the actual game table
        window.location.href = "game.html"; 
      }
    }, 1000);
  }, 1000);
}
