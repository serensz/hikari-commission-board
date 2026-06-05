// ── Router ─────────────────────────────────────────────────────────
// Simple URL-based router for admin/public pages
export function parseURL() {
    const hash = window.location.hash.slice(1) || 'public-home';
    const [page, ...paramParts] = hash.split('/');
    const params = {};
    for (let i = 0; i < paramParts.length; i += 2) {
        if (paramParts[i])
            params[paramParts[i]] = paramParts[i + 1] || '';
    }
    return {
        page: page || 'public-home',
        params
    };
}
export function navigate(page, params) {
    let hash = page;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            hash += `/${k}/${v}`;
        });
    }
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}
export function linkTo(page, params) {
    let hash = '#' + page;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            hash += `/${k}/${v}`;
        });
    }
    return hash;
}
