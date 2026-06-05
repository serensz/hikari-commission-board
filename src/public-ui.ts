import type { Client } from './types'
import { GAMES } from './gamedata'

export function renderPublicHome(): string {
  return `
  <div class="public-page">
    <div class="public-hero">
      <h1>🎮 GameBoost Tracker</h1>
      <p>Track your game boosting queue in real-time</p>
    </div>
    
    <div class="public-nav">
      <a href="#public-lookup" class="btn btn-primary">
        🔍 Lookup Your Order
      </a>
      <a href="#public-queue" class="btn btn-ghost">
        📋 View Full Queue
      </a>
    </div>

    <div class="info-section">
      <h2>How it works</h2>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-icon">📍</div>
          <h3>Check Status</h3>
          <p>Lookup your order to see current progress, deadline, and tasks completed</p>
        </div>
        <div class="info-card">
          <div class="info-icon">📊</div>
          <h3>View Queue</h3>
          <p>See the full boosting queue sorted by deadline</p>
        </div>
        <div class="info-card">
          <div class="info-icon">🎯</div>
          <h3>Real-time Updates</h3>
          <p>Our admin updates the queue in real-time as work progresses</p>
        </div>
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
      <input 
        type="text" 
        id="lookupSearch" 
        class="search-input" 
        placeholder="Search by name, Discord, or ID..."
        value="${searchQuery}"
      >
    </div>

    ${isLoading ? `
      <div class="loading-state">
        <p>Loading queue...</p>
      </div>
    ` : selectedClient ? `
      <div class="lookup-result">
        ${renderClientDetailCard(selectedClient)}
      </div>
      <a href="#public-lookup" class="btn btn-ghost" style="margin-top: 1rem;">← Back to Search</a>
    ` : searchQuery.length > 0 ? `
      <div class="lookup-results">
        <h2>Search Results (${clients.length})</h2>
        ${clients.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No results found for "${searchQuery}"</p>
          </div>
        ` : `
          <div class="lookup-list">
            ${clients.map(c => `
              <div class="lookup-item" onclick="window.lookupSelectClient('${c.id}')">
                <div class="lookup-item-left">
                  <div class="game-emoji">${GAMES[c.game].emoji}</div>
                  <div>
                    <div class="lookup-item-name">${c.name}</div>
                    <div class="lookup-item-contact">${c.contact || 'No contact'}</div>
                  </div>
                </div>
                <div class="lookup-item-right">
                  <div class="lookup-item-status">
                    <span class="status-badge ${statusClass(c.status)}">${c.status}</span>
                  </div>
                  <div class="lookup-item-progress">${c.progress}%</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Enter a name or contact to search</p>
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

    ${error ? `
      <div class="error-state">
        <p>⚠️ Unable to load queue: ${error}</p>
      </div>
    ` : isLoading ? `
      <div class="loading-state">
        <p>Loading queue...</p>
      </div>
    ` : `
      <div class="queue-stats">
        <div class="queue-stat-chip">
          <span class="stat-label">Total Active:</span>
          <span class="stat-value">${sortedClients.length}</span>
        </div>
        ${['Pending', 'In Progress', 'Done'].map(s => {
          const count = sortedClients.filter(c => c.status === s).length
          return `
            <div class="queue-stat-chip">
              <span class="stat-label">${s}:</span>
              <span class="stat-value">${count}</span>
            </div>
          `
        }).join('')}
      </div>

      <div class="queue-list">
        ${sortedClients.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">✨</div>
            <p>No active orders at the moment</p>
          </div>
        ` : sortedClients.map(c => `
          <div class="queue-card" onclick="window.queueSelectClient('${c.id}')">
            <div class="queue-card-header">
              <div class="queue-game">
                <span class="game-emoji">${GAMES[c.game].emoji}</span>
                <span class="game-name">${c.game}</span>
              </div>
              <span class="status-badge ${statusClass(c.status)}">${c.status}</span>
            </div>

            <div class="queue-card-body">
              <div class="queue-row">
                <span class="queue-label">Client:</span>
                <span class="queue-value">${c.name}</span>
              </div>
              <div class="queue-row">
                <span class="queue-label">Progress:</span>
                <div class="progress-row" style="flex: 1;">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${c.progress}%; background-color: ${progressColor(c.progress)}"></div>
                  </div>
                  <span class="progress-pct">${c.progress}%</span>
                </div>
              </div>
              <div class="queue-row">
                <span class="queue-label">Deadline:</span>
                <span class="queue-value ${getDeadlineClass(c.deadline)}">${formatDate(c.deadline)}</span>
              </div>
            </div>

            <div class="queue-card-footer">
              <div class="task-dots">
                ${renderTaskDots(c.tasks)}
              </div>
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
        <span class="game-emoji large">${GAMES[client.game].emoji}</span>
        <div>
          <div class="detail-game-label">${GAMES[client.game].label}</div>
          <div class="detail-status">
            <span class="status-badge ${statusClass(client.status)}">${client.status}</span>
          </div>
        </div>
      </div>
      <div class="detail-progress">
        <div class="progress-text">Progress</div>
        <div class="progress-large">${client.progress}%</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${client.progress}%; background-color: ${progressColor(client.progress)}"></div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Order Details</h3>
      <div class="detail-row">
        <span class="detail-label">Order ID:</span>
        <span class="detail-value">${client.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client Name:</span>
        <span class="detail-value">${client.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Contact:</span>
        <span class="detail-value">${client.contact || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Package:</span>
        <span class="detail-value">${client.package || 'Standard'}</span>
      </div>
    </div>

    <div class="detail-section">
      <h3>Timeline</h3>
      <div class="detail-row">
        <span class="detail-label">Started:</span>
        <span class="detail-value">${formatDate(client.startDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Deadline:</span>
        <span class="detail-value ${getDeadlineClass(client.deadline)}">${formatDate(client.deadline)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Days Left:</span>
        <span class="detail-value">${daysLeftValue(client.deadline)}</span>
      </div>
    </div>

    <div class="detail-section">
      <h3>Task Status</h3>
      <div class="tasks-grid">
        ${Object.entries(client.tasks).map(([k, v]) => `
          <div class="task-item">
            <span class="task-check ${v ? 'checked' : 'unchecked'}">${v ? '✓' : '○'}</span>
            <span>${k.charAt(0).toUpperCase() + k.slice(1)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${client.notes ? `
      <div class="detail-section">
        <h3>Notes</h3>
        <div class="detail-notes">${escapeHtml(client.notes)}</div>
      </div>
    ` : ''}
  </div>
  `
}

function renderTaskDots(tasks: Record<string, any>): string {
  return Object.entries(tasks)
    .map(([_, v]) => `<span class="task-dot ${v ? 'dot-on' : 'dot-off'}">${v ? '●' : '○'}</span>`)
    .join('')
}

function statusClass(s: string): string {
  return {
    'Pending': 'status-pending',
    'In Progress': 'status-inprog',
    'Done': 'status-done',
    'On Hold': 'status-hold'
  }[s] || ''
}

function progressColor(p: number): string {
  if (p >= 100) return '#4CAF50'
  if (p >= 60) return '#4FC3F7'
  if (p >= 30) return '#FFB74D'
  return '#EF5350'
}

function formatDate(d: string): string {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeftValue(deadline: string): string {
  if (!deadline) return '—'
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Due today'
  return `${diff}d left`
}

function getDeadlineClass(deadline: string): string {
  if (!deadline) return ''
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'due-today'
  if (diff <= 3) return 'due-soon'
  return 'due-ok'
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
