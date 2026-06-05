// ── Router ─────────────────────────────────────────────────────────
// Simple URL-based router for admin/public pages

export type PageType = 'admin-dashboard' | 'admin-setup' | 'public-home' | 'public-lookup' | 'public-queue'

export interface RouterState {
  page: PageType
  params: Record<string, string>
}

export function parseURL(): RouterState {
  const hash = window.location.hash.slice(1) || 'public-home'
  const [page, ...paramParts] = hash.split('/')
  
  const params: Record<string, string> = {}
  for (let i = 0; i < paramParts.length; i += 2) {
    if (paramParts[i]) params[paramParts[i]] = paramParts[i + 1] || ''
  }
  
  return {
    page: (page as PageType) || 'public-home',
    params
  }
}

export function navigate(page: PageType, params?: Record<string, string>) {
  let hash = page
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      hash += `/${k}/${v}`
    })
  }
  window.location.hash = hash
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function linkTo(page: PageType, params?: Record<string, string>): string {
  let hash = '#' + page
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      hash += `/${k}/${v}`
    })
  }
  return hash
}
