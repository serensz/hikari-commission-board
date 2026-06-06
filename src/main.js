import './style.css';
import { loadState, saveState, uid, syncClientsToGist } from './storage';
import { GAMES, TASK_LABELS, STATUS_OPTIONS } from './gamedata';
import { parseURL, navigate } from './router';
import { renderPublicHome, renderPublicLookup, renderPublicQueue } from './public-ui';
import { renderAdminSetup, renderAdminSettings, renderPublishModal } from './admin-ui';
import { loadGistConfig, saveGistConfig, testGistAuth, fetchPublicQueue, PUBLIC_GIST_ID } from './gist';
// STATE
let state = loadState();
let adminTab = 'clients';
let filterGame = 'All';
let filterStatus = 'All';
let searchQuery = '';
let gistUsername, gistEmail;
let publicClients = [], publicSearchQuery = '', publicLoading = false, publicError;
// GLOBAL HANDLERS FOR PUBLIC UI
window.lookupSelectClient = (id) => navigate('public-lookup', { id });
window.queueSelectClient = (id) => navigate('public-lookup', { id });
// HELPERS
function statusClass(s) { return { Pending: 'status-pending', 'In Progress': 'status-inprog', Done: 'status-done', 'On Hold': 'status-hold' }[s]; }
function progressColor(p) { if (p >= 100)
    return '#4CAF50'; if (p >= 60)
    return '#4FC3F7'; if (p >= 30)
    return '#FFB74D'; return '#EF5350'; }
function taskDots(tasks) { return Object.entries(tasks).map(([k, v]) => `<span class="task-dot ${v ? 'dot-on' : 'dot-off'}" title="${TASK_LABELS[k]}">${v ? '●' : '○'}</span>`).join(''); }
function formatDate(d) { if (!d)
    return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatTHB(amount) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount); }
function calcStats() {
    const c = state.clients, total = c.length;
    const byGame = { WuWa: 0, HSR: 0, ZZZ: 0, Endfield: 0 };
    const byStatus = { Pending: 0, 'In Progress': 0, Done: 0, 'On Hold': 0 };
    let totalIncome = 0, paidIncome = 0;
    c.forEach(cl => { byGame[cl.game]++; byStatus[cl.status]++; });
    state.income.forEach(e => { totalIncome += e.amount; if (e.paid)
        paidIncome += e.amount; });
    return { total, byGame, byStatus, totalIncome, paidIncome };
}
// MAIN ROUTER
async function router() {
    const route = parseURL();
    if (route.page.startsWith('admin-'))
        await renderAdminPage(route);
    else
        await renderPublicPage(route);
    attachEventListeners();
}
// ADMIN PAGE RENDERER
async function renderAdminPage(route) {
    const app = document.getElementById('app');
    if (route.page === 'admin-setup') {
        app.innerHTML = `<div class="header"><div class="header-left"><div class="logo">✨ Hikari's Commission Board</div><div class="tagline">Admin Setup</div></div></div><div class="main-content">${renderAdminSetup()}</div>`;
    }
    else {
        const config = loadGistConfig();
        if (config === null) {
            navigate('admin-setup');
            return;
        }
        app.innerHTML = `
      <div class="header"><div class="header-left"><div class="logo">✨ Hikari's Commission Board</div><div class="tagline">Admin</div></div><div class="header-right"><button class="btn btn-ghost btn-sm" id="navPublicBtn">👁 View Public</button><button class="btn btn-primary btn-sm" id="publishQueueBtn">📤 Publish Queue</button></div></div>
      <div class="tab-nav"><button class="tab-btn ${adminTab === 'clients' ? 'active' : ''}" data-tab="clients">👥 Clients</button><button class="tab-btn ${adminTab === 'income' ? 'active' : ''}" data-tab="income">💰 Income</button><button class="tab-btn ${adminTab === 'stats' ? 'active' : ''}" data-tab="stats">📊 Stats</button><button class="tab-btn ${adminTab === 'settings' ? 'active' : ''}" data-tab="settings">⚙️ Settings</button></div>
      <div class="main-content">${adminTab === 'clients' ? renderAdminClients() : adminTab === 'income' ? renderAdminIncome() : adminTab === 'stats' ? renderAdminStats() : renderAdminSettings(gistUsername, gistEmail, loadGistConfig()?.gistId)}</div>
    `;
    }
}
// PUBLIC PAGE RENDERER
async function renderPublicPage(route) {
    const app = document.getElementById('app');
    let pageContent = '';
    if (route.page === 'public-home')
        pageContent = renderPublicHome();
    else if (route.page === 'public-lookup') {
        await loadPublicQueue();
        const selectedId = route.params.id;
        const selected = selectedId ? publicClients.find(c => c.id === selectedId) : null;
        // Initial render includes ALL clients. We filter via DOM later.
        pageContent = renderPublicLookup(publicClients, selected || null, publicSearchQuery, publicLoading);
    }
    else if (route.page === 'public-queue') {
        await loadPublicQueue();
        pageContent = renderPublicQueue(publicClients, publicLoading, publicError);
    }
    app.innerHTML = `
    <div class="header"><div class="header-left"><div class="logo">✨ Hikari's Commission Board</div><div class="tagline">Public Queue</div></div><div class="header-right"><a href="#admin-setup" class="btn btn-ghost btn-sm">🔐 Admin</a></div></div>
    <div class="main-content">${pageContent}</div>
  `;
}
// ADMIN CLIENTS RENDER
function renderAdminClients() {
    const filtered = state.clients.filter(c => {
        const mg = filterGame === 'All' || c.game === filterGame;
        const ms = filterStatus === 'All' || c.status === filterStatus;
        return mg && ms;
    });
    return `
    <div class="tab-toolbar"><div class="search-wrap"><input type="text" id="searchClients" class="search-input" placeholder="Search clients..." value="${searchQuery}"></div><button class="btn btn-primary" id="addClientBtn">➕ New Client</button></div>
    <div class="filter-row"><button class="filter-btn ${filterGame === 'All' ? 'active' : ''}" data-filter-game="All">All Games</button>${['WuWa', 'HSR', 'ZZZ', 'Endfield'].map(g => `<button class="filter-btn game-btn ${filterGame === g ? 'active' : ''}" data-filter-game="${g}">${GAMES[g].emoji} ${g}</button>`).join('')}</div>
    <div class="filter-row"><button class="filter-btn ${filterStatus === 'All' ? 'active' : ''}" data-filter-status="All">All Status</button>${STATUS_OPTIONS.map(s => `<button class="filter-btn ${filterStatus === s ? 'active' : ''}" data-filter-status="${s}">${s}</button>`).join('')}</div>
    <div class="summary-chips"><div class="chip done-chip">✓ Done: ${state.clients.filter(c => c.status === 'Done').length}</div><div class="chip inprog-chip">→ In Progress: ${state.clients.filter(c => c.status === 'In Progress').length}</div><div class="chip">⏳ Total: ${state.clients.length}</div></div>
    ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><p>No clients found</p></div>` : `<div class="cards-grid" id="adminCardsGrid">${filtered.map(c => `
      <div class="client-card" data-client-id="${c.id}" data-search-text="${c.name.toLowerCase()} ${c.contact.toLowerCase()} ${c.id.toLowerCase()}">
        <div class="card-top">
          <div class="card-left"><div class="client-name">${c.name}</div><div class="client-contact">${c.contact}</div></div>
          <div class="card-right">
            <div class="game-badge" style="border-color: ${GAMES[c.game].accent}; color: ${GAMES[c.game].accent};">
              <img src="${GAMES[c.game].logo}" style="width: 14px; height: 14px; border-radius: 2px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span class="game-emoji fallback-emoji" style="display: none;">${GAMES[c.game].emoji}</span> ${c.game}
            </div>
            <span class="status-badge ${statusClass(c.status)}">${c.status}</span>
          </div>
        </div>
        <div class="card-pkg">${c.package || '<em>No package</em>'}</div>
        <div class="progress-row"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${c.progress}%; background-color: ${progressColor(c.progress)}"></div></div><div class="progress-pct">${c.progress}%</div></div>
        <div class="card-bottom"><div class="task-dots">${taskDots(c.tasks)}</div><div class="card-dates">${formatDate(c.startDate)} <span class="arrow">→</span> ${formatDate(c.deadline)}</div></div>
        ${c.notes ? `<div class="card-notes">📝 ${c.notes}</div>` : ''}
        <div style="margin-top: 0.8rem; display: flex; gap: 0.4rem;"><button class="btn btn-sm btn-ghost edit-client-btn" data-client-id="${c.id}">✏️ Edit</button><button class="btn btn-sm btn-danger delete-client-btn" data-client-id="${c.id}">🗑️ Delete</button></div>
      </div>
    `).join('')}</div>`}
  `;
}
function renderAdminIncome() {
    const ti = state.income.reduce((s, e) => s + e.amount, 0);
    const pi = state.income.filter(e => e.paid).reduce((s, e) => s + e.amount, 0);
    const ui = ti - pi;
    return `
    <div class="tab-toolbar">
      <button class="btn btn-primary" id="addIncomeBtn">➕ Add Income Entry</button>
    </div>
    
    <!-- Added back the summary view for a quick financial snapshot -->
    <div class="income-summary">
      <div class="income-stat"><div class="income-stat-label">Total</div><div class="income-stat-value">${formatTHB(ti)}</div></div>
      <div class="income-stat"><div class="income-stat-label">Paid</div><div class="income-stat-value paid">${formatTHB(pi)}</div></div>
      <div class="income-stat"><div class="income-stat-label">Unpaid</div><div class="income-stat-value unpaid">${formatTHB(ui)}</div></div>
    </div>

    <div class="income-list">
      ${state.income.length === 0 ? '<div class="empty-state">No income records yet.</div>' : ''}
      ${state.income.map(e => `
        <div class="income-row">
          <div class="income-info">
            <strong>${e.clientName}</strong>
            <span class="income-meta">${GAMES[e.game].emoji} ${e.service} • ${e.month}</span>
          </div>
          <div class="income-amount ${e.paid ? 'paid' : 'unpaid'}">
            ${e.paid ? '✓' : '○'} ${formatTHB(e.amount)}
          </div>
          <div class="income-actions">
            <button class="btn-icon edit-income-btn" data-income-id="${e.id}">✏️</button>
            <button class="btn-icon delete-income-btn" data-income-id="${e.id}">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
// ADMIN STATS RENDER
function renderAdminStats() {
    const s = calcStats();
    return `
    <div class="stats-grid"><div class="stat-card"><div class="stat-card-title">Total Clients</div><div class="stat-big-num">${s.total}</div></div><div class="stat-card"><div class="stat-card-title">Done</div><div class="stat-big-num done">${s.byStatus.Done}</div></div><div class="stat-card"><div class="stat-card-title">In Progress</div><div class="stat-big-num active">${s.byStatus['In Progress']}</div></div><div class="stat-card"><div class="stat-card-title">Total Income</div><div class="stat-big-num income">${formatTHB(s.totalIncome)}</div></div></div>
    <div class="stats-panels">
      <div class="stats-panel"><h3>By Game</h3>${Object.entries(s.byGame).map(([g, c]) => `<div class="stat-game-row"><div class="stat-game-label"><img src="${GAMES[g].logo}" style="width:16px; border-radius:2px; vertical-align:middle;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span class="game-emoji fallback-emoji" style="display:none;">${GAMES[g].emoji}</span> ${g}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${s.total ? Math.round(c / s.total * 100) : 0}%; background-color: ${GAMES[g].accent};"></div></div><div class="stat-count">${c}</div></div>`).join('')}</div>
      <div class="stats-panel"><h3>By Status</h3>${STATUS_OPTIONS.map(st => { const c = s.byStatus[st]; const colors = { Pending: '#FFB74D', 'In Progress': '#4FC3F7', Done: '#4CAF50', 'On Hold': '#9E9E9E' }; return `<div class="stat-game-row"><div class="stat-game-label">${st}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${s.total ? Math.round(c / s.total * 100) : 0}%; background-color: ${colors[st]};"></div></div><div class="stat-count">${c}</div></div>`; }).join('')}</div>
    </div>
  `;
}
// LOAD PUBLIC QUEUE
async function loadPublicQueue() {
    if (publicLoading || publicClients.length > 0)
        return;
    publicLoading = true;
    publicError = undefined;
    try {
        if (!PUBLIC_GIST_ID)
            throw new Error('Admin has not linked the public queue ID yet.');
        const queueData = await fetchPublicQueue(PUBLIC_GIST_ID);
        publicClients = queueData.clients;
        publicLoading = false;
        const ts = document.getElementById('queueLastUpdated');
        if (ts && queueData.lastUpdated)
            ts.textContent = new Date(queueData.lastUpdated).toLocaleString('en-GB');
    }
    catch (err) {
        publicError = err instanceof Error ? err.message : 'Failed to load queue';
        publicLoading = false;
    }
}
// EVENT LISTENERS
function attachEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { const tab = e.target.getAttribute('data-tab'); if (tab) {
            adminTab = tab;
            router();
        } });
    });
    document.querySelectorAll('[data-filter-game]').forEach(btn => { btn.addEventListener('click', (e) => { filterGame = e.target.getAttribute('data-filter-game'); router(); }); });
    document.querySelectorAll('[data-filter-status]').forEach(btn => { btn.addEventListener('click', (e) => { filterStatus = e.target.getAttribute('data-filter-status'); router(); }); });
    // Replace the search listener in main.ts with this:
    document.getElementById('searchClients')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.client-card').forEach(card => {
            const text = card.getAttribute('data-search-text') || '';
            card.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
    document.getElementById('lookupSearch')?.addEventListener('input', (e) => {
        publicSearchQuery = e.target.value.toLowerCase();
        let count = 0;
        document.querySelectorAll('.lookup-item').forEach(item => {
            const text = item.getAttribute('data-search-text') || '';
            if (text.includes(publicSearchQuery)) {
                item.style.display = 'flex';
                count++;
            }
            else {
                item.style.display = 'none';
            }
        });
        const hdr = document.getElementById('searchCountHeader');
        if (hdr)
            hdr.textContent = `Search Results (${count})`;
    });
    // Admin Client buttons
    document.getElementById('addClientBtn')?.addEventListener('click', () => showClientModal());
    document.querySelectorAll('.edit-client-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-client-id');
            const client = state.clients.find(c => c.id === id);
            if (client)
                showClientModal(client);
        });
    });
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Are you sure you want to delete this client?')) {
                state.clients = state.clients.filter(c => c.id !== e.currentTarget.getAttribute('data-client-id'));
                saveState(state);
                router();
            }
        });
    });
    // 🔥 Admin Income buttons
    document.getElementById('addIncomeBtn')?.addEventListener('click', () => showIncomeModal());
    document.querySelectorAll('.edit-income-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-income-id');
            const entry = state.income.find(inc => inc.id === id);
            if (entry)
                showIncomeModal(entry);
        });
    });
    document.querySelectorAll('.delete-income-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Are you sure you want to delete this income record?')) {
                state.income = state.income.filter(inc => inc.id !== e.currentTarget.getAttribute('data-income-id'));
                saveState(state);
                router();
            }
        });
    });
    // Publish queue
    document.getElementById('publishQueueBtn')?.addEventListener('click', async () => {
        const mod = document.createElement('div');
        const pc = state.clients.filter(c => c.status !== 'On Hold').length;
        mod.innerHTML = renderPublishModal(state.clients.length, pc);
        document.getElementById('app').appendChild(mod);
        document.getElementById('confirmPublishBtn')?.addEventListener('click', async () => {
            try {
                const config = loadGistConfig();
                if (!config?.token)
                    throw new Error('GitHub token not configured');
                await syncClientsToGist(state.clients.filter(c => c.status !== 'On Hold'), gistEmail);
                alert('✓ Queue published successfully!');
                mod.remove();
            }
            catch (err) {
                alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
            }
        });
        document.getElementById('cancelPublishBtn')?.addEventListener('click', () => mod.remove());
    });
    // GitHub Setup
    document.getElementById('testTokenBtn')?.addEventListener('click', async () => {
        const token = document.getElementById('githubToken')?.value.trim();
        if (!token) {
            alert('Enter GitHub token');
            return;
        }
        const status = document.getElementById('setupStatus');
        status.style.display = 'block';
        status.textContent = '⏳ Testing...';
        try {
            const user = await testGistAuth(token);
            if (user.username !== 'serensz')
                throw new Error('Unauthorized: This dashboard is restricted.');
            saveGistConfig({ token });
            gistUsername = user.username;
            gistEmail = user.email;
            status.textContent = `✓ Auth OK: @${user.username}`;
            status.style.background = '#4CAF5020';
            status.style.color = '#4CAF50';
            setTimeout(() => navigate('admin-dashboard'), 1000);
        }
        catch (err) {
            status.textContent = `✗ ${err instanceof Error ? err.message : 'Failed'}`;
            status.style.background = '#EF535020';
            status.style.color = '#EF5350';
        }
    });
    document.getElementById('skipSetupBtn')?.addEventListener('click', () => { saveGistConfig({ token: '' }); navigate('admin-dashboard'); });
    document.getElementById('navPublicBtn')?.addEventListener('click', () => navigate('public-home'));
}
// 🔥 INCOME MODAL (New Feature)
function showIncomeModal(entry) {
    const e = entry || { id: uid(), clientId: '', clientName: '', game: 'WuWa', service: '', amount: 0, paid: false, month: new Date().toISOString().slice(0, 7), notes: '' };
    const div = document.createElement('div');
    div.innerHTML = `
    <div class="modal-overlay" id="incomeModal">
      <div class="modal"><div class="modal-header"><h2>${entry ? '✏️ Edit Income' : '➕ Add Income'}</h2><button class="modal-close" id="closeIncomeModal">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Client Name *</label><input type="text" id="i_clientName" value="${e.clientName}" placeholder="Name"></div>
          <div class="form-group"><label>Game *</label><select id="i_game">${['WuWa', 'HSR', 'ZZZ', 'Endfield'].map(g => `<option value="${g}" ${e.game === g ? 'selected' : ''}>${GAMES[g].emoji} ${g}</option>`).join('')}</select></div>
          <div class="form-group"><label>Service</label><input type="text" id="i_service" value="${e.service}" placeholder="e.g. Full Clear"></div>
          <div class="form-group"><label>Amount (THB) *</label><input type="number" id="i_amount" value="${e.amount}"></div>
          <div class="form-group"><label>Month</label><input type="month" id="i_month" value="${e.month}"></div>
          <div class="form-group"><label>Status</label><div class="task-checks"><label class="check-label"><input type="checkbox" id="i_paid" ${e.paid ? 'checked' : ''}> Paid Successfully</label></div></div>
          <div class="form-group full"><label>Notes</label><input type="text" id="i_notes" value="${e.notes}" placeholder="Notes..."></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-ghost" id="closeIncomeModalBtn">Cancel</button><button class="btn btn-primary" id="saveIncomeBtn">Save</button></div></div>
    </div>
  `;
    document.getElementById('app').appendChild(div);
    document.getElementById('closeIncomeModal')?.addEventListener('click', () => div.remove());
    document.getElementById('closeIncomeModalBtn')?.addEventListener('click', () => div.remove());
    document.getElementById('saveIncomeBtn')?.addEventListener('click', () => {
        const clientName = document.getElementById('i_clientName')?.value.trim();
        if (!clientName) {
            alert('Client Name required');
            return;
        }
        const updated = {
            id: entry?.id || uid(),
            clientId: e.clientId,
            clientName,
            game: document.getElementById('i_game')?.value,
            service: document.getElementById('i_service')?.value,
            amount: parseFloat(document.getElementById('i_amount')?.value || '0'),
            paid: document.getElementById('i_paid')?.checked || false,
            month: document.getElementById('i_month')?.value,
            notes: document.getElementById('i_notes')?.value,
        };
        if (entry)
            state.income = state.income.map(inc => inc.id === updated.id ? updated : inc);
        else
            state.income.push(updated);
        saveState(state);
        div.remove();
        router();
    });
}
// CLIENT MODAL
function showClientModal(client) {
    const c = client || { id: uid(), name: '', contact: '', game: 'WuWa', startDate: '', deadline: '', package: '', status: 'Pending', progress: 0, tasks: { daily: false, weekly: false, monthly: false, story: false, special: false, endgame: false }, notes: '', createdAt: Date.now() };
    const div = document.createElement('div');
    div.innerHTML = `
    <div class="modal-overlay" id="clientModal">
      <div class="modal"><div class="modal-header"><h2>${client ? '✏️ Edit Client' : '➕ New Client'}</h2><button class="modal-close" id="closeClientModal">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Client Name *</label><input type="text" id="f_name" value="${c.name}" placeholder="e.g. Client001"></div>
          <div class="form-group"><label>Contact</label><input type="text" id="f_contact" value="${c.contact}" placeholder="@discord"></div>
          <div class="form-group"><label>Game *</label><select id="f_game">${['WuWa', 'HSR', 'ZZZ', 'Endfield'].map(g => `<option value="${g}" ${c.game === g ? 'selected' : ''}>${GAMES[g].emoji} ${g}</option>`).join('')}</select></div>
          <div class="form-group"><label>Status</label><select id="f_status">${STATUS_OPTIONS.map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="form-group"><label>Start Date</label><input type="date" id="f_startDate" value="${c.startDate}"></div>
          <div class="form-group"><label>Deadline</label><input type="date" id="f_deadline" value="${c.deadline}"></div>
          <div class="form-group"><label>Package</label><input type="text" id="f_package" value="${c.package}" placeholder="e.g. Full Clear"></div>
          <div class="form-group"><label>Progress %</label><div style="display: flex; align-items: center; gap: 0.6rem;"><input type="range" id="f_progress" class="range-input" min="0" max="100" value="${c.progress}" style="--pct: ${c.progress}%;"><span id="progressValue" style="font-weight: 700; min-width: 3rem;">${c.progress}</span></div></div>
          <div class="form-group full"><label>Tasks</label><div class="task-checks">${Object.keys(c.tasks).map(k => `<label class="check-label"><input type="checkbox" name="task_${k}" ${c.tasks[k] ? 'checked' : ''}>${TASK_LABELS[k]}</label>`).join('')}</div></div>
          <div class="form-group full"><label>Notes</label><textarea id="f_notes" placeholder="Notes..." style="height: 80px;">${c.notes}</textarea></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-ghost" id="closeClientModalBtn">Cancel</button><button class="btn btn-primary" id="saveClientBtn">Save</button></div></div>
    </div>
  `;
    document.getElementById('app').appendChild(div);
    const prg = document.getElementById('f_progress');
    if (prg)
        prg.addEventListener('input', () => { prg.style.setProperty('--pct', prg.value + '%'); document.getElementById('progressValue').textContent = prg.value; });
    document.getElementById('closeClientModal')?.addEventListener('click', () => div.remove());
    document.getElementById('closeClientModalBtn')?.addEventListener('click', () => div.remove());
    document.getElementById('saveClientBtn')?.addEventListener('click', () => {
        const name = document.getElementById('f_name')?.value.trim();
        if (!name) {
            alert('Name required');
            return;
        }
        const updated = {
            id: client?.id || uid(),
            name,
            contact: document.getElementById('f_contact')?.value,
            game: document.getElementById('f_game')?.value,
            status: document.getElementById('f_status')?.value,
            startDate: document.getElementById('f_startDate')?.value,
            deadline: document.getElementById('f_deadline')?.value,
            package: document.getElementById('f_package')?.value,
            progress: parseInt(document.getElementById('f_progress')?.value || '0'),
            tasks: {
                daily: document.querySelector('[name="task_daily"]')?.checked || false,
                weekly: document.querySelector('[name="task_weekly"]')?.checked || false,
                monthly: document.querySelector('[name="task_monthly"]')?.checked || false,
                story: document.querySelector('[name="task_story"]')?.checked || false,
                special: document.querySelector('[name="task_special"]')?.checked || false,
                endgame: document.querySelector('[name="task_endgame"]')?.checked || false,
            },
            notes: document.getElementById('f_notes')?.value,
            createdAt: client?.createdAt || Date.now(),
        };
        if (client)
            state.clients = state.clients.map(c => c.id === updated.id ? updated : c);
        else
            state.clients.push(updated);
        saveState(state);
        div.remove();
        router();
    });
}
// INITIALIZATION
async function init() {
    const config = loadGistConfig();
    if (config?.token) {
        try {
            const user = await testGistAuth(config.token);
            gistUsername = user.username;
            gistEmail = user.email;
        }
        catch (e) {
            console.warn('GitHub session could not be restored automatically.');
        }
    }
    router();
}
// INIT
window.addEventListener('hashchange', router);
init();
