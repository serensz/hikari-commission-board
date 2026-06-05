// Complete dual-mode admin/public GameBoost Tracker
// This is the new main entry point with router support

import './style.css'

import type { Client, AppState, Game, Status, TaskSet } from './types'
import { loadState, saveState, uid, syncClientsToGist } from './storage'
import { GAMES, TASK_LABELS, STATUS_OPTIONS } from './gamedata'
import { parseURL, navigate, type RouterState } from './router'
import { renderPublicHome, renderPublicLookup, renderPublicQueue } from './public-ui'
import { renderAdminSetup, renderAdminSettings, renderPublishModal } from './admin-ui'
import { loadGistConfig, saveGistConfig, testGistAuth, fetchPublicQueue } from './gist'

// STATE
let state: AppState = loadState()
let adminTab: 'clients' | 'income' | 'stats' | 'settings' = 'clients'
let filterGame: Game | 'All' = 'All'
let filterStatus: Status | 'All' = 'All'
let searchQuery = ''
let gistUsername: string | undefined, gistEmail: string | undefined
let publicClients: Client[] = [], publicSearchQuery = '', publicLoading = false, publicError: string | undefined

// HELPERS
function statusClass(s: Status): string {
  return { Pending: 'status-pending', 'In Progress': 'status-inprog', Done: 'status-done', 'On Hold': 'status-hold' }[s]
}
function progressColor(p: number): string {
  if (p >= 100) return '#4CAF50'; if (p >= 60) return '#4FC3F7'; if (p >= 30) return '#FFB74D'; return '#EF5350'
}
function taskDots(tasks: TaskSet): string {
  return Object.entries(tasks).map(([k, v]) => `<span class="task-dot ${v ? 'dot-on' : 'dot-off'}" title="${TASK_LABELS[k]}">${v ? '●' : '○'}</span>`).join('')
}
function formatDate(d: string): string {
  if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount)
}
function calcStats() {
  const c = state.clients, total = c.length
  const byGame = { WuWa: 0, HSR: 0, ZZZ: 0, Endfield: 0 } as Record<Game, number>
  const byStatus = { Pending: 0, 'In Progress': 0, Done: 0, 'On Hold': 0 } as Record<Status, number>
  let totalIncome = 0, paidIncome = 0
  c.forEach(cl => { byGame[cl.game]++; byStatus[cl.status]++ })
  state.income.forEach(e => { totalIncome += e.amount; if (e.paid) paidIncome += e.amount })
  return { total, byGame, byStatus, totalIncome, paidIncome }
}

// MAIN ROUTER
async function router() {
  const route = parseURL()
  if (route.page.startsWith('admin-')) await renderAdminPage(route)
  else await renderPublicPage(route)
  attachEventListeners()
}

// ADMIN PAGE RENDERER
async function renderAdminPage(route: RouterState) {
  const app = document.getElementById('app')!
  if (route.page === 'admin-setup') {
    app.innerHTML = `<div class="header"><div class="header-left"><div class="logo">🎮 GameBoost</div><div class="tagline">Admin Setup</div></div></div><div class="main-content">${renderAdminSetup()}</div>`
  } else {
    const config = loadGistConfig()
    if (config === null) { navigate('admin-setup'); return }
    app.innerHTML = `
      <div class="header"><div class="header-left"><div class="logo">🎮 GameBoost</div><div class="tagline">Admin</div></div><div class="header-right"><button class="btn btn-ghost btn-sm" id="navPublicBtn">👁 View Public</button><button class="btn btn-primary btn-sm" id="publishQueueBtn">📤 Publish Queue</button></div></div>
      <div class="tab-nav"><button class="tab-btn ${adminTab === 'clients' ? 'active' : ''}" data-tab="clients">👥 Clients</button><button class="tab-btn ${adminTab === 'income' ? 'active' : ''}" data-tab="income">💰 Income</button><button class="tab-btn ${adminTab === 'stats' ? 'active' : ''}" data-tab="stats">📊 Stats</button><button class="tab-btn ${adminTab === 'settings' ? 'active' : ''}" data-tab="settings">⚙️ Settings</button></div>
      <div class="main-content">${adminTab === 'clients' ? renderAdminClients() : adminTab === 'income' ? renderAdminIncome() : adminTab === 'stats' ? renderAdminStats() : renderAdminSettings(gistUsername, gistEmail, loadGistConfig()?.gistId)}</div>
    `
  }
}

// PUBLIC PAGE RENDERER
async function renderPublicPage(route: RouterState) {
  const app = document.getElementById('app')!
  let pageContent = ''
  if (route.page === 'public-home') pageContent = renderPublicHome()
  else if (route.page === 'public-lookup') pageContent = renderPublicLookup(publicClients, null, publicSearchQuery, publicLoading)
  else if (route.page === 'public-queue') { await loadPublicQueue(); pageContent = renderPublicQueue(publicClients, publicLoading, publicError) }
  app.innerHTML = `
    <div class="header"><div class="header-left"><div class="logo">🎮 GameBoost</div><div class="tagline">Public Queue</div></div><div class="header-right"><a href="#admin-setup" class="btn btn-ghost btn-sm">🔐 Admin</a></div></div>
    <div class="main-content">${pageContent}</div>
  `
}

// ADMIN CLIENTS RENDER
function renderAdminClients(): string {
  const filtered = state.clients.filter(c => {
    const mg = filterGame === 'All' || c.game === filterGame
    const ms = filterStatus === 'All' || c.status === filterStatus
    const sq = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.contact.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery)
    return mg && ms && sq
  })
  return `
    <div class="tab-toolbar"><div class="search-wrap"><input type="text" id="searchClients" class="search-input" placeholder="Search clients..." value="${searchQuery}"></div><button class="btn btn-primary" id="addClientBtn">➕ New Client</button></div>
    <div class="filter-row"><button class="filter-btn ${filterGame === 'All' ? 'active' : ''}" data-filter-game="All">All Games</button>${(['WuWa', 'HSR', 'ZZZ', 'Endfield'] as Game[]).map(g => `<button class="filter-btn game-btn ${filterGame === g ? 'active' : ''}" data-filter-game="${g}">${GAMES[g].emoji} ${g}</button>`).join('')}</div>
    <div class="filter-row"><button class="filter-btn ${filterStatus === 'All' ? 'active' : ''}" data-filter-status="All">All Status</button>${STATUS_OPTIONS.map(s => `<button class="filter-btn ${filterStatus === s ? 'active' : ''}" data-filter-status="${s}">${s}</button>`).join('')}</div>
    <div class="summary-chips"><div class="chip done-chip">✓ Done: ${state.clients.filter(c => c.status === 'Done').length}</div><div class="chip inprog-chip">→ In Progress: ${state.clients.filter(c => c.status === 'In Progress').length}</div><div class="chip">⏳ Total: ${state.clients.length}</div></div>
    ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><p>No clients found</p></div>` : `<div class="cards-grid">${filtered.map(c => `
      <div class="client-card" data-client-id="${c.id}">
        <div class="card-top"><div class="card-left"><div class="client-name">${c.name}</div><div class="client-contact">${c.contact}</div></div><div class="card-right"><div class="game-badge" style="border-color: ${GAMES[c.game].accent}; color: ${GAMES[c.game].accent};">${GAMES[c.game].emoji} ${c.game}</div><span class="status-badge ${statusClass(c.status)}">${c.status}</span></div></div>
        <div class="card-pkg">${c.package || '<em>No package</em>'}</div>
        <div class="progress-row"><div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${c.progress}%; background-color: ${progressColor(c.progress)}"></div></div><div class="progress-pct">${c.progress}%</div></div>
        <div class="card-bottom"><div class="task-dots">${taskDots(c.tasks)}</div><div class="card-dates">${formatDate(c.startDate)} <span class="arrow">→</span> ${formatDate(c.deadline)}</div></div>
        ${c.notes ? `<div class="card-notes">📝 ${c.notes}</div>` : ''}
        <div style="margin-top: 0.8rem; display: flex; gap: 0.4rem;"><button class="btn btn-sm btn-ghost edit-client-btn" data-client-id="${c.id}">✏️ Edit</button><button class="btn btn-sm btn-danger delete-client-btn" data-client-id="${c.id}">🗑️ Delete</button></div>
      </div>
    `).join('')}</div>`}
  `
}

// ADMIN INCOME RENDER
function renderAdminIncome(): string {
  const ti = state.income.reduce((s, e) => s + e.amount, 0)
  const pi = state.income.filter(e => e.paid).reduce((s, e) => s + e.amount, 0)
  const ui = ti - pi
  return `
    <div class="tab-toolbar"><button class="btn btn-primary" id="addIncomeBtn">➕ Add Income</button></div>
    <div class="income-summary"><div class="income-stat"><div class="income-stat-label">Total Income</div><div class="income-stat-value">${formatTHB(ti)}</div></div><div class="income-stat"><div class="income-stat-label">Paid</div><div class="income-stat-value paid">${formatTHB(pi)}</div></div><div class="income-stat"><div class="income-stat-label">Unpaid</div><div class="income-stat-value unpaid">${formatTHB(ui)}</div></div></div>
    ${state.income.length === 0 ? `<div class="empty-state"><div class="empty-icon">💸</div><p>No income records</p></div>` : `<table class="income-table"><thead><tr><th>Client</th><th>Game</th><th>Service</th><th>Amount</th><th>Month</th><th>Paid</th><th>Notes</th><th></th></tr></thead><tbody>${state.income.map(e => `<tr><td>${e.clientName}</td><td><span class="game-badge-sm" style="border-color: ${GAMES[e.game].accent}; color: ${GAMES[e.game].accent};">${GAMES[e.game].emoji} ${e.game}</span></td><td>${e.service}</td><td class="amount-cell">${formatTHB(e.amount)}</td><td>${e.month}</td><td><span class="paid-badge ${e.paid ? 'paid-yes' : 'paid-no'}">${e.paid ? '✓ Paid' : 'Unpaid'}</span></td><td class="notes-cell">${e.notes || '—'}</td><td><button class="btn-icon edit-income-btn" data-income-id="${e.id}">✏️</button></td></tr>`).join('')}</tbody></table>`}
  `
}

// ADMIN STATS RENDER
function renderAdminStats(): string {
  const s = calcStats()
  return `
    <div class="stats-grid"><div class="stat-card"><div class="stat-card-title">Total Clients</div><div class="stat-big-num">${s.total}</div></div><div class="stat-card"><div class="stat-card-title">Done</div><div class="stat-big-num done">${s.byStatus.Done}</div></div><div class="stat-card"><div class="stat-card-title">In Progress</div><div class="stat-big-num active">${s.byStatus['In Progress']}</div></div><div class="stat-card"><div class="stat-card-title">Total Income</div><div class="stat-big-num income">${formatTHB(s.totalIncome)}</div></div></div>
    <div class="stats-panels">
      <div class="stats-panel"><h3>By Game</h3>${Object.entries(s.byGame).map(([g, c]) => `<div class="stat-game-row"><div class="stat-game-label">${GAMES[g as Game].emoji} ${g}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${s.total ? Math.round(c / s.total * 100) : 0}%; background-color: ${GAMES[g as Game].accent};"></div></div><div class="stat-count">${c}</div></div>`).join('')}</div>
      <div class="stats-panel"><h3>By Status</h3>${STATUS_OPTIONS.map(st => { const c = s.byStatus[st]; const colors: Record<Status, string> = { Pending: '#FFB74D', 'In Progress': '#4FC3F7', Done: '#4CAF50', 'On Hold': '#9E9E9E' }; return `<div class="stat-game-row"><div class="stat-game-label">${st}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${s.total ? Math.round(c / s.total * 100) : 0}%; background-color: ${colors[st]};"></div></div><div class="stat-count">${c}</div></div>` }).join('')}</div>
    </div>
  `
}

// LOAD PUBLIC QUEUE
async function loadPublicQueue() {
  if (publicLoading || publicClients.length > 0) return
  publicLoading = true; publicError = undefined
  try {
    const config = loadGistConfig()
    if (!config?.gistId) throw new Error('Queue not published yet')
    const queueData = await fetchPublicQueue(config.gistId)
    publicClients = queueData.clients
    publicLoading = false
  } catch (err) {
    publicError = err instanceof Error ? err.message : 'Failed to load queue'
    publicLoading = false
  }
}

// EVENT LISTENERS
function attachEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).getAttribute('data-tab')
      if (tab) { adminTab = tab as any; router() }
    })
  })

  // Filters
  document.querySelectorAll('[data-filter-game]').forEach(btn => {
    btn.addEventListener('click', (e) => { filterGame = (e.target as HTMLElement).getAttribute('data-filter-game') as any; router() })
  })
  document.querySelectorAll('[data-filter-status]').forEach(btn => {
    btn.addEventListener('click', (e) => { filterStatus = (e.target as HTMLElement).getAttribute('data-filter-status') as any; router() })
  })

  // Search
  document.getElementById('searchClients')?.addEventListener('input', (e) => { searchQuery = (e.target as HTMLInputElement).value; router() })
  document.getElementById('lookupSearch')?.addEventListener('input', (e) => { publicSearchQuery = (e.target as HTMLInputElement).value; router() })

  // Admin buttons
  document.getElementById('addClientBtn')?.addEventListener('click', () => showClientModal())
  document.querySelectorAll('.edit-client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).getAttribute('data-client-id')
      const client = state.clients.find(c => c.id === id)
      if (client) showClientModal(client)
    })
  })

  // Publish queue
  document.getElementById('publishQueueBtn')?.addEventListener('click', async () => {
    const mod = document.createElement('div')
    const pc = state.clients.filter(c => c.status !== 'On Hold').length
    mod.innerHTML = renderPublishModal(state.clients.length, pc)
    document.getElementById('app')!.appendChild(mod)
    document.getElementById('confirmPublishBtn')?.addEventListener('click', async () => {
      try {
        const config = loadGistConfig()
        if (!config?.token) throw new Error('GitHub token not configured')
        await syncClientsToGist(state.clients.filter(c => c.status !== 'On Hold'), gistEmail)
        alert('✓ Queue published successfully!')
        mod.remove()
      } catch (err) {
        alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'))
      }
    })
    document.getElementById('cancelPublishBtn')?.addEventListener('click', () => mod.remove())
  })

  // GitHub Setup
  document.getElementById('testTokenBtn')?.addEventListener('click', async () => {
    const token = (document.getElementById('githubToken') as HTMLInputElement)?.value.trim()
    if (!token) { alert('Enter GitHub token'); return }
    const status = document.getElementById('setupStatus')!
    status.style.display = 'block'; status.textContent = '⏳ Testing...'
    try {
      const user = await testGistAuth(token)
      saveGistConfig({ token })
      gistUsername = user.username; gistEmail = user.email
      status.textContent = `✓ Auth OK: @${user.username}`
      status.style.background = '#4CAF5020'; status.style.color = '#4CAF50'
      setTimeout(() => navigate('admin-dashboard'), 1000)
    } catch (err) {
      status.textContent = `✗ ${err instanceof Error ? err.message : 'Failed'}`
      status.style.background = '#EF535020'; status.style.color = '#EF5350'
    }
  })

  // Skip Setup
  document.getElementById('skipSetupBtn')?.addEventListener('click', () => {
    saveGistConfig({ token: '' })  // Save empty config to allow dashboard access
    navigate('admin-dashboard')
  })

  // Navigation
  document.getElementById('navPublicBtn')?.addEventListener('click', () => navigate('public-home'))
}

// CLIENT MODAL
function showClientModal(client?: Client) {
  const c: Client = client || { id: uid(), name: '', contact: '', game: 'WuWa', startDate: '', deadline: '', package: '', status: 'Pending', progress: 0, tasks: { daily: false, weekly: false, monthly: false, story: false, special: false, endgame: false }, notes: '', createdAt: Date.now() }
  const div = document.createElement('div')
  div.innerHTML = `
    <div class="modal-overlay" id="clientModal">
      <div class="modal"><div class="modal-header"><h2>${client ? '✏️ Edit Client' : '➕ New Client'}</h2><button class="modal-close" id="closeClientModal">✕</button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Client Name *</label><input type="text" id="f_name" value="${c.name}" placeholder="e.g. Client001"></div>
          <div class="form-group"><label>Contact</label><input type="text" id="f_contact" value="${c.contact}" placeholder="@discord"></div>
          <div class="form-group"><label>Game *</label><select id="f_game">${(['WuWa', 'HSR', 'ZZZ', 'Endfield'] as Game[]).map(g => `<option value="${g}" ${c.game === g ? 'selected' : ''}>${GAMES[g].emoji} ${g}</option>`).join('')}</select></div>
          <div class="form-group"><label>Status</label><select id="f_status">${STATUS_OPTIONS.map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="form-group"><label>Start Date</label><input type="date" id="f_startDate" value="${c.startDate}"></div>
          <div class="form-group"><label>Deadline</label><input type="date" id="f_deadline" value="${c.deadline}"></div>
          <div class="form-group"><label>Package</label><input type="text" id="f_package" value="${c.package}" placeholder="e.g. Full Clear"></div>
          <div class="form-group"><label>Progress %</label><div style="display: flex; align-items: center; gap: 0.6rem;"><input type="range" id="f_progress" class="range-input" min="0" max="100" value="${c.progress}" style="--pct: ${c.progress}%;"><span id="progressValue" style="font-weight: 700; min-width: 3rem;">${c.progress}</span></div></div>
          <div class="form-group full"><label>Tasks</label><div class="task-checks">${Object.keys(c.tasks).map(k => `<label class="check-label"><input type="checkbox" name="task_${k}" ${(c.tasks as any)[k] ? 'checked' : ''}>${TASK_LABELS[k]}</label>`).join('')}</div></div>
          <div class="form-group full"><label>Notes</label><textarea id="f_notes" placeholder="Notes..." style="height: 80px;">${c.notes}</textarea></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-ghost" id="closeClientModalBtn">Cancel</button><button class="btn btn-primary" id="saveClientBtn">Save</button></div></div>
    </div>
  `
  document.getElementById('app')!.appendChild(div)
  const prg = document.getElementById('f_progress') as HTMLInputElement
  if (prg) prg.addEventListener('input', () => { (prg as any).style.setProperty('--pct', prg.value + '%'); (document.getElementById('progressValue') as any).textContent = prg.value })
  document.getElementById('closeClientModalBtn')?.addEventListener('click', () => div.remove())
  document.getElementById('saveClientBtn')?.addEventListener('click', () => {
    const name = (document.getElementById('f_name') as HTMLInputElement)?.value.trim()
    if (!name) { alert('Name required'); return }
    const updated: Client = {
      id: client?.id || uid(),
      name,
      contact: (document.getElementById('f_contact') as HTMLInputElement)?.value,
      game: (document.getElementById('f_game') as HTMLSelectElement)?.value as Game,
      status: (document.getElementById('f_status') as HTMLSelectElement)?.value as Status,
      startDate: (document.getElementById('f_startDate') as HTMLInputElement)?.value,
      deadline: (document.getElementById('f_deadline') as HTMLInputElement)?.value,
      package: (document.getElementById('f_package') as HTMLInputElement)?.value,
      progress: parseInt((document.getElementById('f_progress') as HTMLInputElement)?.value || '0'),
      tasks: {
        daily: (document.querySelector('[name="task_daily"]') as HTMLInputElement)?.checked || false,
        weekly: (document.querySelector('[name="task_weekly"]') as HTMLInputElement)?.checked || false,
        monthly: (document.querySelector('[name="task_monthly"]') as HTMLInputElement)?.checked || false,
        story: (document.querySelector('[name="task_story"]') as HTMLInputElement)?.checked || false,
        special: (document.querySelector('[name="task_special"]') as HTMLInputElement)?.checked || false,
        endgame: (document.querySelector('[name="task_endgame"]') as HTMLInputElement)?.checked || false,
      },
      notes: (document.getElementById('f_notes') as HTMLTextAreaElement)?.value,
      createdAt: client?.createdAt || Date.now(),
    }
    if (client) {
      state.clients = state.clients.map(c => c.id === updated.id ? updated : c)
    } else {
      state.clients.push(updated)
    }
    saveState(state); div.remove(); router()
  })
}

// INIT
window.addEventListener('hashchange', router)
router()
router()
