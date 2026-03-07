/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────
 * Data layer for milken_app.
 *
 * Generation  →  Cloud Run  POST /briefing  (proxied via setupProxy.js)
 * Persistence →  localStorage  (no separate CRUD backend needed)
 * Auth        →  localStorage token  (local session, no server auth)
 */
import { mapBriefingToReport } from './briefingMapper';

const BRIEFING_URL = '/briefing-api/briefing';
const STORE_KEY    = 'sfda_reports';
const TOKEN_KEY    = 'sfda_token';
const USER_KEY     = 'sfda_user';

// ── localStorage store ───────────────────────────────────────────────────

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function writeStore(reports) {
  localStorage.setItem(STORE_KEY, JSON.stringify(reports));
}

// ── Auth helpers ─────────────────────────────────────────────────────────

export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
export const getStoredUser   = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const isAuthenticated = () => !!localStorage.getItem(TOKEN_KEY);

// Local mock auth — accepts any credentials
export const authLogin = async (email, password) => {
  if (!email || !password) throw { response: { status: 400, data: { error: 'Email and password required.' } } };
  const token = 'local_' + btoa(email) + '_' + Date.now();
  return { data: { token, user: { email, name: email.split('@')[0] } } };
};
export const authSignup = async (data) => {
  if (!data.email || !data.password) throw { response: { status: 400, data: { error: 'Email and password required.' } } };
  const token = 'local_' + btoa(data.email) + '_' + Date.now();
  return { data: { token, user: { email: data.email, name: data.name || data.email.split('@')[0] } } };
};
export const authForgot = async () => ({ data: { message: 'Reset instructions sent.' } });
export const authLogout = async () => { clearAuth(); return { data: {} }; };
export const authMe     = async () => ({ data: getStoredUser() });

// ── Reports CRUD (localStorage) ──────────────────────────────────────────

export const getReports = async () => {
  const reports = readStore().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { data: reports };
};

export const getReport = async (id) => {
  const report = readStore().find(r => r.id === id);
  if (!report) throw { response: { status: 404, data: { error: 'Report not found.' } } };
  return { data: report };
};

export const createReport = async (data) => {
  const report = {
    id:         'rpt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    created_at: new Date().toISOString(),
    status:     'draft',
    event_name: data.event_name || data.title || '',
    city:       data.city    || '',
    country:    data.country || '',
    start_date: data.start_date || '',
    end_date:   data.end_date   || '',
    ...data,
  };
  const store = readStore();
  store.unshift(report);
  writeStore(store);
  return { data: report };
};

export const updateReport = async (id, data) => {
  const store = readStore();
  const idx   = store.findIndex(r => r.id === id);
  if (idx === -1) throw { response: { status: 404, data: { error: 'Report not found.' } } };
  store[idx] = { ...store[idx], ...data };
  writeStore(store);
  return { data: store[idx] };
};

export const deleteReport = async (id) => {
  writeStore(readStore().filter(r => r.id !== id));
  return { data: {} };
};

// ── Stats ─────────────────────────────────────────────────────────────────

export const getStats = async () => {
  const reports = readStore();
  return {
    data: {
      total: reports.length,
      ready: reports.filter(r => r.status === 'ready').length,
      draft: reports.filter(r => r.status === 'draft').length,
    }
  };
};

// ── AI Generation — POST /briefing → map → save ───────────────────────────

export const generateAI = async (reportId) => {
  const store = readStore();
  const draft = store.find(r => r.id === reportId);
  if (!draft) throw new Error('Draft report not found.');

  // Open-Meteo (used by Cloud Run for weather) only supports future dates.
  // If the conference dates are in the past, offset them to start tomorrow
  // so the weather tool doesn't crash. Real dates are stored in the report.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function toApiDate(dateStr, fallbackOffsetDays = 1) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d < today) {
      const future = new Date(today);
      future.setDate(future.getDate() + fallbackOffsetDays);
      return future.toISOString().split('T')[0];
    }
    return dateStr;
  }

  const apiStart = toApiDate(draft.start_date, 1);
  const apiEnd   = toApiDate(draft.end_date   || draft.start_date, 4);
  const dates    = apiStart ? (apiEnd && apiEnd !== apiStart ? apiStart + ' to ' + apiEnd : apiStart) : '';

  const payload = {
    conference_name:     draft.event_name          || '',
    dates:               dates,
    city:                draft.city                || '',
    country:             draft.country             || '',
    // conference_url is required by the API — use a Google search fallback if empty
    conference_url:      draft.event_website       || draft.conference_url
                         || `https://www.google.com/search?q=${encodeURIComponent(draft.event_name || '')}`,
    agenda_speakers_url: draft.agenda_speakers_url || '',
    speakers_url:        draft.speakers_url        || '',
    delegate_name:       draft.traveler_name       || draft.delegate_name || 'Delegate',
    delegate_role:       draft.traveler_title      || draft.delegate_role || 'Representative',
    special_focus:       draft.context             || draft.special_focus  || '',
  };

  console.log('[generateAI] payload →', JSON.stringify(payload, null, 2));

  const res = await fetch(BRIEFING_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Briefing API error: ' + res.status;
    try {
      const body = await res.text();
      console.error('[generateAI] API error body:', body);
      const j = JSON.parse(body);
      msg = j.detail || j.error || msg;
    } catch {}
    throw { response: { status: res.status, data: { error: msg } } };
  }

  const rawText = await res.text();
  console.log('[generateAI] raw response (first 500):', rawText.slice(0, 500));
  let apiResponse;
  try { apiResponse = JSON.parse(rawText); }
  catch(e) { throw { response: { status: 500, data: { error: 'Invalid JSON from API: ' + e.message } } }; }
  const mapped      = mapBriefingToReport(apiResponse, { ...draft, ...payload });
  const fullReport  = { ...mapped, id: reportId };

  const idx = store.findIndex(r => r.id === reportId);
  if (idx !== -1) store[idx] = fullReport; else store.unshift(fullReport);
  writeStore(store);

  return { data: { report: fullReport } };
};

export const generateBriefing = async (formData) => {
  const { data: draft } = await createReport(formData);
  return generateAI(draft.id);
};

// ── Chat assistant ────────────────────────────────────────────────────────
// The Cloud Run API only exposes /briefing — no chat endpoint exists.
// We call the Anthropic API directly from the browser instead.

export const chatAssistant = async (messages, system) => {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            process.env.REACT_APP_ANTHROPIC_KEY || '',
        'anthropic-version':    '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     system || '',
        messages:   messages,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || res.status);
    }
    const data = await res.json();
    // Return in same shape AIAssistant expects
    return { data: { content: data.content } };
  } catch (e) {
    console.warn('[chatAssistant] failed:', e.message);
    return {
      data: {
        content: [{
          type: 'text',
          text: 'AI chat is not configured. Add REACT_APP_ANTHROPIC_KEY to your .env file to enable it.',
        }],
      },
    };
  }
};

// ── PDF / Preview ─────────────────────────────────────────────────────────

export const getPDFUrl       = id => '/briefing-api/reports/' + id + '/pdf/';
export const getInlinePDFUrl = id => '/briefing-api/reports/' + id + '/pdf/inline/';
export const getPreviewUrl   = id => '/briefing-api/reports/' + id + '/preview/';

// ── Intelligence feed ─────────────────────────────────────────────────────

export const getIntelFeed = async () => { throw new Error('Not available.'); };
