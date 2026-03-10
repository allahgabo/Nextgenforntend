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

// Always use /api/briefing — proxied by server.js (prod) and setupProxy.js (dev)
const BRIEFING_URL = '/api/briefing';
const STORE_KEY    = 'sfda_reports';
const TOKEN_KEY    = 'sfda_token';
const USER_KEY     = 'sfda_user';

// ── Speaker photo enrichment ─────────────────────────────────────────────
// API now returns speaker images directly. Fall back to Wikipedia if empty.

async function fetchWikipediaPhoto(name) {
  if (!name) return '';
  try {
    const encoded = encodeURIComponent(name);
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page  = Object.values(pages)[0];
    return page?.thumbnail?.source || '';
  } catch {
    return '';
  }
}

async function enrichSpeakersWithPhotos(speakers) {
  return Promise.all(
    speakers.map(async (s) => {
      if (s.photo_url) return s; // API returned a real photo
      const photo_url = await fetchWikipediaPhoto(s.name);
      return { ...s, photo_url };
    })
  );
}

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

  // Open-Meteo only supports future dates.
  // The Cloud Run backend parses the 'dates' string directly and passes it to Open-Meteo.
  // So we must send a human-readable future date string in the 'dates' field.
  // Real conference dates are preserved separately in the stored report.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function futureMonthDay(offsetDays) {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // e.g. "March 10-13, 2026" — always in the future so Open-Meteo accepts it
  const startD = new Date(today); startD.setDate(startD.getDate() + 2);
  const endD   = new Date(today); endD.setDate(endD.getDate() + 5);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dates  = `${months[startD.getMonth()]} ${startD.getDate()}-${endD.getDate()}, ${startD.getFullYear()}`;

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

  // Try proxy first, then fall back to direct Cloud Run call
  const CLOUD_RUN = 'https://briefing-api-365936249363.me-central1.run.app';
  const fetchOptions = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  };

  let res = await fetch(BRIEFING_URL, fetchOptions);

  // If proxy returns 404 (path not rewritten yet), call Cloud Run directly
  if (res.status === 404) {
    console.warn('[generateAI] proxy 404 — trying Cloud Run directly');
    res = await fetch(CLOUD_RUN + '/briefing', fetchOptions);
  }

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
  // Enrich speakers with Wikipedia photos
  const enrichedSpeakers = await enrichSpeakersWithPhotos(mapped.speakers || []);
  const fullReport  = { ...mapped, id: reportId, speakers: enrichedSpeakers };

  const idx = store.findIndex(r => r.id === reportId);
  if (idx !== -1) store[idx] = fullReport; else store.unshift(fullReport);
  writeStore(store);

  return { data: { report: fullReport } };
};

export const generateBriefing = async (formData) => {
  const { data: draft } = await createReport(formData);
  return generateAI(draft.id);
};

// ── Chat assistant — POST /chat ───────────────────────────────────────────

export const chatAssistant = async (messages, system, briefingReport) => {
  const history = messages.slice(0, -1).map(m => ({
    role:    m.role,
    content: typeof m.content === 'string' ? m.content : String(m.content || ''),
  }));
  const lastMsg = messages[messages.length - 1];
  const message = typeof lastMsg?.content === 'string' ? lastMsg.content : String(lastMsg?.content || '');
  const briefing_context_json = briefingReport ? JSON.stringify(briefingReport) : (system || '');

  const CLOUD_RUN_CHAT = 'https://briefing-api-365936249363.me-central1.run.app';
  // ── Try Cloud Run /chat first ─────────────────────────
  try {
    let res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, briefing_context_json, history }),
    });
    // If proxy returns 404, call Cloud Run directly
    if (res.status === 404) {
      console.warn('[chatAssistant] proxy 404 — trying Cloud Run directly');
      res = await fetch(CLOUD_RUN_CHAT + '/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, briefing_context_json, history }),
      });
    }
    if (res.ok) {
      const data = await res.json();
      let text = typeof data === 'string' ? data : (data?.response || data?.message || data?.content || '');
      text = text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
      if (text) return { data: { content: [{ type: 'text', text }] } };
    }
  } catch (e) {
    console.warn('[chatAssistant] Cloud Run failed:', e.message);
  }

  // ── Fallback: call Anthropic API directly ─────────────
  try {
    const contextSnippet = briefingReport
      ? `You are helping with a briefing report for: ${briefingReport.conference_name || ''} in ${briefingReport.city || ''}, ${briefingReport.country || ''}.`
      : (system || 'You are a helpful diplomatic briefing assistant.');

    const apiMessages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: contextSnippet,
        messages: apiMessages,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      if (text) return { data: { content: [{ type: 'text', text }] } };
    }
  } catch (e) {
    console.warn('[chatAssistant] Anthropic fallback failed:', e.message);
  }

  return {
    data: { content: [{ type: 'text', text: 'تعذّر الاتصال بالمساعد الذكي. يرجى المحاولة لاحقاً.' }] },
  };
};

// ── PDF / Preview ─────────────────────────────────────────────────────────

export const getPDFUrl       = id => '/briefing-api/reports/' + id + '/pdf/';
export const getInlinePDFUrl = id => '/briefing-api/reports/' + id + '/pdf/inline/';
export const getPreviewUrl   = id => '/briefing-api/reports/' + id + '/preview/';

// ── Intelligence feed ─────────────────────────────────────────────────────

export const getIntelFeed = async () => { throw new Error('Not available.'); };
