import type { Game, Status, Client, IncomeEntry } from './types'

// ── UI State ──────────────────────────────────────────────────────
export interface UIState {
  mode: 'admin' | 'public'
  isAuthenticated: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  syncError?: string
}

// ── Admin UI State ─────────────────────────────────────────────────
export interface AdminUIState {
  selectedTab: 'clients' | 'income' | 'stats' | 'settings'
  filterGame: Game | 'All'
  filterStatus: Status | 'All'
  searchQuery: string
  editingClient: Client | null
  editingIncome: IncomeEntry | null
  showPublishModal: boolean
  gistUsername?: string
  gistEmail?: string
}

// ── Public UI State ────────────────────────────────────────────────
export interface PublicUIState {
  page: 'home' | 'lookup' | 'queue'
  searchQuery: string
  selectedClient: Client | null
  filteredClients: Client[]
  queueStatus: 'loading' | 'loaded' | 'error'
  queueError?: string
}
