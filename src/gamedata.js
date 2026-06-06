export const GAMES = {
    WuWa: {
        label: 'Wuthering Waves',
        emoji: '🌊',
        logo: '/wuwa.png', // Put wuwa.png in your public folder
        accent: '#4FC3F7',
        accentDark: '#0288D1',
        tasks: { special: 'Map Clear (%)', endgame: 'Tower / Depths' }
    },
    HSR: {
        label: 'Honkai: Star Rail',
        emoji: '🚂',
        logo: '/hsr.png', // Put hsr.png in your public folder
        accent: '#CE93D8',
        accentDark: '#9C27B0',
        tasks: { special: 'SU / Currency Wars', endgame: 'MoC / AS / PF' }
    },
    ZZZ: {
        label: 'Zenless Zone Zero',
        emoji: '⚡',
        logo: '/zzz.png', // Put zzz.png in your public folder
        accent: '#80CBC4',
        accentDark: '#00897B',
        tasks: { special: 'Hollow Zero', endgame: 'Shiyu / DA' }
    },
    Endfield: {
        label: 'Arknights: Endfield',
        emoji: '🏭',
        logo: '/endfield.png', // Put endfield.png in your public folder
        accent: '#FFB74D',
        accentDark: '#F57C00',
        tasks: { special: 'Map Clear / Factory', endgame: 'Etchspace / UM / CC' }
    }
};
export const TASK_LABELS = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    story: 'Story / Events',
    special: 'Special',
    endgame: 'Endgame',
};
export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Done', 'On Hold'];
