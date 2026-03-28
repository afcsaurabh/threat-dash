/**
 * API client — single entry point for all backend calls.
 *
 * Local dev  (VITE_DEMO_MODE=false): hits FastAPI at /api/*
 * GitHub Pages (VITE_DEMO_MODE=true): returns fixture data, no backend needed
 */

import { getFixture } from './fixtures'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

async function request(path, options = {}) {
  if (DEMO) {
    // Simulate minimal async latency so loading states are visible in demo
    await new Promise((r) => setTimeout(r, 180))
    return getFixture(path)
  }

  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Health
  health: () => request('/api/health'),

  // API key management (local dev only — no-op in demo mode)
  getKeys: () => request('/api/keys'),
  setKeys: (keys) =>
    request('/api/keys', { method: 'POST', body: JSON.stringify(keys) }),

  // Phase 1 — Enrichment
  enrich: (iocs) =>
    request('/api/enrich', { method: 'POST', body: JSON.stringify({ iocs }) }),
  getHistory: () => request('/api/enrich/history'),
  getIocHistory: (ioc) => request(`/api/enrich/history/${encodeURIComponent(ioc)}`),
  tagIoc: (ioc, tag) =>
    request(`/api/enrich/${encodeURIComponent(ioc)}/tag`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    }),

  // Phase 2 — Feeds
  getFeeds: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null))
    return request(`/api/feeds${qs.toString() ? '?' + qs : ''}`)
  },
  refreshFeeds: () => request('/api/feeds/refresh', { method: 'POST' }),
  getFeedStats: () => request('/api/feeds/stats'),

  // News Intelligence
  getNews: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null))
    return request(`/api/news${qs.toString() ? '?' + qs : ''}`)
  },
  refreshNews: () => request('/api/news/refresh', { method: 'POST' }),
  getNewsStats: () => request('/api/news/stats'),

  // Phase 3 — Actors
  getActors: () => request('/api/actors'),
  getActor: (id) => request(`/api/actors/${id}`),
  getNavigator: (id) => request(`/api/actors/${id}/navigator`),
  saveNotes: (id, notes) =>
    request(`/api/actors/${id}/notes`, { method: 'POST', body: JSON.stringify({ notes }) }),

  // Phase 4 — Reports
  createReport: (body) =>
    request('/api/reports', { method: 'POST', body: JSON.stringify(body) }),
  getReports: () => request('/api/reports'),
  getReport: (id) => request(`/api/reports/${id}`),
  updateReport: (id, body) =>
    request(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  exportReport: (id) => request(`/api/reports/${id}/export`),
  generateSummary: (id) => request(`/api/reports/${id}/generate`, { method: 'POST' }),
}
