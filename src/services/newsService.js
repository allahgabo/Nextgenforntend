// src/services/newsService.js
// Fetches RSS via our own server.js proxy (/api/news/intel, /api/news/who)

// ── Robust RSS parser (handles malformed Google News XML) ─
function extractTag(str, tag) {
  // Handle CDATA, plain text, and self-closing tags
  const re = new RegExp(
    '<' + tag + '[^>]*>' +
    '\\s*(?:<!\\[CDATA\\[)?' +
    '([\\s\\S]*?)' +
    '(?:\\]\\]>)?\\s*' +
    '<\\/' + tag + '>',
    'i'
  );
  const m = re.exec(str);
  if (!m) return '';
  // For <link>, Google RSS puts URL as text node after the tag
  let val = m[1].trim();
  // Remove nested CDATA markers if any remain
  val = val.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  return val;
}

function parseRSSRegex(xml) {
  const items = [];
  const re    = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const title   = stripHtml(extractTag(b, 'title'));
    const url     = extractTag(b, 'link') || extractTag(b, 'guid');
    const summary = stripHtml(extractTag(b, 'description')).slice(0, 220);
    const pubDate = extractTag(b, 'pubDate');
    const source  = stripHtml(extractTag(b, 'source'));
    if (title && title.length > 5) items.push({ title, summary, url, source, pubDate });
  }
  return items;
}

function parseRSS(xmlText) {
  // Always use regex parser — avoids DOMParser namespace/encoding issues with Google News
  const items = parseRSSRegex(xmlText);
  if (items.length) return items;
  // Only try DOMParser as last resort
  try {
    const parser = new DOMParser();
    const xml    = parser.parseFromString(xmlText, 'text/xml');
    if (!xml.querySelector('parsererror')) {
      return Array.from(xml.querySelectorAll('item')).map(item => ({
        title:   item.querySelector('title')?.textContent?.trim() || '',
        summary: stripHtml(item.querySelector('description')?.textContent || '').slice(0, 220),
        url:     item.querySelector('link')?.textContent?.trim() || item.querySelector('guid')?.textContent?.trim() || '',
        source:  item.querySelector('source')?.textContent?.trim() || '',
        pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
      })).filter(i => i.title?.length > 5);
    }
  } catch {}
  return [];
}

function stripHtml(s) {
  if (!s) return '';
  // Step 1: decode HTML entities FIRST (so &lt;a&gt; becomes <a> before stripping)
  s = s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');
  // Step 2: now strip all real HTML tags
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1')
    .replace(/<[^>]+>/g, ' ');
  // Step 3: remove any leftover tag fragments like "a>" or "/>  
  s = s.replace(/[a-z]+>/gi, '').replace(/<[a-z\/]*/gi, '');
  return s.replace(/\s+/g, ' ').trim();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return Math.floor(diff / 60000) + 'm ago';
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

async function fetchXML(path) {
  const res = await fetch(path, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  let text = await res.text();
  // Google prepends legal text before the XML — strip it
  const xmlStart = text.search(/<\?xml|<rss|<feed/i);
  if (xmlStart > 0) text = text.slice(xmlStart);
  return text;
}

// ── Clean Google News redirect URLs ──────────────────────
function cleanUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const r = u.searchParams.get('url') || u.searchParams.get('q');
    return r || url;
  } catch { return url; }
}

const ICONS = ['💊','🏥','🔬','📋','🧬','⚕️','🌍','📊'];

// ── Intel Feed ────────────────────────────────────────────
export async function fetchIntelFeed() {
  try {
    const xml   = await fetchXML('/api/news/intel');
    const items = parseRSS(xml);
    if (!items.length) throw new Error('empty');
    return items.slice(0, 8).map((item, i) => {
      // Google News <description> repeats the title in HTML — skip if same as title
      const cleanSummary = item.summary && item.summary !== item.title && item.summary.length > 10
        ? item.summary : '';
      return {
      icon:    ICONS[i % ICONS.length],
      title:   item.title,
      summary: cleanSummary,
      source:  item.source || extractSource(item.title),
      time:    timeAgo(item.pubDate),
      url:     cleanUrl(item.url),
      impact:  /approv|recall|warning|landmark|breakthrough|critical/i.test(item.title) ? 'HIGH IMPACT' : undefined,
    };
    });
  } catch (e) {
    console.warn('[Intel Feed]', e.message);
    return null;
  }
}

// ── WHO Alerts ────────────────────────────────────────────
export async function fetchWHOAlerts() {
  try {
    const xml   = await fetchXML('/api/news/who');
    const items = parseRSS(xml);
    if (!items.length) throw new Error('empty');
    return items.slice(0, 5).map(item => {
      const type = classifyAlert(item.title);
      return {
        type,
        typeColor: { Alert:'#dc2626', Update:'#d97706', Guidance:'#2563eb' }[type] || '#6366f1',
        title:     item.title,
        summary:   (item.summary && item.summary !== item.title && item.summary.length > 10) ? item.summary : '',
        tags:      extractTags(item.title + ' ' + item.summary),
        url:       cleanUrl(item.url) || 'https://www.who.int/news',
        time:      timeAgo(item.pubDate),
      };
    });
  } catch (e) {
    console.warn('[WHO Alerts]', e.message);
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────
function classifyAlert(title) {
  if (/outbreak|emergency|epidemic|pandemic|alert|warning|surge/i.test(title)) return 'Alert';
  if (/guideline|recommendation|policy|statement|guidance/i.test(title))       return 'Guidance';
  return 'Update';
}

function extractSource(title) {
  const known = ['FDA','WHO','CDC','SFDA','EMA','NIH','Reuters','Bloomberg','AP','BBC','RAPS'];
  return known.find(k => title.includes(k)) || 'Health News';
}

function extractTags(text) {
  return ['Saudi Arabia','UAE','United States','China','India','United Kingdom','France',
    'Germany','Japan','Brazil','Vietnam','Thailand','Nigeria','Egypt','Turkey',
    'Iran','Australia','Canada','Mexico','South Africa'].filter(c => text.includes(c)).slice(0, 3);
}
