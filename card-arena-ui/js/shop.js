let tokenBalance = 12500;

function updateTokenDisplay() {
  document.getElementById('token-balance').innerHTML = `🪙 ${tokenBalance.toLocaleString()} TOKENS`;
}

function unlockReward(element, title, price, icon) {
  if (element.classList.contains('unlocked')) return;

  if (tokenBalance >= price) {
    // Deduct tokens
    tokenBalance -= price;
    updateTokenDisplay();

    // Update UI
    element.classList.add('unlocked');
    
    const priceEl = element.querySelector('.reward-price');
    priceEl.innerHTML = '✓ UNLOCKED';
    
    const btn = element.querySelector('button');
    btn.className = 'btn-outline';
    btn.innerText = 'Equip';
    
    // Add special effect to art
    const art = element.querySelector('.reward-art');
    art.style.borderColor = 'var(--gold-primary)';
    art.style.boxShadow = '0 0 15px rgba(212,175,55,0.4)';

    // Show Notification
    showModal(title, price, icon);
  } else {
    alert("Not enough tokens!");
  }
}

function showModal(title, price, icon) {
  document.getElementById('modalTitle').innerText = title.toUpperCase();
  document.getElementById('modalPrice').innerText = price.toLocaleString();
  document.getElementById('modalIcon').innerText = icon;
  
  const modal = document.getElementById('rewardModal');
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('rewardModal');
  modal.classList.remove('active');
}

function claimDaily(element) {
  if(element.classList.contains('claimed')) return;
  
  // Animate and claim
  element.classList.remove('active');
  element.classList.add('claimed');
  
  tokenBalance += 100; // Hardcoded for day 3
  updateTokenDisplay();
  
  // Set next day active
  const nextDay = element.nextElementSibling;
  if(nextDay) {
    nextDay.classList.add('active');
  }
}
