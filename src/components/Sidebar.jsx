import { useState, useEffect } from 'react';
import { T, getLang, setLang as persistLang } from '../i18n';

// ─── Design tokens (dark navy theme) ─────────────────────
const NAV_BG     = '#0d1829';
const NAV_ACTIVE = 'rgba(99,102,241,0.18)';
const NAV_HOV    = 'rgba(255,255,255,0.06)';
const NAV_ACCENT = '#6366f1';
const NAV_TEXT   = 'rgba(255,255,255,0.55)';
const NAV_TEXTHI = '#a5b4fc';
const NAV_ICON   = 'rgba(255,255,255,0.30)';
const NAV_ICONHI = '#818cf8';
const NAV_BORDER = 'rgba(255,255,255,0.07)';

/* ── V-mark logo — same as auth pages ─────────────────── */
function BrandLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 58 58" fill="none">
      <defs>
        <linearGradient id="sbvg" x1="0" y1="0" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#a78bfa"/>
          <stop offset="55%"  stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="58" height="58" rx="15" fill="url(#sbvg)" fillOpacity="0.15"/>
      <path d="M13 15 L29 45 L45 15"
        stroke="url(#sbvg)" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M29 45 L40 22"
        stroke="#38bdf8" strokeWidth="3.5"
        strokeLinecap="round" strokeOpacity="0.85"/>
    </svg>
  );
}

/* ── Section label ─────────────────────────────────────── */
function SecLabel({ children }) {
  return (
    <div style={{
      fontSize: 9.5, fontWeight: 700,
      color: 'rgba(255,255,255,0.22)',
      letterSpacing: '0.18em', textTransform: 'uppercase',
      padding: '16px 14px 6px', userSelect: 'none',
    }}>
      {children}
    </div>
  );
}

/* ── Nav item ──────────────────────────────────────────── */
function NavItem({ id, label, icon, badge, active, isAr, font, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 14px', borderRadius: 10, marginBottom: 2,
        cursor: 'pointer', border: 'none',
        fontFamily: font, fontSize: 13.5, fontWeight: active ? 700 : 500,
        direction: isAr ? 'rtl' : 'ltr', textAlign: 'start',
        transition: 'all 0.15s',
        background: active ? NAV_ACTIVE : hov ? NAV_HOV : 'transparent',
        color: active ? NAV_TEXTHI : hov ? '#e2e8f0' : NAV_TEXT,
        borderInlineStart: `3px solid ${active ? NAV_ACCENT : 'transparent'}`,
      }}>
      <span style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        color: active ? NAV_ICONHI : hov ? '#94a3b8' : NAV_ICON,
        transition: 'color 0.15s',
      }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
          background: 'rgba(124,58,237,0.25)', color: '#c4b5fd',
          border: '1px solid rgba(124,58,237,0.3)',
        }}>
          {badge}
        </span>
      )}
      {active && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: NAV_ICONHI, flexShrink: 0,
        }}/>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR
   Props identical to original: page · setPage · lang · setLang
═══════════════════════════════════════════════════════════ */
export default function Sidebar({ page, setPage, lang: parentLang, setLang: notifyParent }) {
  const [lang, setLangState] = useState(() => getLang() || 'ar');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (parentLang && parentLang !== lang) setLangState(parentLang);
  }, [parentLang]);

  const switchLang = (l) => {
    if (l === lang) return;
    persistLang(l); setLangState(l); notifyParent?.(l);
  };

  const isAr = lang === 'ar';
  const font = isAr ? "'Cairo','Segoe UI',sans-serif" : "'DM Sans',-apple-system,sans-serif";
  const t    = T[lang];

  /* ── Nav sections — same IDs as original ── */
  const NAV_MAIN = [
    {
      id: 'dashboard', label: t.dashboard,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    },
    {
      id: 'reports', label: t.reports,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
    },
  ];

  const NAV_ACTIONS = [
    {
      id: 'new', label: t.newReport,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
    },
  ];

  const NAV_AI = [
    {
      id: 'ai', label: t.aiAssistant, badge: 'AI',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    },
  ];

  const renderNav = (items) =>
    items.map(item => (
      <NavItem
        key={item.id} {...item}
        active={page === item.id}
        isAr={isAr} font={font}
        onClick={() => setPage(item.id)}
      />
    ));

  return (
    <aside style={{
      width: 220, minWidth: 220,
      height: '100vh',
      background: NAV_BG,
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, fontFamily: font,
      borderInlineStart: `1px solid ${NAV_BORDER}`,
    }}>

      {/* ── Brand ── */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: `1px solid ${NAV_BORDER}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 11, direction: 'ltr',
        }}>
          <BrandLogo />
          <div>
            <div style={{
              fontSize: 13, fontWeight: 800,
              color: '#f1f5f9', lineHeight: 1.3, fontFamily: font,
            }}>
              {isAr ? 'إحاطة' : 'Ehaata'}
            </div>
            <div style={{
              fontSize: 10, color: '#38bdf8',
              letterSpacing: '0.08em', marginTop: 2,
              fontFamily: "'DM Sans',sans-serif",
            }}>
              {isAr ? 'منصة الإحاطة الذكية' : 'Smart Briefing Platform'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>

        {/* القائمة / Navigation */}
        <SecLabel>{t.navigation}</SecLabel>
        {renderNav(NAV_MAIN)}

        {/* الإجراءات / Actions */}
        <SecLabel>{t.actions}</SecLabel>
        {renderNav(NAV_ACTIONS)}

        {/* أدوات الذكاء الاصطناعي / AI Tools */}
        <SecLabel>{t.aiTools}</SecLabel>
        {renderNav(NAV_AI)}

      </nav>

      {/* ── Language toggle — same logic as original ── */}
      <div style={{
        padding: '12px 12px',
        borderTop: `1px solid ${NAV_BORDER}`,
      }}>
        <div style={{
          fontSize: 9.5, fontWeight: 600,
          color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          marginBottom: 8, paddingInlineStart: 2,
        }}>
          {isAr ? 'اللغة' : 'Language'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['ar', 'عربي'], ['en', 'EN']].map(([l, label]) => (
            <button key={l} onClick={() => switchLang(l)} style={{
              flex: 1, padding: '8px 4px', cursor: 'pointer',
              borderRadius: 8, transition: 'all 0.15s', fontFamily: font,
              border: `1.5px solid ${lang === l ? NAV_ACCENT : NAV_BORDER}`,
              background: lang === l ? NAV_ACTIVE : 'rgba(255,255,255,0.04)',
              color: lang === l ? NAV_TEXTHI : NAV_TEXT,
              fontSize: l === 'ar' ? 13 : 11,
              fontWeight: lang === l ? 700 : 500,
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── User row + logout — same data as original ── */}
      <div style={{
        padding: '12px 14px 20px',
        borderTop: `1px solid ${NAV_BORDER}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          direction: isAr ? 'rtl' : 'ltr', marginBottom: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: 'white',
          }}>
            {isAr ? 'هـ' : 'SU'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', fontFamily: font,
            }}>
              {isAr ? 'مستخدم النظام' : 'System User'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
              {isAr ? 'الرئيس التنفيذي' : 'Admin · SFDA'}
            </div>
          </div>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 0 2px rgba(34,197,94,0.25)', flexShrink: 0,
          }}/>
        </div>

        {/* Logout */}
        <button
          style={{
            width: '100%', padding: '9px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${NAV_BORDER}`,
            borderRadius: 9, cursor: 'pointer',
            fontFamily: font, fontSize: 12.5, fontWeight: 600,
            color: 'rgba(255,255,255,0.38)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7,
            transition: 'all 0.15s',
            direction: isAr ? 'rtl' : 'ltr',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.10)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.borderColor = NAV_BORDER;
            e.currentTarget.style.color = 'rgba(255,255,255,0.38)';
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t.logoutBtn}
        </button>
      </div>

    </aside>
  );
}
