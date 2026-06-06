import type { Client } from './types'
import { GAMES } from './gamedata'

export function renderPublicHome(): string {
  return `
  <div class="landing-page">
    <div class="landing-hero">
      <img src="/banner.png" alt="Hikari's Commission Board" class="landing-banner" onerror="this.style.display='none'">
      <h1 class="landing-title">✨ Hikari's Commission Board</h1>
      <p class="landing-subtitle">Professional Boosting & Maintenance Services</p>
      
      <div class="landing-buttons">
        <a href="#public-lookup" class="btn btn-primary btn-lg">🔍 Track My Order</a>
        <a href="#public-info" class="btn btn-primary btn-lg" style="background: var(--bg3); color: var(--text1); border: 1px solid var(--border);">📜 Info & Services</a>
        <a href="#public-queue" class="btn btn-ghost btn-lg">📋 View Live Queue</a>
      </div>
    </div>

    <div class="landing-games-section">
      <h2>Supported Games</h2>
      <div class="landing-games-grid">
        ${(['WuWa', 'HSR', 'ZZZ', 'Endfield'] as const).map(g => `
          <div class="landing-game-card" style="border-bottom: 4px solid ${GAMES[g].accent}">
            <!-- Game Character Thumbnail (e.g., char-wuwa.png, char-hsr.png) -->
            <img src="/char-${g.toLowerCase()}.png" alt="${g} character" class="landing-char-img" onerror="this.style.display='none'">
            
            <div class="landing-game-content">
              <div class="landing-game-brand">
                <img src="${GAMES[g].logo}" alt="logo" class="landing-logo-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span class="game-emoji fallback-emoji" style="display: none;">${GAMES[g].emoji}</span>
                <h3>${GAMES[g].label}</h3>
              </div>
              <p class="landing-game-tasks">${GAMES[g].tasks.special} • ${GAMES[g].tasks.endgame}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  `
}

export function renderPublicLookup(clients: Client[], selectedClient: Client | null, searchQuery: string, isLoading: boolean): string {
  return `
  <div class="public-page">
    <div class="lookup-header">
      <h1>🔍 Lookup Your Order</h1>
      <p>Search by name, contact, or order ID</p>
    </div>

    <div class="search-wrap lookup-search">
      <input type="text" id="lookupSearch" class="search-input" placeholder="Search by name, Discord, or ID..." value="${searchQuery}">
    </div>

    ${isLoading ? `<div class="loading-state"><p>Loading queue...</p></div>` : 
      selectedClient ? `
      <div class="lookup-result">${renderClientDetailCard(selectedClient)}</div>
      <a href="#public-lookup" class="btn btn-ghost" style="margin-top: 1rem;">← Back to Search</a>
    ` : `
      <div class="lookup-results">
        <h2 id="searchCountHeader">Search Results (${clients.length})</h2>
        <div class="lookup-list" id="publicLookupList">
          ${clients.map(c => `
            <div class="lookup-item" data-search-text="${c.name.toLowerCase()} ${c.contact.toLowerCase()} ${c.id.toLowerCase()}" onclick="window.lookupSelectClient('${c.id}')">
              <div class="lookup-item-left">
                <img src="${GAMES[c.game].logo}" alt="${c.game}" class="game-logo-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span class="game-emoji fallback-emoji" style="display: none;">${GAMES[c.game].emoji}</span>
                <div>
                  <div class="lookup-item-name">${c.name}</div>
                  <div class="lookup-item-contact">${c.contact || 'No contact'}</div>
                </div>
              </div>
              <div class="lookup-item-right">
                <div class="lookup-item-status"><span class="status-badge ${statusClass(c.status)}">${c.status}</span></div>
                <div class="lookup-item-progress">${c.progress}%</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `}
  </div>
  `
}

export function renderPublicQueue(clients: Client[], isLoading: boolean, error?: string): string {
  const sortedClients = [...clients].sort((a, b) => {
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return `
  <div class="public-page">
    <div class="queue-header">
      <h1>📋 Boosting Queue</h1>
      <p>Current orders sorted by deadline</p>
    </div>

    ${error ? `<div class="error-state"><p>⚠️ Unable to load queue: ${error}</p></div>` : 
      isLoading ? `<div class="loading-state"><p>Loading queue...</p></div>` : `
      <div class="queue-stats">
        <div class="queue-stat-chip"><span class="stat-label">Total Active:</span><span class="stat-value">${sortedClients.length}</span></div>
        ${['Pending', 'In Progress', 'Done'].map(s => {
          const count = sortedClients.filter(c => c.status === s).length
          return `<div class="queue-stat-chip"><span class="stat-label">${s}:</span><span class="stat-value">${count}</span></div>`
        }).join('')}
      </div>

      <div class="queue-list">
        ${sortedClients.length === 0 ? `<div class="empty-state"><div class="empty-icon">✨</div><p>No active orders at the moment</p></div>` : 
          sortedClients.map(c => `
          <div class="queue-card" onclick="window.queueSelectClient('${c.id}')">
            <div class="queue-card-header">
              <div class="queue-game">
                <img src="${GAMES[c.game].logo}" alt="${c.game}" class="game-logo-sm" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span class="game-emoji fallback-emoji" style="display: none;">${GAMES[c.game].emoji}</span>
                <span class="game-name">${c.game}</span>
              </div>
              <span class="status-badge ${statusClass(c.status)}">${c.status}</span>
            </div>

            <div class="queue-card-body">
              <div class="queue-row"><span class="queue-label">Client:</span><span class="queue-value">${c.name}</span></div>
              <div class="queue-row">
                <span class="queue-label">Progress:</span>
                <div class="progress-row" style="flex: 1;">
                  <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${c.progress}%; background-color: ${progressColor(c.progress)}"></div></div>
                  <span class="progress-pct">${c.progress}%</span>
                </div>
              </div>
              <div class="queue-row"><span class="queue-label">Deadline:</span><span class="queue-value ${getDeadlineClass(c.deadline)}">${formatDate(c.deadline)}</span></div>
            </div>
            <div class="queue-card-footer">
              <div class="task-dots">${renderTaskDots(c.tasks)}</div>
              <span class="queue-click-hint">Click for details →</span>
            </div>
          </div>
        `).join('')}
      </div>
    `}

    <div class="queue-footer">
      <p class="queue-updated">Last updated: <span id="queueLastUpdated">—</span></p>
      <a href="#public-home" class="btn btn-ghost">← Back Home</a>
    </div>
  </div>
  `
}

function renderClientDetailCard(client: Client): string {
  return `
  <div class="client-detail">
    <div class="detail-header">
      <div class="detail-game">
        <img src="${GAMES[client.game].logo}" alt="${client.game}" class="game-logo-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
        <span class="game-emoji large fallback-emoji" style="display: none;">${GAMES[client.game].emoji}</span>
        <div>
          <div class="detail-game-label">${GAMES[client.game].label}</div>
          <div class="detail-status"><span class="status-badge ${statusClass(client.status)}">${client.status}</span></div>
        </div>
      </div>
      <div class="detail-progress">
        <div class="progress-text">Progress</div>
        <div class="progress-large">${client.progress}%</div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${client.progress}%; background-color: ${progressColor(client.progress)}"></div></div>
      </div>
    </div>
    <div class="detail-section">
      <h3>Order Details</h3>
      <div class="detail-row"><span class="detail-label">Order ID:</span><span class="detail-value">${client.id}</span></div>
      <div class="detail-row"><span class="detail-label">Client Name:</span><span class="detail-value">${client.name}</span></div>
      <div class="detail-row"><span class="detail-label">Contact:</span><span class="detail-value">${client.contact || 'N/A'}</span></div>
      <div class="detail-row"><span class="detail-label">Package:</span><span class="detail-value">${client.package || 'Standard'}</span></div>
    </div>
    <div class="detail-section">
      <h3>Timeline</h3>
      <div class="detail-row"><span class="detail-label">Started:</span><span class="detail-value">${formatDate(client.startDate)}</span></div>
      <div class="detail-row"><span class="detail-label">Deadline:</span><span class="detail-value ${getDeadlineClass(client.deadline)}">${formatDate(client.deadline)}</span></div>
      <div class="detail-row"><span class="detail-label">Days Left:</span><span class="detail-value">${daysLeftValue(client.deadline)}</span></div>
    </div>
    <div class="detail-section">
      <h3>Task Status</h3>
      <div class="tasks-grid">
        ${Object.entries(client.tasks).map(([k, v]) => `
          <div class="task-item"><span class="task-check ${v ? 'checked' : 'unchecked'}">${v ? '✓' : '○'}</span><span>${k.charAt(0).toUpperCase() + k.slice(1)}</span></div>
        `).join('')}
      </div>
    </div>
    ${client.notes ? `<div class="detail-section"><h3>Notes</h3><div class="detail-notes">${escapeHtml(client.notes)}</div></div>` : ''}
  </div>
  `
}

// ... Keep existing helper functions (renderTaskDots, statusClass, progressColor, formatDate, daysLeftValue, getDeadlineClass, escapeHtml) exactly the same ...
function renderTaskDots(tasks: Record<string, any>): string { return Object.entries(tasks).map(([_, v]) => `<span class="task-dot ${v ? 'dot-on' : 'dot-off'}">${v ? '●' : '○'}</span>`).join('') }
function statusClass(s: string): string { return { 'Pending': 'status-pending', 'In Progress': 'status-inprog', 'Done': 'status-done', 'On Hold': 'status-hold' }[s] || '' }
function progressColor(p: number): string { if (p >= 100) return '#4CAF50'; if (p >= 60) return '#4FC3F7'; if (p >= 30) return '#FFB74D'; return '#EF5350' }
function formatDate(d: string): string { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function daysLeftValue(deadline: string): string { if (!deadline) return '—'; const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000); if (diff < 0) return `${Math.abs(diff)}d overdue`; if (diff === 0) return 'Due today'; return `${diff}d left` }
function getDeadlineClass(deadline: string): string { if (!deadline) return ''; const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000); if (diff < 0) return 'overdue'; if (diff === 0) return 'due-today'; if (diff <= 3) return 'due-soon'; return 'due-ok' }
function escapeHtml(text: string): string { const div = document.createElement('div'); div.textContent = text; return div.innerHTML }

export function renderPublicInfo(): string {
  return `
  <div class="public-page">
    <div class="info-header" style="text-align: center; margin-bottom: 3rem;">
      <h1 class="landing-title" style="font-size: 2.2rem;">🎮 Commission Services</h1>
      <p style="color: var(--text2); max-width: 600px; margin: 0 auto 1rem; line-height: 1.6;">
        Fast, reliable, and played live on stream upon request.<br>
        <strong style="color: var(--accent-red);">Note:</strong> No Currency farming.
      </p>
    </div>

    <div class="services-grid">
      <!-- Wuthering Waves -->
      <div class="service-card" style="border-top: 4px solid ${GAMES['WuWa'].accent}">
        <div class="service-card-header">
          <img src="${GAMES['WuWa'].logo}" class="game-logo-lg" onerror="this.style.display='none'">
          <h2>Wuthering Waves</h2>
        </div>
        <ul class="service-list">
          <li>Daily / Weekly / Monthly commissions</li>
          <li>Map exploration <span class="sub-text">(% based, story quests priced separately)</span></li>
          <li>Events & main story progression</li>
          <li>Endgame content (ToA / WhiWa) <span class="sub-text">— best effort, live if requested</span></li>
        </ul>
      </div>

      <!-- Honkai: Star Rail -->
      <div class="service-card" style="border-top: 4px solid ${GAMES['HSR'].accent}">
        <div class="service-card-header">
          <img src="${GAMES['HSR'].logo}" class="game-logo-lg" onerror="this.style.display='none'">
          <h2>Honkai: Star Rail</h2>
        </div>
        <ul class="service-list">
          <li>Daily / Monthly tasks</li>
          <li>Chest farming & map clearing</li>
          <li>Events & main story progression</li>
          <li>Simulated Universe / Currency Wars <span class="sub-text">— full 100% collection</span></li>
          <li>MOC / PF / AS / AA <span class="sub-text">— best effort, live if requested</span></li>
        </ul>
      </div>

      <!-- Zenless Zone Zero -->
      <div class="service-card" style="border-top: 4px solid ${GAMES['ZZZ'].accent}">
        <div class="service-card-header">
          <img src="${GAMES['ZZZ'].logo}" class="game-logo-lg" onerror="this.style.display='none'">
          <h2>Zenless Zone Zero</h2>
        </div>
        <ul class="service-list">
          <li>Daily / Weekly / Monthly tasks</li>
          <li>Events & main story progression</li>
          <li>Hollow Zero & other permanent modes</li>
          <li>Shiyu Defense / Deadly Assault <span class="sub-text">— best effort, Top 1% leaderboard exp.</span></li>
        </ul>
      </div>

      <!-- Arknights: Endfield -->
      <div class="service-card" style="border-top: 4px solid ${GAMES['Endfield'].accent}">
        <div class="service-card-header">
          <img src="${GAMES['Endfield'].logo}" class="game-logo-lg" onerror="this.style.display='none'">
          <h2>Arknights: Endfield</h2>
        </div>
        <ul class="service-list">
          <li>Daily / Weekly / Monthly tasks</li>
          <li>Events & main story progression</li>
          <li>Map exploration <span class="sub-text">(story quests priced separately)</span></li>
          <li>Etchspace clearing</li>
          <li>Factory & Pylon layout optimization <span class="sub-text">— strong Yield output guaranteed</span></li>
          <li>Umbral Monument / Endgame <span class="sub-text">— experienced with all comps, live if requested</span></li>
          <li>CC <span class="sub-text">(coming soon)</span></li>
        </ul>
      </div>
    </div>

    <!-- Other Services & Footer -->
    <div class="other-services-section" style="margin-top: 3rem; background: var(--bg2); padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <h3 style="margin-bottom: 1rem; color: var(--accent-cyan);">🌟 Other Games & Services</h3>
      <ul class="service-list" style="margin-bottom: 1.5rem;">
        <li><strong>Arknights (Main):</strong> Former 100% Collector / multiple seasons of CC High Score clears. Available on a case-by-case basis depending on account state.</li>
        <li><strong>Other Games:</strong> Feel free to ask. Will take requests for games I've played.</li>
      </ul>
      <div style="padding: 1rem; background: rgba(56, 199, 244, 0.1); border-radius: 8px; border-left: 4px solid var(--accent-cyan);">
        <strong>💡 Free consultation</strong> on gameplay & account building available for any game. Just ask!
      </div>
    </div>
  </div>
  `
}