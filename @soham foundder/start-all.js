const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🚀 Starting all games... Please wait a few seconds.');

const appUrl = process.env.APP_URL || 'http://localhost:3000';
const lavniPort = Number(process.env.LAVNI_PORT || 3001);
const game28Url = process.env.GAME28_URL || 'http://localhost:3002';

// 1. Start Main Hub
const arenaUi = spawn('node server.js', { 
  cwd: path.join(__dirname, 'card-arena-ui'), 
  stdio: 'inherit',
  shell: true 
});

// 2. Start 7 Lavni Server (Port 3001)
const lavni = spawn('node server.js', {
  cwd: path.join(__dirname, '7 lavni/server'), 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: String(lavniPort) }
});

// 3. Start 28 Point Game (Port 3002 via Vite)
const game28 = spawn('npm run dev', { 
  cwd: path.join(__dirname, '28 point game'), 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GAME28_URL: game28Url }
});

// 4. Auto-open the Hub in the default browser after a short delay
setTimeout(() => {
  console.log(`\n🌐 Opening Card Arena Hub in your browser... ${appUrl}`);
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(`${startCmd} ${appUrl}`, { shell: true });
}, 3000);

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('Stopping all servers...');
  arenaUi.kill();
  lavni.kill();
  game28.kill();
  process.exit();
});
