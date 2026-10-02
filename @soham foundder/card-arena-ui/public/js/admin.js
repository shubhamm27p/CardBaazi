// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked item
            item.classList.add('active');

            // Show corresponding section
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Update title
            pageTitle.textContent = item.textContent.trim();
        });
    });

    // 2. Populate Mock Data (To be replaced with real API calls)
    
    // Mock Users
    const mockUsers = [
        { id: 'USR-101', name: 'John Doe', email: 'john@example.com', coins: 15400, status: 'active' },
        { id: 'USR-102', name: 'Jane Smith', email: 'jane@example.com', coins: 250, status: 'offline' },
        { id: 'USR-103', name: 'ToxicPlayer99', email: 'toxic@example.com', coins: 0, status: 'banned' },
        { id: 'USR-104', name: 'CardMaster', email: 'master@card.com', coins: 120500, status: 'active' },
    ];

    const usersTableBody = document.getElementById('users-table-body');
    mockUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>🪙 ${user.coins.toLocaleString()}</td>
            <td><span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-outline">Edit</button>
                ${user.status !== 'banned' 
                    ? `<button class="btn btn-sm btn-danger" onclick="alert('Ban ${user.name}?')">Ban</button>`
                    : `<button class="btn btn-sm btn-outline" onclick="alert('Unban ${user.name}?')">Unban</button>`}
            </td>
        `;
        usersTableBody.appendChild(tr);
    });

    // Mock Games
    const mockGames = [
        { id: 'RM-A8F2', type: '28 Point Game', players: '4/4', stakes: '1000 Coins', status: 'In Progress' },
        { id: 'RM-B91K', type: '7 Lavni', players: '2/4', stakes: '500 Coins', status: 'Waiting' },
        { id: 'RM-X0P1', type: '10 Lavani', players: '4/4', stakes: '10000 Coins', status: 'In Progress' },
    ];

    const gamesTableBody = document.getElementById('games-table-body');
    mockGames.forEach(game => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${game.id}</strong></td>
            <td>${game.type}</td>
            <td>${game.players}</td>
            <td>🪙 ${game.stakes}</td>
            <td><span class="status-badge ${game.status === 'In Progress' ? 'status-active' : 'status-offline'}">${game.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline">Spectate</button>
                <button class="btn btn-sm btn-danger" onclick="alert('Force close room ${game.id}?')">Close Room</button>
            </td>
        `;
        gamesTableBody.appendChild(tr);
    });

    // Mock Transactions
    const mockTx = [
        { title: 'Player John Doe won RM-A8F2', time: '2 mins ago', amount: '+ 3,800' },
        { title: 'User CardMaster deposited coins', time: '15 mins ago', amount: '+ 50,000' },
        { title: 'Platform Rake collected', time: '1 hour ago', amount: '+ 250' },
    ];

    const txList = document.getElementById('recent-transactions');
    mockTx.forEach(tx => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="activity-info">
                <span class="activity-title">${tx.title}</span>
                <span class="activity-time">${tx.time}</span>
            </div>
            <span class="activity-amount">${tx.amount}</span>
        `;
        txList.appendChild(li);
    });

    // Form Handling
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Settings saved successfully!');
    });

    // Logout Handling
    document.querySelector('.logout-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to log out?')) {
            window.location.href = 'login.html';
        }
    });
});
