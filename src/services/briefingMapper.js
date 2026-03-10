/**
 * briefingMapper.js
 * Maps the real Cloud Run POST /briefing response to the shape ReportDetail.jsx expects.
 *
 * Real API response structure:
 * {
 *   conference_research:  { official_name, organiser, organiser_ceo, dates, venue,
 *                           theme_or_slogan, approx_attendees, approx_sessions,
 *                           thematic_tracks[], prior_edition_highlights, raw_notes }
 *   country_logistics:    { head_of_state, government_system, capital, population,
 *                           language, currency, exchange_rate_to_sar, economic_overview,
 *                           political_trade_developments, prayer_times, saudi_embassy_contact }
 *   weather_forecast:     { city, date_range, temperature_range_c, conditions, humidity, summary }
 *   agenda_speakers:      { visit_schedule_markdown, health_sessions_markdown,
 *                           speaker_bios_markdown, top_speakers[] }
 *   talking_points:       { visit_objectives[], bilateral_talking_points, key_messages }
 * }
 */

/** Only use image URLs that are real — filter out API placeholders */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  // Reject placeholder strings the API sometimes returns
  const placeholders = ['[to be confirmed]', 'to be confirmed', 'tbc', 'n/a', 'null', 'none', 'string', '[string]'];
  if (placeholders.includes(trimmed.toLowerCase())) return false;
  // Must start with http/https or be a relative path
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
}

export function mapBriefingToReport(apiResponse, formData) {
  const cr  = apiResponse.conference_research || {};
  const cl  = apiResponse.country_logistics   || {};
  const wf  = apiResponse.weather_forecast    || {};
  const as_ = apiResponse.agenda_speakers     || {};
  const tp  = apiResponse.talking_points      || {};

  // ── Speakers ─────────────────────────────────────────────────────────────
  const speakers = (as_.top_speakers || []).map(s => ({
    name:         s.name             || '',
    title:        s.title            || '',
    organization: s.organization     || '',
    photo_url:    isValidImageUrl(s.image_url) ? s.image_url : '',
    bio:          s.bio_summary      || '',
    relevance:    s.strategic_relevance || '',
    has_linkedin: false,
  }));

  // ── Conference tracks ─────────────────────────────────────────────────────
  const tracks = (cr.thematic_tracks || []).map(t =>
    typeof t === 'string' ? { name: t } : t
  );

  // ── Parse weather ─────────────────────────────────────────────────────────
  // weather_forecast is a single object, not an array — normalize to array
  const weather = wf.city ? [{
    date:      wf.date_range         || '',
    high:      parseTemp(wf.temperature_range_c, 'high'),
    low:       parseTemp(wf.temperature_range_c, 'low'),
    condition: wf.conditions         || '',
    humidity:  wf.humidity           || '',
    wind:      '',
    summary:   wf.summary            || '',
  }] : [];

  // ── Prayer times ──────────────────────────────────────────────────────────
  // prayer_times comes as a string in country_logistics — parse it
  const prayerTimes = parsePrayerTimes(cl.prayer_times || '');

  // ── Embassy ───────────────────────────────────────────────────────────────
  const embassy = parseEmbassy(cl.saudi_embassy_contact || '');

  // ── Visit objectives ──────────────────────────────────────────────────────
  const visitObjectives = Array.isArray(tp.visit_objectives)
    ? tp.visit_objectives
    : (tp.visit_objectives ? [tp.visit_objectives] : []);

  // ── Talking points (SFDA) ─────────────────────────────────────────────────
  const sfdaTalkingPoints = parseToList(tp.bilateral_talking_points)
    .concat(parseToList(tp.key_messages));

  // ── Country info ──────────────────────────────────────────────────────────
  const countryInfo = {
    head_of_state:     cl.head_of_state        || '',
    head_of_state_title: '',
    flag:              countryFlag(formData.country) || '🌍',
    capital:           cl.capital              || '',
    population:        cl.population           || '',
    government:        cl.government_system    || '',
    official_language: cl.language             || '',
    currency:          cl.currency             || '',
    currency_rate:     cl.exchange_rate_to_sar || '',
    overview:          cl.economic_overview    || '',
    area:              '',
    religion:          '',
    timezone:          '',
    gdp:               '',
  };

  // ── Conference data ───────────────────────────────────────────────────────
  const conferenceData = {
    organizer:     cr.organiser       || '',
    organizer_ceo: cr.organiser_ceo   || '',
    theme:         cr.theme_or_slogan || '',
    overview:      cr.overview || '',
    event_leader:  cr.organiser_ceo   || cr.organiser || '',
    logo_url:      '',
    attendees:     cr.approx_attendees || '',
    sessions_count: cr.approx_sessions || '',
  };

  // ── Sessions from markdown ────────────────────────────────────────────────
  const sessions = parseSessionsFromMarkdown(
    as_.visit_schedule_markdown || '',
    as_.health_sessions_markdown || ''
  );

  // ── Agenda from visit_schedule_markdown ───────────────────────────────────
  const agenda = parseAgendaFromMarkdown(as_.visit_schedule_markdown || '');

  // ── ID and dates ──────────────────────────────────────────────────────────
  const id = 'rpt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

  return {
    id,
    created_at:  new Date().toISOString(),
    status:      'ready',

    // Identity
    event_name:    cr.official_name   || formData.conference_name || formData.event_name || '',
    city:          formData.city      || wf.city || '',
    country:       formData.country   || '',
    start_date:    formData.start_date || '',
    end_date:      formData.end_date   || '',
    event_website: formData.conference_url || formData.event_website || '',

    // Nested objects
    country_info:    countryInfo,
    conference_data: conferenceData,
    sessions,

    // Long text sections
    conference_summary:        cr.raw_notes                       || '',
    conference_history:        cr.prior_edition_highlights        || '',
    ksa_participation_history: '',
    sfda_relevance:            cl.political_trade_developments    || '',
    bilateral_relations:       tp.bilateral_talking_points        || '',
    geopolitical_summary:      cl.political_trade_developments    || '',
    entry_requirements:        '',
    leadership_brief:          '',
    trade_exchange:            cl.exchange_rate_to_sar
                                 ? `Exchange rate to SAR: ${cl.exchange_rate_to_sar}` : '',
    executive_summary:         buildExecutiveSummary(cr, cl, tp, formData),

    // Speaker bios markdown preserved
    speaker_bios_markdown: as_.speaker_bios_markdown || '',

    // Arrays
    conference_tracks:   tracks,
    visit_objectives:    visitObjectives,
    delegation:          [],
    agenda,
    speakers,
    participants:        [],
    bilateral_meetings:  [],
    suggested_meetings:  [],
    key_ambassadors:     [],
    weather,
    prayer_times:        prayerTimes,
    previous_outcomes:   [],
    sfda_talking_points: sfdaTalkingPoints,
    embassy,

    _raw: apiResponse,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "15–25" or "15/25" or "15°C – 25°C" into high/low */
function parseTemp(str, which) {
  if (!str) return '';
  const nums = str.match(/\d+/g);
  if (!nums || nums.length < 2) return str;
  return which === 'high' ? nums[1] : nums[0];
}

/** Parse prayer times from a string like "Fajr: 05:12\nDhuhr: 12:30..." */
function parsePrayerTimes(str) {
  if (!str || typeof str !== 'string') return [];
  const row = { date: '', fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '' };
  const map = { fajr:'fajr', dhuhr:'dhuhr', zuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha', ishaa:"isha" };
  str.split(/[\n,;]+/).forEach(line => {
    const m = line.match(/([a-z]+)\s*[:\-]\s*([\d:apm\s]+)/i);
    if (m) {
      const key = map[m[1].toLowerCase().trim()];
      if (key) row[key] = m[2].trim();
    }
  });
  const hasData = Object.values(row).some(v => v && v !== '');
  return hasData ? [row] : [];
}

/** Parse embassy contact string into structured object */
function parseEmbassy(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return {};
  const lines = str.split(/\n/).map(l => l.trim()).filter(Boolean);
  const obj = { name: '', address: '', phone: '', email: '', website: '' };

  lines.forEach((line, i) => {
    if (i === 0 && !line.match(/^(tel|phone|addr|email|web|http)/i)) {
      obj.name = line;
    } else if (line.match(/^(tel|phone|\+|00)/i))  obj.phone   = line.replace(/^(tel|phone)\s*[:\-]\s*/i, '').trim();
    else if (line.match(/@/))                        obj.email   = line.replace(/^email\s*[:\-]\s*/i, '').trim();
    else if (line.match(/^https?:\/\//i))            obj.website = line.trim();
    else if (line.match(/^(addr|street|road|po box)/i)) obj.address = line.replace(/^addr\w*\s*[:\-]\s*/i, '').trim();
    else if (!obj.address && i > 0)                  obj.address = (obj.address ? obj.address + ', ' : '') + line;
  });

  return obj.name || obj.address ? obj : { name: 'Saudi Embassy', address: str };
}

/** Split a markdown/text block into bullet list items */
function parseToList(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(/\n/)
    .map(l => l.replace(/^[\s\-•*\d\.]+/, '').trim())
    .filter(l => l.length > 8);
}

/** Parse visit_schedule_markdown into agenda days */
function parseAgendaFromMarkdown(md) {
  if (!md) return [];
  const days = [];
  let current = null;
  md.split('\n').forEach(line => {
    const dayMatch = line.match(/^#{1,3}\s*(day\s*\d+|يوم\s*\d+|\d{4}-\d{2}-\d{2}|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      current = { day_label: line.replace(/^#+\s*/, '').trim(), day_label_en: '', items: [] };
      days.push(current);
    } else if (current) {
      const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–:]\s*(.+)/i);
      if (timeMatch) {
        current.items.push({ time: timeMatch[1].trim(), activity: timeMatch[2].trim(), location: '' });
      } else if (line.replace(/[-•*]/g, '').trim().length > 3) {
        current.items.push({ time: '', activity: line.replace(/^[-•*\s]+/, '').trim(), location: '' });
      }
    }
  });
  return days;
}

/** Parse health/session markdown into sessions object {day1, day2, day3} */
function parseSessionsFromMarkdown(visitMd, healthMd) {
  const combined = [visitMd, healthMd].filter(Boolean).join('\n\n');
  if (!combined.trim()) return {};
  const sessions = { day1: [], day2: [], day3: [] };
  const lines = combined.split('\n');
  let dayIdx = 0;
  let currentDay = 'day1';
  lines.forEach(line => {
    if (line.match(/^#{1,3}\s*(day\s*\d+|يوم\s*\d+|\d{4}-\d{2}-\d{2})/i)) {
      dayIdx++;
      currentDay = dayIdx <= 1 ? 'day1' : dayIdx <= 2 ? 'day2' : 'day3';
    } else {
      const m = line.match(/(\d{1,2}:\d{2})\s*[-–]\s*(.+)/);
      if (m && sessions[currentDay]) {
        sessions[currentDay].push({ time: m[1], title: m[2].trim(), speakers: '', description: '' });
      }
    }
  });
  // Clean empty days
  Object.keys(sessions).forEach(k => { if (!sessions[k].length) delete sessions[k]; });
  return sessions;
}

/** Build an executive summary from the available data */
function buildExecutiveSummary(cr, cl, tp, formData) {
  const parts = [];
  if (cr.official_name) parts.push(`${cr.official_name} — ${cr.dates || formData.dates || ''} — ${cr.venue || formData.city || ''}.`);
  if (cr.theme_or_slogan) parts.push(`Theme: ${cr.theme_or_slogan}.`);
  if (cl.economic_overview) parts.push(cl.economic_overview.slice(0, 300));
  if (tp.key_messages) parts.push(tp.key_messages.slice(0, 300));
  return parts.join('\n\n');
}

/** Return a flag emoji for common countries */
function countryFlag(country) {
  const map = {
    'United States':'🇺🇸','United Kingdom':'🇬🇧','Germany':'🇩🇪','France':'🇫🇷',
    'Italy':'🇮🇹','Japan':'🇯🇵','China':'🇨🇳','Saudi Arabia':'🇸🇦',
    'المملكة العربية السعودية':'🇸🇦','UAE':'🇦🇪','الإمارات العربية المتحدة':'🇦🇪',
    'Qatar':'🇶🇦','قطر':'🇶🇦','Kuwait':'🇰🇼','الكويت':'🇰🇼','Bahrain':'🇧🇭',
    'البحرين':'🇧🇭','Oman':'🇴🇲','عُمان':'🇴🇲','Jordan':'🇯🇴','الأردن':'🇯🇴',
    'Egypt':'🇪🇬','مصر':'🇪🇬','Turkey':'🇹🇷','India':'🇮🇳','Singapore':'🇸🇬',
    'Switzerland':'🇨🇭','Australia':'🇦🇺','Canada':'🇨🇦','Spain':'🇪🇸',
    'South Korea':'🇰🇷','Brazil':'🇧🇷','Netherlands':'🇳🇱','Sweden':'🇸🇪',
    'Norway':'🇳🇴','Indonesia':'🇮🇩','Malaysia':'🇲🇾','Thailand':'🇹🇭',
    'South Africa':'🇿🇦','Morocco':'🇲🇦','المغرب':'🇲🇦',
  };
  return map[country] || '🌍';
}
