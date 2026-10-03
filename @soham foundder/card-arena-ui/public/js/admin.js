// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

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
    
    // Empty Mock Users
    const mockUsers = [];

    const usersTableBody = document.getElementById('users-table-body');
    
    if (mockUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">No users found in database.</td></tr>';
    }

    mockUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>🪙 ${user.coins.toLocaleString()}</td>
            <td><span class="status-badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="rewardUser('${user.name}', '${user.id}')" style="background: #eab308; color: #fff; border: none;">Reward Coins</button>
                <button class="btn btn-sm btn-outline">Edit</button>
                ${user.status !== 'banned' 
                    ? `<button class="btn btn-sm btn-danger" onclick="alert('Ban ${user.name}?')">Ban</button>`
                    : `<button class="btn btn-sm btn-outline" onclick="alert('Unban ${user.name}?')">Unban</button>`}
            </td>
        `;
        usersTableBody.appendChild(tr);
    });

    // Window scope function for inline onclick handler
    window.rewardUser = function(userName, userId) {
        const amount = prompt(`Give Daily/Manual Reward\n\nHow many coins would you like to reward to ${userName} (${userId})?`);
        if (amount && !isNaN(amount) && Number(amount) > 0) {
            alert(`Success! 🪙 ${amount} coins have been added to ${userName}'s account.`);
            // Note: In a real app, this would trigger an API call to update the database
        } else if (amount) {
            alert('Error: Please enter a valid positive number of coins.');
        }
    };

    // Empty Mock Games
    const mockGames = [];

    const gamesTableBody = document.getElementById('games-table-body');
    
    if (mockGames.length === 0) {
        gamesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">No active games currently.</td></tr>';
    }

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

    // Empty Mock Transactions
    const mockTx = [];

    const txList = document.getElementById('recent-transactions');
    
    if (mockTx.length === 0) {
        txList.innerHTML = '<li style="text-align:center; color: var(--text-muted); padding: 20px;">No recent transactions.</li>';
    }

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

    // --- NEW SECTIONS LOGIC ---
    
    // 1. Content Management Mock Data
    const mockContent = [
        { title: 'Welcome to Card Arena!', type: 'Announcement', status: 'Published', date: 'Oct 01, 2026' },
        { title: 'Weekend 2x Coins Event', type: 'Banner Event', status: 'Draft', date: 'Oct 05, 2026' },
        { title: 'Server Maintenance Notice', type: 'News', status: 'Archived', date: 'Sep 28, 2026' }
    ];
    const contentTbody = document.querySelector('#content-view tbody');
    contentTbody.innerHTML = '';
    mockContent.forEach(item => {
        contentTbody.innerHTML += `
            <tr>
                <td><strong>${item.title}</strong></td>
                <td>${item.type}</td>
                <td><span class="status-badge ${item.status === 'Published' ? 'status-active' : 'status-offline'}">${item.status}</span></td>
                <td>${item.date}</td>
                <td>
                    <button class="btn btn-sm btn-outline">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="alert('Delete post: ${item.title}?')">Delete</button>
                </td>
            </tr>
        `;
    });
    document.querySelector('#content-view .btn-primary').addEventListener('click', () => {
        alert('Opening rich-text editor for New Post...');
    });

    // 2. Coin Exchange Mock Data
    const mockRequests = [
        { reqId: 'REQ-9921', user: 'ProPlayer99', amount: 5000, usd: '$50.00', status: 'Pending' },
        { reqId: 'REQ-9922', user: 'CardShark', amount: 12000, usd: '$120.00', status: 'Pending' },
    ];
    const exchangeTbody = document.querySelector('#coin-exchange-view tbody');
    exchangeTbody.innerHTML = '';
    mockRequests.forEach(req => {
        exchangeTbody.innerHTML += `
            <tr>
                <td><strong>${req.reqId}</strong></td>
                <td>${req.user}</td>
                <td>🪙 ${req.amount.toLocaleString()}</td>
                <td>${req.usd}</td>
                <td><span style="color: #eab308; font-weight: bold;">${req.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" style="background: #22c55e; color: #fff; border:none;" onclick="alert('Approved withdrawal for ${req.usd}')">Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="alert('Denied withdrawal request ${req.reqId}')">Deny</button>
                </td>
            </tr>
        `;
    });

    // 3. Reports & Exports Logic
    const reportBtns = document.querySelectorAll('#reports-view .btn');
    reportBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportName = e.target.parentElement.querySelector('h3').innerText;
            alert(`Generating ${reportName}...\nDownload will start shortly.`);
        });
    });

    // 4. Roles & Permissions Logic
    document.querySelector('#roles-view .btn-primary').addEventListener('click', () => {
        const role = prompt("Enter new Role Name:");
        if(role) alert(`Role '${role}' created successfully. You can now assign permissions.`);
    });

    // 5. Orders & Bookings Mock Data
    const mockOrders = [
        { id: 'ORD-101', user: 'AlexG', item: 'Premium Avatar Frame', cost: '🪙 500', status: 'Completed' },
        { id: 'ORD-102', user: 'Sam23', item: 'VIP Monthly Sub', cost: '$9.99', status: 'Active' },
        { id: 'ORD-103', user: 'CardShark', item: '10,000 Coin Bundle', cost: '$80.00', status: 'Completed' }
    ];
    const ordersTbody = document.querySelector('#orders-view tbody');
    ordersTbody.innerHTML = '';
    mockOrders.forEach(order => {
        ordersTbody.innerHTML += `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.user}</td>
                <td>${order.item}</td>
                <td>${order.cost}</td>
                <td><span class="status-badge ${order.status === 'Completed' ? 'status-active' : 'status-offline'}">${order.status}</span></td>
                <td><button class="btn btn-sm btn-outline" onclick="alert('Viewing receipt for ${order.id}')">Receipt</button></td>
            </tr>
        `;
    });

    // Logout Handling
    document.querySelector('.logout-btn').addEventListener('click', () => {
        if(confirm('Are you sure you want to log out?')) {
            sessionStorage.removeItem('isAdmin');
            window.location.href = 'admin-login.html';
        }
    });
});
