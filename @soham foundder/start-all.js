const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting all games... Please wait a few seconds.');

// 1. Start Main Hub (Port 3000)
const arenaUi = spawn('node server.js', { 
  cwd: path.join(__dirname, 'card-arena-ui'), 
  stdio: 'inherit',
  shell: true 
});

// 2. Start 7 Lavni Server (Port 3001)
const lavni = spawn('node server.js', { 
  cwd: path.join(__dirname, '7 lavni/server'), 
  stdio: 'inherit',
  shell: true 
});

// 3. Start 28 Point Game (Port 3002 via Vite)
const game28 = spawn('npm run dev', { 
  cwd: path.join(__dirname, '28 point game'), 
  stdio: 'inherit',
  shell: true 
});

// 4. Auto-open the Hub in the default browser after a short delay
setTimeout(() => {
  console.log('\n🌐 Opening Card Arena Hub in your browser...');
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(`${startCmd} http://localhost:3000`, { shell: true });
}, 3000);

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('Stopping all servers...');
  arenaUi.kill();
  lavni.kill();
  game28.kill();
  process.exit();
});
