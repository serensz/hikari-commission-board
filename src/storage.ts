import type { AppState, Client } from './types'
import { updateGist, createGist, loadGistConfig, saveGistConfig } from './gist'
import type { PublicQueueData } from './gist'

const KEY = 'gameboost_tracker_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {}
  return { clients: [], income: [] }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function exportJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gameboost_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const state = JSON.parse(e.target!.result as string) as AppState
        resolve(state)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.readAsText(file)
  })
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── Gist Sync Operations ────────────────────────────────────────
export async function syncClientsToGist(clients: Client[], userEmail?: string): Promise<void> {
  const config = loadGistConfig()
  if (!config?.token) throw new Error('GitHub token not configured')

  const queueData: PublicQueueData = {
    clients: clients.filter(c => c.status !== 'On Hold'), // Don't publish on-hold jobs
    lastUpdated: new Date().toISOString(),
    adminEmail: userEmail
  }

  if (config.gistId) {
    await updateGist(config.token, config.gistId, queueData)
  } else {
    const gistId = await createGist(config.token, queueData)
    saveGistConfig({ ...config, gistId })
  }
}
