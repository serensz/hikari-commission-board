export type Game = 'WuWa' | 'HSR' | 'ZZZ' | 'Endfield'
export type Status = 'Pending' | 'In Progress' | 'Done' | 'On Hold'

export interface TaskSet {
  daily: boolean
  weekly: boolean
  monthly: boolean
  story: boolean
  special: boolean
  endgame: boolean
}

export interface Client {
  id: string
  name: string
  contact: string
  game: Game
  startDate: string
  deadline: string
  package: string
  status: Status
  progress: number
  tasks: TaskSet
  notes: string
  createdAt: number
}

export interface IncomeEntry {
  id: string
  clientId: string
  clientName: string
  game: Game
  service: string
  amount: number
  paid: boolean
  month: string
  notes: string
}

export interface AppState {
  clients: Client[]
  income: IncomeEntry[]
}
