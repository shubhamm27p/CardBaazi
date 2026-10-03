# Security Audit Report - Card Arena Network

**Date**: October 2, 2026  
**Scope**: `card-arena-ui`, `7 lavni` backend

## Executive Summary
A preliminary static security audit was performed on the Card Arena codebase. The audit identified a few moderate-to-high severity risks primarily related to static file serving, weak random number generation, and potential memory exhaustion vectors. 

On the positive side, the game state synchronization logic (anti-cheat mechanism) correctly isolates client states, preventing players from reading opponents' cards.

---

## Findings

### 1. High Risk: Information Disclosure via Static File Serving
**Location**: `card-arena-ui/server.js` (Line 49)
```javascript
app.use(express.static(path.join(__dirname, '.')));
```
**Description**: By serving the root directory `.` statically, the Express server inadvertently exposes all backend source files to the public. An attacker can request files like `http://localhost:3000/server.js`, `package.json`, or even `.env` files if they are stored in that directory.
**Recommendation**: Move all client-facing assets (HTML, CSS, JS) into a dedicated `public` or `client` folder and serve only that folder:
```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

### 2. Moderate Risk: Weak Room Code Generation (Brute Force Vulnerability)
**Location**: `7 lavni/server/roomManager.js` (Lines 26-32)
```javascript
generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (this.rooms.has(code));
  return code;
}
```
**Description**: The room generation logic uses `Math.random()` to generate a 4-digit numeric code. Since there are only 9,000 possible combinations, an attacker could easily script a brute-force attack to guess active room codes and intrude on private games. Furthermore, `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG).
**Recommendation**: Increase the entropy of room codes (e.g., 6 alphanumeric characters) and use a secure generator like Node's `crypto` module, or use a library like `nanoid`. 
Example:
```javascript
const crypto = require('crypto');
code = crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates "A1B2C3"
```

### 3. Moderate Risk: Memory Exhaustion (Denial of Service)
**Location**: `7 lavni/server/roomManager.js` (Line 22)
**Description**: Active game rooms are stored in a JavaScript `Map` in memory. There is currently no rate-limiting on the `createRoom` function. A malicious actor could spam the server with room creation requests, filling up the Node.js RAM and crashing the server (OOM Error).
**Recommendation**: 
- Implement an IP-based rate limiter (e.g., `express-rate-limit` or via Socket.IO middleware) to restrict how many rooms a single user can create per minute.
- Add an idle-timeout worker that automatically deletes rooms if no moves are played for over 30 minutes.

### 4. Low Risk: Unvalidated Socket Inputs
**Description**: While not explicitly shown in the extracted code, ensure that all incoming `socket.on(...)` events in the broader backend strictly validate their parameters. Trusting client inputs for `seatIndex` or `cardId` without verifying they match the server's authoritative state can lead to cheating (e.g., playing a card out of turn or playing a card they don't own).
*Note: The `playCard` function in `roomManager.js` does properly check `seatIndex` against `room.currentTurn` and verifies the card exists in the hand, which mitigates this.*

---

## Positive Security Controls Observed
- **Anti-Cheat Enforcement**: The `getClientState` function explicitly strips out opponents' card data before emitting state to a client. This prevents "map hacking" or intercepting WebSocket frames to see opponents' hands.
- **Server Authoritative State**: Card shuffling, dealing, and move validation happen purely on the server. Clients cannot forcefully dictate arbitrary moves.
