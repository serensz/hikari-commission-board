import type { Game } from './types'

export interface GameInfo {
  label: string
  emoji: string
  accent: string
  accentDark: string
  tasks: {
    special: string
    endgame: string
  }
}

export const GAMES: Record<Game, GameInfo> = {
  WuWa: {
    label: 'Wuthering Waves',
    emoji: '🌊',
    accent: '#4FC3F7',
    accentDark: '#0288D1',
    tasks: {
      special: 'Map Clear (%)',
      endgame: 'Tower / Depths',
    }
  },
  HSR: {
    label: 'Honkai: Star Rail',
    emoji: '🚂',
    accent: '#CE93D8',
    accentDark: '#9C27B0',
    tasks: {
      special: 'SU / Currency Wars',
      endgame: 'MoC / AS / PF',
    }
  },
  ZZZ: {
    label: 'Zenless Zone Zero',
    emoji: '⚡',
    accent: '#80CBC4',
    accentDark: '#00897B',
    tasks: {
      special: 'Hollow Zero',
      endgame: 'Shiyu / DA',
    }
  },
  Endfield: {
    label: 'Arknights: Endfield',
    emoji: '🏭',
    accent: '#FFB74D',
    accentDark: '#F57C00',
    tasks: {
      special: 'Map Clear / Factory',
      endgame: 'Etchspace / UM / CC',
    }
  }
}

export const TASK_LABELS: Record<string, string> = {
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
  story:   'Story / Events',
  special: 'Special',
  endgame: 'Endgame',
}

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done', 'On Hold'] as const
