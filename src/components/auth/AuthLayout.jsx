import { useState } from 'react';
import { T, getLang, setLang as persistLang } from '../../i18n';

// ─────────────────────────────────────────────────────────
//  AuthLayout — single source of truth for language.
//
//  Panel positions:
//    Arabic  (RTL) → image LEFT  · form RIGHT
//    English (LTR) → form  LEFT  · image RIGHT
//
//  Achieved with flexDirection + order so the DOM order
//  stays consistent and only visual position changes.
// ─────────────────────────────────────────────────────────

export default function AuthLayout({ children, lang: propLang, onLangChange }) {
  const [lang, setLang]     = useState(() => propLang || getLang() || 'ar');
  const [darkMode, setDark] = useState(false);

  const t    = T[lang];
  const isAr = lang === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';
  const font = isAr ? "'Cairo','Segoe UI',sans-serif" : "'DM Sans',-apple-system,sans-serif";

  const switchLang = (l) => {
    persistLang(l);
    setLang(l);
    onLangChange?.(l);
  };

  /* ── Hero content per language ── */
  const hero = {
    ar: {
      headline: (
        <>
          <span style={{ color: '#fff' }}>منصة </span>
          <span style={{ color: '#38bdf8' }}>الإحاطة</span>
          <br />
          <span style={{ color: '#38bdf8' }}>الذكية </span>
          <span style={{ color: '#fff' }}>لتمكين التمثيل المؤسسي</span>
        </>
      ),
      sub: 'إحاطة — المنصة الذكية المتكاملة لإعداد الإحاطات التنفيذية ودعم التمثيل المؤسسي في المحافل الدولية.',
      stats: [
        { value: '24/7',  label: 'تحليل لحظي'  },
        { value: '500+',  label: 'وجهة عالمية'  },
        { value: '10M+',  label: 'نقطة بيانات'  },
      ],
    },
    en: {
      headline: (
        <>
          <span style={{ color: '#fff' }}>Ehaata — </span>
          <span style={{ color: '#38bdf8' }}>Smart</span>
          <br />
          <span style={{ color: '#38bdf8' }}>Briefing </span>
          <span style={{ color: '#fff' }}>Platform</span>
        </>
      ),
      sub: 'Ehaata is the intelligent briefing platform empowering institutional representation at international conferences and summits.',
      stats: [
        { value: '24/7',  label: 'Live Analytics'      },
        { value: '500+',  label: 'Global Destinations' },
        { value: '10M+',  label: 'Data Points'         },
      ],
    },
  }[lang];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: font,
      /*
        AR → row-reverse  : hero renders first in DOM but appears LEFT,
                            form appears RIGHT
        EN → row          : form appears LEFT, hero appears RIGHT
      */
      flexDirection: isAr ? 'row-reverse' : 'row',
    }}>

      {/* ══ FORM PANEL ══════════════════════════════════════════════════════ */}
      <div style={{
        width: '46%', minWidth: 380, maxWidth: 560,
        background: darkMode ? '#0f172a' : '#ffffff',
        display: 'flex', flexDirection: 'column',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.3s',
      }}>

        {/* Language switcher — always top corner nearest the hero image */}
        <div style={{
          position: 'absolute',
          top: 20,
          /* AR: left corner (towards image)  EN: right corner (towards image) */
          [isAr ? 'left' : 'right']: 20,
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          border: '1px solid #e2e8f0', zIndex: 10,
        }}>
          {['ar', 'en'].map(l => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding: '5px 14px', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                fontFamily: l === 'ar' ? "'Cairo',sans-serif" : "'DM Sans',sans-serif",
                background: lang === l ? '#1e1b4b' : '#f1f5f9',
                color:      lang === l ? '#ffffff'  : '#64748b',
                transition: 'all 0.15s',
              }}>
              {l === 'ar' ? 'ع' : 'EN'}
            </button>
          ))}
        </div>

        {/* Centered form */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          overflowY: 'auto', padding: '60px 40px',
        }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            {typeof children === 'function'
              ? children({ lang, t, isAr, dir, font, darkMode })
              : children}
          </div>
        </div>

      </div>

      {/* ══ HERO PANEL ══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=90&fit=crop&auto=format')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,rgba(5,15,50,0.45) 0%,rgba(10,25,80,0.58) 50%,rgba(4,12,40,0.80) 100%)',
        }} />

        {/* Hero text — aligned to language direction */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '52px 48px 0',
          direction: isAr ? 'rtl' : 'ltr',
          textAlign: isAr ? 'right' : 'left',
        }}>
          <h1 style={{
            margin: '0 0 20px', fontSize: 42, fontWeight: 900,
            lineHeight: 1.3, fontFamily: font,
          }}>
            {hero.headline}
          </h1>
          <p style={{
            margin: 0, fontSize: 13.5, lineHeight: 1.85,
            color: 'rgba(255,255,255,0.72)',
            fontFamily: font, maxWidth: 420,
          }}>
            {hero.sub}
          </p>
        </div>

        {/* Stats bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '20px 32px',
          direction: isAr ? 'rtl' : 'ltr',
        }}>
          {hero.stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 26, fontWeight: 900, color: '#fff',
                fontFamily: "'DM Sans',sans-serif", lineHeight: 1.1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 11.5, color: 'rgba(255,255,255,0.60)',
                marginTop: 5, fontFamily: font,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Dark mode toggle — always bottom corner nearest the form */}
        <button
          onClick={() => setDark(p => !p)}
          style={{
            position: 'absolute', bottom: 20,
            [isAr ? 'right' : 'left']: 20,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15, color: '#fff',
          }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

      </div>

    </div>
  );
}
