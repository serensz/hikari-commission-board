// 🔥 Add your Gist ID here once you generate it
export const PUBLIC_GIST_ID = import.meta.env.VITE_PUBLIC_GIST_ID || '';
const GIST_FILENAME = 'gameboost_queue.json';
// ── Local Storage for Gist Config ────────────────────────────
const GIST_KEY = 'gameboost_gist_config';
export function loadGistConfig() {
    try {
        const raw = localStorage.getItem(GIST_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function saveGistConfig(config) {
    localStorage.setItem(GIST_KEY, JSON.stringify(config));
}
export function clearGistConfig() {
    localStorage.removeItem(GIST_KEY);
}
// ── GitHub Gist API Operations ──────────────────────────────
export async function createGist(token, data) {
    const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            description: 'GameBoost Tracker Public Queue',
            public: true,
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(data, null, 2)
                }
            }
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Gist');
    }
    const gist = await response.json();
    return gist.id;
}
export async function updateGist(token, gistId, data) {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(data, null, 2)
                }
            }
        })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Gist');
    }
}
export async function fetchPublicQueue(gistId) {
    const response = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch public queue');
    }
    const gistData = await response.json();
    const fileContent = gistData.files[GIST_FILENAME].content;
    return JSON.parse(fileContent);
}
export async function testGistAuth(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (!response.ok) {
        throw new Error('Invalid GitHub token');
    }
    const user = await response.json();
    return {
        username: user.login,
        email: user.email
    };
}
