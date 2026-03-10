import { useState, useEffect } from 'react';
import { getReport } from '../services/api';
import { T, translateCountry } from '../i18n';

const initials = n => (n||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
const GRADS = [
  ['#1c3370','#3b5bdb'],['#0f766e','#14b8a6'],['#7e22ce','#a855f7'],
  ['#b45309','#f59e0b'],['#be123c','#fb7185'],['#0369a1','#38bdf8'],
];
const grad = n => GRADS[(n?.charCodeAt(0)||0)%GRADS.length];
const wIcon = c => {
  const s=(c||'').toLowerCase();
  return s.includes('sun')||s.includes('clear')?'☀️':s.includes('cloud')?'⛅':s.includes('rain')?'🌧️':s.includes('storm')?'⛈️':s.includes('snow')?'❄️':'🌤️';
};

/* ── Speaker photo with proper error fallback ────────────────────────── */
function SpeakerPhoto({ url, name, size=90 }) {
  const [err, setErr] = useState(false);
  const [g1, g2]      = GRADS[(name?.charCodeAt(0)||0) % GRADS.length];
  const ini            = (name||'').split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';

  if (!url || err) {
    return (
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background:`linear-gradient(135deg,${g1},${g2})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'white', fontWeight:900, fontSize:size*0.3,
        margin:'0 auto 14px', border:'3px solid white',
        boxShadow:'0 2px 10px rgba(0,0,0,0.15)', flexShrink:0,
      }}>
        {ini}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      style={{
        width:size, height:size, borderRadius:'50%', objectFit:'cover',
        border:'3px solid white', boxShadow:'0 2px 10px rgba(0,0,0,0.15)',
        display:'block', margin:'0 auto 14px', flexShrink:0,
      }}
      onError={() => setErr(true)}
    />
  );
}

/* ── Markdown-lite renderer ──────────────────────────────────────────── */
function renderInline(text) {
  if (!text || !String(text).includes('*')) return text;
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part))
      return <strong key={i} style={{ fontWeight:700, color:'#1c3370' }}>{part.slice(2,-2)}</strong>;
    if (/^\*(.+)\*$/.test(part))
      return <em key={i}>{part.slice(1,-1)}</em>;
    return part;
  });
}

function RichText({ text, dir }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return (
    <div style={{ direction: dir }}>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height:6 }} />;
        if (/^###\s/.test(t))
          return <div key={i} style={{ fontWeight:800, fontSize:15, color:'#1c3370', marginTop:14, marginBottom:6, borderBottom:'2px solid #e8edf4', paddingBottom:4 }}>{t.replace(/^###\s+/,'').replace(/\*\*/g,'')}</div>;
        if (/^##\s/.test(t))
          return <div key={i} style={{ fontWeight:800, fontSize:14, color:'#1c3370', marginTop:10, marginBottom:4 }}>{t.replace(/^##\s+/,'').replace(/\*\*/g,'')}</div>;
        if (/^[-•*]\s/.test(t))
          return <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}><span style={{ color:'#1c3370', fontWeight:700, flexShrink:0 }}>•</span><span style={{ fontSize:13.5, color:'#334155', lineHeight:1.7 }}>{renderInline(t.replace(/^[-•*]\s+/,''))}</span></div>;
        return <div key={i} style={{ fontSize:13.5, color:'#334155', lineHeight:1.8, marginBottom:2 }}>{renderInline(t)}</div>;
      })}
    </div>
  );
}

const NAV_DARK   = '#1e1b4b';
const SECTION_BG = 'linear-gradient(135deg,#0d1e3d 0%,#1c3370 60%,#1e4a9a 100%)';
const CARD_BORDER = '#e8edf4';
const SHADOW_SM   = '0 1px 4px rgba(0,0,0,0.05)';
const SHADOW_MD   = '0 4px 14px rgba(0,0,0,0.08)';

const SecBar = ({ icon, title }) => (
  <div style={{ background:SECTION_BG, color:'white', padding:'11px 20px', borderRadius:10, marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:16, fontWeight:800 }}>
    <span style={{ fontSize:19 }}>{icon}</span>{title}
  </div>
);

const SecHead = ({ icon, title, right, dir }) => (
  <div style={{ background:SECTION_BG, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
    <span style={{ color:'white', fontWeight:900, fontSize:16 }}>{title}</span>
    <span style={{ fontSize:19, opacity:0.85 }}>{right || icon}</span>
  </div>
);

const Chip = ({ icon, label, value, sub }) => (
  <div style={{ background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:12, padding:'13px 16px', boxShadow:SHADOW_SM }}>
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:6 }}>
      {icon && <span>{icon}</span>}{label}
    </div>
    <div style={{ fontSize:15.5, fontWeight:800, color:'#0d1829', lineHeight:1.3 }}>{value||'—'}</div>
    {sub && <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:3 }}>{sub}</div>}
  </div>
);

const Overview = ({ text }) => (
  <div style={{ borderInlineStart:'4px solid #1c3370', background:'white', padding:'14px 18px', borderRadius:'0 10px 10px 0', fontSize:15.5, color:'#334155', lineHeight:1.85, marginBottom:20 }}>
    {text}
  </div>
);

const TblHead = ({ cols, bg='#1c3370' }) => (
  <thead><tr style={{ background:bg }}>
    {cols.map(h => <th key={h} style={{ padding:'10px 14px', color:'white', fontWeight:700, textAlign:'right', fontSize:14 }}>{h}</th>)}
  </tr></thead>
);
const rowStyle = i => ({ background: i%2===0 ? 'white' : '#f8fafc', borderBottom:'1px solid #f1f5f9' });

function ExportBtn({ reportId, eventName, font }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={() => {
        setBusy(true);
        setTimeout(() => { window.print(); setBusy(false); }, 200);
      }}
      style={{
        display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
        background: busy ? '#818cf8' : NAV_DARK, color:'white', border:'none', borderRadius:9,
        fontSize:15, fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer',
        fontFamily:font, boxShadow:'0 2px 12px rgba(30,27,75,0.3)', transition:'all 0.18s', whiteSpace:'nowrap',
      }}
      onMouseEnter={e=>{ if(!busy){ e.currentTarget.style.background='#2d2a6e'; e.currentTarget.style.transform='translateY(-1px)'; } }}
      onMouseLeave={e=>{ e.currentTarget.style.background=busy?'#818cf8':NAV_DARK; e.currentTarget.style.transform='none'; }}>
      {busy
        ? <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'rd-spin 0.7s linear infinite' }}/>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      }
      {busy ? '...' : 'تصدير PDF'}
    </button>
  );
}

export default function ReportDetail({ reportId, onBack, lang='ar' }) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);

  const t    = T[lang];
  const isAr = lang === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';
  const font = "'Cairo',sans-serif";

  useEffect(() => {
    setLoading(true);
    getReport(reportId)
      .then(r => { setReport(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [reportId]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:14 }}>
      <div style={{ width:44, height:44, border:'4px solid #e2e8f0', borderTopColor:NAV_DARK, borderRadius:'50%', animation:'rd-spin 0.8s linear infinite' }}/>
      <div style={{ color:'#64748b', fontSize:16, fontFamily:font }}>{t.loadingReport}</div>
      <style>{`@keyframes rd-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!report) return null;

  const isReady = report.status === 'ready';
  const ci   = report.country_info    || {};
  const cd   = report.conference_data || {};
  const sess = report.sessions        || {};
  const card = { background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:14, padding:'22px 24px', marginTop:16, boxShadow:SHADOW_SM };

  return (
    <div id="report-print-area" style={{ background:'#f1f5f9', minHeight:'100%', fontFamily:font, direction:dir }}>
      <style>{`
        @keyframes rd-spin{to{transform:rotate(360deg)}}
        @media print {
          @page { size: A4; margin: 12mm; }

          /* ── Reset everything to visible first ── */
          * { visibility: visible !important; }

          /* ── Hide UI chrome ── */
          body > #root > div > nav,
          body > #root > div > aside,
          body > #root > div > header,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="nav"], [class*="Nav"],
          button.no-print,
          .no-print { display: none !important; visibility: hidden !important; }

          /* ── Page setup ── */
          html, body {
            background: white !important;
            margin: 0 !important; padding: 0 !important;
            width: 100% !important;
          }

          /* ── Make report fill the page ── */
          #report-print-area {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
          }

          /* ── Hide only buttons inside report ── */
          #report-print-area button { display: none !important; }

          /* ── Force color printing ── */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      <div style={{ padding:'20px 28px 60px', maxWidth:1100, margin:'0 auto' }}>

        {/* BREADCRUMB + EXPORT */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, direction:dir, background:'white', borderRadius:12, padding:'14px 20px', border:`1px solid ${CARD_BORDER}`, boxShadow:SHADOW_SM }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14.5, color:'#94a3b8' }}>
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontWeight:600, fontSize:14.5, fontFamily:font, padding:0, display:'flex', alignItems:'center', gap:5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points={isAr ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/>
              </svg>
              {t.breadcrumbDashboard}
            </button>
            <span style={{ color:'#d1d5db' }}>›</span>
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontWeight:600, fontSize:14.5, fontFamily:font, padding:0 }}>
              {t.breadcrumbReports}
            </button>
            <span style={{ color:'#d1d5db' }}>›</span>
            <span style={{ color:NAV_DARK, fontWeight:700, maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {report.event_name}
            </span>
          </div>
          <ExportBtn reportId={reportId} eventName={report.event_name} font={font}/>
        </div>

        {/* SUMMARY CARD */}
        <div style={{ ...card, marginTop:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, gap:12, direction:dir }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#0d1829', letterSpacing:isAr?0:'-0.02em' }}>
                  {report.event_name}
                </h1>
                <span style={{ background:isReady?'#e8fdf2':'#fef9e7', color:isReady?'#1a9655':'#b45309', border:`1px solid ${isReady?'#a7f0c4':'#fde68a'}`, borderRadius:20, padding:'3px 12px', fontSize:13.5, fontWeight:700 }}>
                  {isReady ? t.statusReady : t.statusDraft}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:9, fontSize:15 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#4a7adb' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontWeight:500 }}>{report.city}{report.country ? `، ${translateCountry(report.country, lang)}` : ''}</span>
            </div>
            {report.start_date && (
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ fontFamily:"'DM Sans',sans-serif" }}>
                  {report.start_date}{report.end_date && report.end_date !== report.start_date ? ` - ${report.end_date}` : ''}
                </span>
              </div>
            )}
            {report.event_website && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7adb" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <a href={report.event_website} target="_blank" rel="noreferrer" style={{ color:'#2563eb', fontSize:15, fontWeight:600, textDecoration:'none' }}>
                  {t.conferenceWebsite}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* TEXT SECTIONS: Summary / History / KSA Participation */}
        {[
          { key:'conference_summary',        icon:'📄', title:(isAr ? 'ملخص المؤتمر' : 'Conference Summary') },
          { key:'conference_history',        icon:'🕐', title:(isAr ? 'تاريخ المؤتمر' : 'Conference History') },
          { key:'ksa_participation_history', icon:'👤', title:(isAr ? 'مشاركة المملكة في المؤتمر' : 'KSA Participation History') },
        ].map(({ key, icon, title }) => report[key] ? (
          <div key={key} style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <SecHead icon={icon} title={title} dir={dir}/>
            <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}>
              {report[key]}
            </div>
          </div>
        ) : null)}

        {/* 2-col: Country + SFDA Relevance */}
        {(report.country_info?.overview || report.sfda_relevance) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
            {report.country_info?.overview && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'نبذة عن الدولة' : 'Country Brief'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}><RichText text={report.country_info.overview} dir={dir}/></div>
              </div>
            )}
            {report.sfda_relevance && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'الصلة بالهيئة' : 'Relevance to the Authority'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}><RichText text={report.sfda_relevance} dir={dir}/></div>
              </div>
            )}
          </div>
        )}

        {/* 2-col: Bilateral Relations + Geopolitical */}
        {(report.bilateral_relations || report.geopolitical_summary) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
            {report.bilateral_relations && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'العلاقات الثنائية' : 'Bilateral Relations'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}><RichText text={report.bilateral_relations} dir={dir}/></div>
              </div>
            )}
            {report.geopolitical_summary && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'الملف الجيوسياسي' : 'Geopolitical Profile'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}><RichText text={report.geopolitical_summary} dir={dir}/></div>
              </div>
            )}
          </div>
        )}

        {/* 2-col: Entry Requirements + Leadership */}
        {(report.entry_requirements || report.leadership_brief) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
            {report.entry_requirements && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'متطلبات الدخول والإجراءات' : 'Entry Requirements'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}>{report.entry_requirements}</div>
              </div>
            )}
            {report.leadership_brief && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'القيادة والحكومة' : 'Leadership & Government'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
                <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}>{report.leadership_brief}</div>
              </div>
            )}
          </div>
        )}

        {/* Trade Exchange */}
        {report.trade_exchange && (
          <div style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <SecHead title={isAr ? 'العلاقات التجارية الثنائية' : 'Bilateral Trade Relations'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}/>
            <div style={{ background:'white', padding:'18px 22px', fontSize:15.5, color:'#334155', lineHeight:1.9, direction:dir }}>
              {report.trade_exchange}
            </div>
          </div>
        )}

        {/* CONFERENCE DATA */}
        <div style={{ marginTop:16 }}>
          <SecBar icon="📅" title={isAr ? 'بيانات المؤتمر والمحاور الرئيسية' : 'Conference Data & Main Themes'}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
            <div style={{ background:'#f4f6f9', border:`1px solid #e2e8f0`, borderRadius:14, padding:'18px', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:14, alignSelf:'flex-start' }}>{t.organizerLabel}</div>
              <div style={{ background:'white', borderRadius:12, padding:'20px', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:100, marginBottom:12, border:`1px solid ${CARD_BORDER}` }}>
                {cd.logo_url
                  ? <img src={cd.logo_url} alt="logo" style={{ maxWidth:120, maxHeight:60, objectFit:'contain' }}/>
                  : <div style={{ width:60, height:60, borderRadius:12, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🏛️</div>}
              </div>
              <div style={{ fontSize:15.5, fontWeight:700, color:'#0d1829', textAlign:'center' }}>{cd.organizer || '—'}</div>
            </div>
            <div style={{ background:'#f4f6f9', border:`1px solid #e2e8f0`, borderRadius:14, padding:'18px', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:14 }}>{t.eventLabel}</div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', gap:10 }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#1c3370', lineHeight:1.35 }}>{report.event_name}</div>
                {report.start_date && (
                  <div style={{ fontSize:14.5, color:'#64748b', fontFamily:"'DM Sans',sans-serif" }}>
                    {report.start_date}{report.end_date && report.end_date!==report.start_date ? ` - ${report.end_date}` : ''}
                  </div>
                )}
              </div>
            </div>
            <div style={{ background:'#1c3370', borderRadius:14, padding:'18px', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:14 }}>{t.eventLeaderLabel}</div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', gap:8 }}>
                {cd.event_leader ? (
                  <>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>
                    <div style={{ color:'white', fontWeight:800, fontSize:16 }}>{cd.event_leader}</div>
                  </>
                ) : (
                  <>
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
                    <div style={{ color:'rgba(255,255,255,0.6)', fontSize:15, fontWeight:600 }}>{t.notSpecified}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          {(cd.theme || cd.overview) && (
            <div style={{ marginTop:16, ...card, padding:'16px 20px' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#1c3370', marginBottom:10 }}>
                <div style={{ background:'#1c3370', color:'white', borderRadius:6, padding:'3px 10px', fontSize:13, display:'inline-block' }}>{isAr ? 'شعار المؤتمر' : 'Conference Theme'}</div>
              </div>
              <Overview text={cd.theme || cd.overview}/>
            </div>
          )}
        </div>

        {/* COUNTRY INFO */}
        <div style={{ marginTop:16 }}>
          <SecBar icon="🌐" title={isAr ? 'معلومات عامة' : 'General Information'}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            <div style={{ background:'#1c3370', borderRadius:14, padding:'22px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:700, alignSelf:'flex-start' }}>{t.headOfStateLabel}</div>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, border:'2px solid rgba(255,255,255,0.15)' }}>
                {ci.head_photo ? <img src={ci.head_photo} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/> : '📷'}
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ color:'white', fontWeight:800, fontSize:16, lineHeight:1.3 }}>{ci.head_of_state || '—'}</div>
                {ci.head_of_state_title && <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13.5, marginTop:5 }}>{ci.head_of_state_title}</div>}
              </div>
            </div>
            <div style={{ background:'#1c3370', borderRadius:14, padding:'22px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:700, alignSelf:'flex-start' }}>{t.countryLabel}</div>
              <div style={{ fontSize:52, lineHeight:1 }}>{ci.flag || '🌍'}</div>
              <div style={{ color:'white', fontWeight:900, fontSize:20 }}>{translateCountry(report.country, lang)}</div>
            </div>
          </div>
          {ci.overview && (
            <div style={{ ...card, padding:'16px 20px', marginTop:0 }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ background:'#1c3370', color:'white', borderRadius:6, padding:'3px 10px', fontSize:13, fontWeight:800, display:'inline-block' }}>{isAr ? 'النظرة الاقتصادية' : 'Economic Overview'}</div>
              </div>
              <Overview text={ci.overview}/>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:14 }}>
            <Chip icon="🏛️" label={t.capitalLabel}    value={ci.capital}/>
            <Chip icon="👥" label={t.populationLabel} value={ci.population}/>
            <Chip icon="💰" label={t.currencyLabel}   value={ci.currency} sub={ci.currency_rate}/>
            <Chip icon="🏛️" label={t.governmentLabel} value={ci.government}/>
            <Chip icon="📐" label={t.areaLabel}       value={ci.area}/>
            <Chip icon="☪️" label={t.religionLabel}   value={ci.religion}/>
            <Chip icon="🔤" label={t.languageLabel}   value={ci.official_language}/>
            {ci.timezone && <Chip icon="⏰" label={t.timezoneLabel} value={ci.timezone}/>}
            {ci.gdp      && <Chip icon="📊" label={t.gdpLabel}     value={ci.gdp}/>}
          </div>
        </div>

        {/* VISIT OBJECTIVES */}
        {(report.visit_objectives||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="🎯" title={isAr ? 'المعلومات الأساسية للزيارة' : 'Basic Visit Information'}/>
            <div style={{ background:'white', borderRadius:14, border:`1px solid ${CARD_BORDER}`, padding:'18px 20px', boxShadow:SHADOW_SM }}>
              {(report.visit_objectives||[]).map((o,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:i<report.visit_objectives.length-1?'1px solid #f1f5f9':'none' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'#eff6ff', border:'2px solid #3b82f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:'#3b82f6' }}/>
                  </div>
                  <span style={{ fontSize:15.5, color:'#334155', lineHeight:1.7, flex:1 }}>{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELEGATION */}
        {(report.delegation||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="👥" title={isAr ? 'قائمة الوفد' : 'Delegation List'}/>
            <div style={{ ...card, marginTop:0 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:15 }}>
                <TblHead cols={['#', isAr?'الاسم':'Name', isAr?'المسمى الوظيفي':'Title', isAr?'الجهة':'Department']}/>
                <tbody>
                  {(report.delegation||[]).map((m,i) => (
                    <tr key={i} style={rowStyle(i)}>
                      <td style={{ padding:'11px 14px', color:'#1c3370', fontWeight:800, width:40, textAlign:'center' }}>{i+1}</td>
                      <td style={{ padding:'11px 14px', fontWeight:700, color:'#0f172a' }}>{m.name}</td>
                      <td style={{ padding:'11px 14px', color:'#334155' }}>{m.title}</td>
                      <td style={{ padding:'11px 14px', color:'#64748b', fontSize:14 }}>{m.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AGENDA */}
        {(report.agenda||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="📅" title={isAr ? 'موجز جدول أعمال الزيارة' : 'Visit Agenda Summary'}/>
            {(report.agenda||[]).map((day,di) => (
              <div key={di} style={{ marginBottom:14, borderRadius:10, border:`1px solid ${CARD_BORDER}`, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#1e3a6e', color:'white', padding:'10px 16px' }}>
                  <span style={{ fontWeight:800, fontSize:15.5 }}>{day.day_label}</span>
                  {day.day_label_en && <span style={{ background:'#b8932a', padding:'2px 10px', borderRadius:10, fontSize:10.5, fontWeight:700 }}>{day.day_label_en}</span>}
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:15, background:'white' }}>
                  <TblHead cols={[isAr?'الوقت':'Time', isAr?'النشاط':'Activity', isAr?'الموقع':'Location']} bg="#f0f4ff"/>
                  <tbody>
                    {(day.items||[]).map((item,ii) => (
                      <tr key={ii} style={rowStyle(ii)}>
                        <td style={{ padding:'10px 12px', fontWeight:800, color:'#1c3370', whiteSpace:'nowrap', fontSize:14, width:'12%' }}>{item.time}</td>
                        <td style={{ padding:'10px 12px', color:'#334155', lineHeight:1.5 }}>{item.activity}</td>
                        <td style={{ padding:'10px 12px', color:'#64748b', fontSize:14, width:'24%' }}>{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* EXECUTIVE SUMMARY */}
        {report.executive_summary && (
          <div style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <SecHead title={isAr ? 'الملخص التنفيذي' : 'Executive Summary'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}/>
            <div style={{ background:'white', padding:'20px 22px', fontSize:15.5, color:'#334155', lineHeight:2 }}>
              {report.executive_summary}
            </div>
          </div>
        )}

        {/* CONFERENCE TRACKS */}
        {(report.conference_tracks||[]).length > 0 && (
          <div style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <div style={{ background:SECTION_BG, padding:'11px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'white', fontWeight:800, fontSize:16 }}>{(isAr ? 'المحاور الرئيسية للمؤتمر' : 'Main Conference Themes')}</span>
              <span style={{ background:'rgba(255,255,255,0.15)', color:'white', borderRadius:8, padding:'2px 10px', fontSize:14, fontWeight:700 }}>{report.conference_tracks.length}</span>
            </div>
            <div style={{ background:'white', padding:'18px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[0,1].map(col => (
                  <div key={col} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {report.conference_tracks.map((track,i) => ({ track,i })).filter(({i}) => i%2===col).map(({track,i}) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:10, padding:'11px 14px', direction:dir }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'#1c3370', color:'white', fontWeight:800, fontSize:14, textAlign:'center', lineHeight:'28px', flexShrink:0 }}>{i+1}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, color:'#334155', fontWeight:700, lineHeight:1.4 }}>
                            {typeof track==='object'&&track!==null ? (track.name||'—') : (track||'—')}
                          </div>
                          {typeof track==='object'&&track!==null&&track.explanation && (
                            <div style={{ fontSize:13.5, color:'#64748b', marginTop:4, lineHeight:1.5 }}>{track.explanation}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SESSIONS */}
        {(['day1','day2','day3']).some(dk => sess[dk]?.length) && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="📋" title={isAr ? 'جدول جلسات معالي الرئيس التنفيذي' : 'CEO Session Schedule'}/>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {(['day1','day2','day3']).map((dk,di) => {
                const ds=sess[dk]; if (!ds?.length) return null;
                const lbl=(t.dayLabels||['Day 1','Day 2','Day 3'])[di];
                return (
                  <div key={dk} style={{ borderRadius:10, border:`1px solid ${CARD_BORDER}`, overflow:'hidden' }}>
                    <div style={{ background:'#1e3a6e', color:'white', padding:'9px 16px', fontWeight:800, fontSize:15.5 }}>{lbl}</div>
                    <div style={{ background:'white', padding:'10px 14px' }}>
                      {ds.map((s,si) => (
                        <div key={si} style={{ borderInlineStart:'3px solid #1c3370', paddingInlineStart:14, paddingTop:10, paddingBottom:10, marginBottom:10, borderBottom:si<ds.length-1?'1px solid #f1f5f9':'none' }}>
                          <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:4 }}>🕐 {s.time}</div>
                          <div style={{ fontWeight:800, fontSize:15.5, color:'#1c3370', marginBottom:4, lineHeight:1.4 }}>{s.title}</div>
                          {s.speakers && <div style={{ fontSize:14, color:'#2563eb', marginBottom:4, fontWeight:600 }}>👤 {s.speakers}</div>}
                          {s.description && <div style={{ fontSize:14, color:'#64748b', lineHeight:1.55 }}>{s.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SPEAKERS */}
        {(report.speakers||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ background:SECTION_BG, padding:'12px 20px', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'white', fontWeight:900, fontSize:17 }}>{(isAr ? 'المتحدثون' : 'Speakers')}</span>
                <span style={{ background:'rgba(255,255,255,0.15)', color:'white', borderRadius:8, padding:'2px 10px', fontSize:14, fontWeight:700 }}>{report.speakers.length} {t.speakersSuffix}</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginTop:14 }}>
              {(report.speakers||[]).map((s,i) => {
                const [g1,g2]=grad(s.name);
                return (
                  <div key={i} style={{ background:'#f4f7fb', border:`1px solid ${CARD_BORDER}`, borderRadius:16, padding:'24px 20px 20px', textAlign:'center', position:'relative', boxShadow:SHADOW_SM }}
                    onMouseEnter={e=>{ e.currentTarget.style.boxShadow=SHADOW_MD; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.boxShadow=SHADOW_SM; e.currentTarget.style.transform='none'; }}>
                    <SpeakerPhoto url={s.photo_url} name={s.name} size={90}/>
                    <div style={{ fontWeight:900, fontSize:17, color:'#0d1829', marginBottom:6, lineHeight:1.3, fontFamily:font }}>{s.name}</div>
                    <div style={{ fontSize:14.5, color:'#2563eb', fontWeight:600, marginBottom:s.organization?4:0, lineHeight:1.4 }}>{s.title}</div>
                    {s.organization && <div style={{ fontSize:14, color:'#94a3b8', fontWeight:500 }}>{s.organization}</div>}
                    {s.bio && (
                      <div style={{ marginTop:10, fontSize:13.5, color:'#64748b', lineHeight:1.6, textAlign:'start', background:'#f8fafc', borderRadius:8, padding:'8px 10px', border:'1px solid #e8edf4' }}>
                        {s.bio.slice(0, 160)}{s.bio.length > 160 ? '…' : ''}
                      </div>
                    )}
                    {s.relevance && (
                      <div style={{ marginTop:6, display:'flex', alignItems:'flex-start', gap:5 }}>
                        <span style={{ fontSize:10 }}>🎯</span>
                        <div style={{ fontSize:13, color:'#1c3370', fontWeight:600, lineHeight:1.5, textAlign:'start' }}>{s.relevance.slice(0,120)}{s.relevance.length>120?'…':''}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {(report.participants||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ background:SECTION_BG, padding:'12px 20px', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'white', fontWeight:900, fontSize:17 }}>{(isAr ? 'المشاركون المتوقعون' : 'Expected Participants')}</span>
                <span style={{ background:'rgba(255,255,255,0.15)', color:'white', borderRadius:8, padding:'2px 10px', fontSize:14, fontWeight:700 }}>{report.participants.length}</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginTop:14 }}>
              {(report.participants||[]).map((p,i) => {
                const [g1,g2]=grad(p.name);
                return (
                  <div key={i} style={{ background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:14, padding:'18px 12px 14px', textAlign:'center', boxShadow:SHADOW_SM }}
                    onMouseEnter={e=>{ e.currentTarget.style.boxShadow=SHADOW_MD; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.boxShadow=SHADOW_SM; e.currentTarget.style.transform='none'; }}>
                    {p.photo_url && <img src={p.photo_url} alt={p.name} style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'2px solid #e8edf4', margin:'0 auto 10px', display:'block' }} onError={e=>{ e.target.style.display='none'; }}/>}
                    <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${g1},${g2})`, display:p.photo_url?'none':'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:22, margin:'0 auto 10px', border:'2px solid #e8edf4' }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ fontWeight:800, fontSize:14.5, color:'#0d1829', marginBottom:4, lineHeight:1.3, fontFamily:font }}>{p.name}</div>
                    <div style={{ fontSize:13, color:'#2563eb', fontWeight:600, marginBottom:2 }}>{p.title}</div>
                    {p.organization && <div style={{ fontSize:10.5, color:'#94a3b8', marginBottom:p.country?8:0 }}>{p.organization}</div>}
                    {p.country && <span style={{ background:'#f1f5f9', color:'#475569', borderRadius:20, padding:'3px 10px', fontSize:10.5, fontWeight:600 }}>{translateCountry(p.country,lang)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BILATERAL MEETINGS */}
        {(report.bilateral_meetings||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="🤝" title={isAr ? 'اللقاءات الثنائية ونقاط الحديث على هامش الزيارة' : 'Bilateral Meetings & Talking Points'}/>
            {(report.bilateral_meetings||[]).map((m,i) => (
              <div key={i} style={{ border:`1px solid #e2e8f0`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
                <div style={{ background:'linear-gradient(135deg,#1c3370,#1e40af)', padding:'13px 20px' }}>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:700, marginBottom:4 }}>{t.officialMeetingLabel}</div>
                  <div style={{ color:'white', fontWeight:800, fontSize:17 }}>🤝 {m.entity}</div>
                </div>
                <div style={{ padding:'16px 20px', background:'white' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                    {[[t.officialLabel,m.counterpart],[t.jobTitleLabel2,m.counterpart_title],[t.dateTimeLabel,`${m.date||''} ${m.time||''}`]].map(([l,v]) => (
                      <div key={l} style={{ background:'#f8fafc', borderRadius:9, padding:'10px 12px', textAlign:'center', border:`1px solid ${CARD_BORDER}` }}>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:14.5, fontWeight:700, color:'#1e293b', lineHeight:1.35 }}>{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                  {(m.talking_points||[]).length > 0 && (
                    <>
                      <div style={{ fontWeight:700, fontSize:15, color:'#1c3370', marginBottom:10 }}>📌 {isAr?'نقاط النقاش':'Talking Points'}</div>
                      {(m.talking_points||[]).map((pt,pi) => (
                        <div key={pi} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                          <div style={{ width:22, height:22, borderRadius:7, background:'#22c55e', color:'white', fontSize:10, fontWeight:800, textAlign:'center', lineHeight:'22px', flexShrink:0 }}>{pi+1}</div>
                          <span style={{ fontSize:14.5, color:'#334155', lineHeight:1.55, flex:1 }}>{pt}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {m.location && <div style={{ marginTop:10, fontSize:14, color:'#64748b' }}>📍 {m.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUGGESTED MEETINGS */}
        {(report.suggested_meetings||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ background:SECTION_BG, padding:'12px 20px', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'white', fontWeight:900, fontSize:17 }}>{(isAr ? 'اللقاءات المقترحة' : 'Suggested Meetings')}</span>
                <span style={{ background:'rgba(255,255,255,0.15)', color:'white', borderRadius:8, padding:'2px 10px', fontSize:14, fontWeight:700 }}>{report.suggested_meetings.length}</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
              {(report.suggested_meetings||[]).map((m,i) => {
                const priority=(m.priority||'low').toLowerCase();
                const isHigh=priority==='high', isMed=priority==='medium'||priority==='متوسطة';
                const dotColor=isHigh?'#ef4444':isMed?'#f59e0b':'#94a3b8';
                const bgColor=isHigh?'#fff5f5':isMed?'#fffbeb':'#f8fafc';
                const borderClr=isHigh?'#fecaca':isMed?'#fde68a':'#e2e8f0';
                const badgeBg=isHigh?'#fee2e2':isMed?'#fef9c3':'#f1f5f9';
                const badgeClr=isHigh?'#dc2626':isMed?'#b45309':'#64748b';
                const badgeTxt=isHigh?t.priorityHigh:isMed?t.priorityMedium:t.priorityLow;
                return (
                  <div key={i} style={{ background:bgColor, border:`1px solid ${borderClr}`, borderRadius:12, padding:'14px 18px', direction:dir }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:9, height:9, borderRadius:'50%', background:dotColor, display:'inline-block' }}/>
                        <span style={{ fontWeight:800, fontSize:16, color:'#0d1829', fontFamily:font }}>{m.entity}</span>
                      </div>
                      <span style={{ background:badgeBg, color:badgeClr, border:`1px solid ${borderClr}`, borderRadius:20, padding:'3px 12px', fontSize:13.5, fontWeight:700 }}>{badgeTxt}</span>
                    </div>
                    {m.country && <div style={{ fontSize:14.5, color:'#2563eb', fontWeight:600, marginBottom:6, marginInlineStart:17 }}>{translateCountry(m.country,lang)}</div>}
                    {m.description && <div style={{ fontSize:15, color:'#475569', lineHeight:1.65, marginInlineStart:17 }}>{m.description}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AMBASSADORS + MAP */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
          <div style={{ background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:14, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
              <span style={{ fontWeight:800, fontSize:16, color:'#0d1829' }}>{(isAr ? 'السفراء الرئيسيون' : 'Key Ambassadors')}</span>
            </div>
            <div style={{ padding:'18px' }}>
              {(report.key_ambassadors||[]).length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {(report.key_ambassadors||[]).map((amb,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px', background:'#f8fafc', borderRadius:10, border:`1px solid ${CARD_BORDER}`, direction:dir }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#1c3370,#3b5bdb)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:17, flexShrink:0 }}>
                        {(amb.name||'?').charAt(0)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:15.5, color:'#0d1829', marginBottom:2 }}>{amb.name}</div>
                        <div style={{ fontSize:14, color:'#64748b', marginBottom:4 }}>{amb.title}</div>
                        {amb.country && <span style={{ background:'#eff6ff', color:'#1c3370', borderRadius:6, padding:'2px 8px', fontSize:13, fontWeight:700 }}>🌍 {translateCountry(amb.country,lang)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'32px 20px', color:'#94a3b8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" style={{ display:'block', margin:'0 auto 14px' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <div style={{ fontSize:15.5, fontWeight:700, color:'#64748b' }}>{t.noAmbassadors}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:14, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', direction:dir }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:16, color:'#0d1829' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a7adb" strokeWidth="2.2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {t.destinationMap}
                </div>
                <div style={{ fontSize:14, color:'#94a3b8', marginTop:3 }}>
                  {report.city}{report.country ? `، ${translateCountry(report.country,lang)}` : ''}
                </div>
              </div>
              <a href={`https://maps.google.com/?q=${encodeURIComponent((report.city||'')+', '+(report.country||''))}`}
                target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:5, fontSize:14, color:'#2563eb', fontWeight:600, textDecoration:'none' }}>
                {t.openGoogleMaps}
              </a>
            </div>
            <iframe title="destination-map" width="100%" height="260"
              style={{ border:'none', display:'block' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent((report.city||'')+', '+(report.country||''))}&output=embed&z=11`}/>
          </div>
        </div>

        {/* EMBASSY + WEATHER */}
        {(report.embassy?.name || (report.weather||[]).length > 0) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
            {report.embassy?.name && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'سفارة المملكة لدى الولايات المتحدة الأمريكية' : 'Saudi Embassy in the USA'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}/>
                <div style={{ padding:'18px 20px', background:'white' }}>
                  {report.embassy?.name && <div style={{ fontWeight:800, fontSize:17, color:'#0d1829', marginBottom:14 }}>{report.embassy.name}</div>}
                  {report.embassy?.mission && (
                    <div style={{ background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                      <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:5 }}>{t.embassyBuilding}</div>
                      <div style={{ fontSize:14.5, color:'#475569', lineHeight:1.6 }}>{report.embassy.mission}</div>
                    </div>
                  )}
                  {report.embassy?.ambassador_name && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fafc', borderRadius:10, padding:'10px 14px', marginBottom:14, border:`1px solid ${CARD_BORDER}` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c3370" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <div>
                        <div style={{ fontWeight:800, fontSize:15.5, color:'#0d1829' }}>{report.embassy.ambassador_name}</div>
                        {report.embassy.ambassador_title && <div style={{ fontSize:13.5, color:'#64748b', marginTop:2 }}>{report.embassy.ambassador_title}</div>}
                      </div>
                    </div>
                  )}
                  {[
                    report.embassy?.address && { icon:'📍', val:report.embassy.address },
                    report.embassy?.phone   && { icon:'📞', val:report.embassy.phone },
                    report.embassy?.email   && { icon:'✉️', val:report.embassy.email },
                    report.embassy?.website && { icon:'🌐', val:report.embassy.website, isLink:true },
                  ].filter(Boolean).map((row,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 0', borderTop:'1px solid #f1f5f9' }}>
                      <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{row.icon}</span>
                      {row.isLink
                        ? <a href={row.val} target="_blank" rel="noreferrer" style={{ fontSize:14.5, color:'#2563eb', wordBreak:'break-all', textDecoration:'none' }}>{row.val}</a>
                        : <span style={{ fontSize:14.5, color:'#475569', lineHeight:1.5 }}>{row.val}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(report.weather||[]).length > 0 && (
              <div style={{ borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
                <SecHead title={isAr ? 'الطقس ومواقيت الصلاة' : 'Weather & Prayer Times'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a9 9 0 1 1-17.95-1"/></svg>}/>
                <div style={{ padding:'18px 20px', background:'white' }}>
                  {report.weather[0] && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                      {[
                        [t.temperature, `${report.weather[0].high}°C / ${report.weather[0].low}°C`],
                        [t.humidity2,   report.weather[0].humidity],
                        [t.condition,   `${wIcon(report.weather[0].condition)} ${report.weather[0].condition}`],
                        [t.wind2,       `💨 ${report.weather[0].wind}`],
                      ].map(([label,val]) => (
                        <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:`1px solid ${CARD_BORDER}` }}>
                          <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:6 }}>{label}</div>
                          <div style={{ fontWeight:800, fontSize:15.5, color:'#0d1829' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:`1px solid ${CARD_BORDER}` }}>
                    <div style={{ fontSize:13, color:'#94a3b8', fontWeight:700, marginBottom:8 }}>{(isAr ? 'توصيات الطقس' : 'Weather Tips')}</div>
                    {(t.weatherTips||[]).slice(0,4).map((tip,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:5 }}>
                        <span style={{ color:'#1c3370', fontWeight:800, fontSize:14, flexShrink:0, marginTop:2 }}>•</span>
                        <span style={{ fontSize:14.5, color:'#475569', lineHeight:1.55 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRAYER TIMES */}
        {(report.prayer_times||[]).length > 0 && (() => {
          const today = report.prayer_times[0];
          return (
            <div style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
              <SecHead title={`${(isAr ? 'مواقيت الصلاة' : 'Prayer Times')} (${report.city})`} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
              <div style={{ background:'white', padding:'18px 22px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, direction:dir }}>
                  {[['الفجر','Fajr',today.fajr],['الظهر','Dhuhr',today.dhuhr],['العصر','Asr',today.asr],['المغرب','Maghrib',today.maghrib],['العشاء','Isha',today.isha]].map(([ar,en,val]) => val && (
                    <div key={ar} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', borderRadius:10, border:`1px solid ${CARD_BORDER}` }}>
                      <span style={{ fontSize:15.5, color:'#334155', fontWeight:700 }}>{isAr?ar:en}</span>
                      <span style={{ fontSize:16, fontWeight:900, color:'#1c3370' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* PREVIOUS OUTCOMES */}
        {(report.previous_outcomes||[]).length > 0 && (
          <div style={{ marginTop:16 }}>
            <SecBar icon="📈" title={isAr ? 'مخرجات الجولات السابقة للمؤتمر' : 'Previous Conference Outcomes'}/>
            {(report.previous_outcomes||[]).map((o,i) => (
              <div key={i} style={{ borderInlineStart:'4px solid #1c3370', background:'white', borderRadius:'0 12px 12px 0', padding:'14px 18px', marginBottom:12, border:`1px solid ${CARD_BORDER}`, boxShadow:SHADOW_SM }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#1c3370', marginBottom:6 }}>{isAr?'دورة':'Edition'} {o.year}</div>
                <div style={{ fontSize:15, color:'#475569', lineHeight:1.7 }}>{o.summary}</div>
              </div>
            ))}
          </div>
        )}

        {/* SFDA TALKING POINTS */}
        {(report.sfda_talking_points||[]).length > 0 && (
          <div style={{ marginTop:16, borderRadius:14, border:`1px solid ${CARD_BORDER}`, overflow:'hidden', boxShadow:SHADOW_SM }}>
            <SecHead title={isAr ? 'نقاط الحديث على هامش الزيارة' : 'Talking Points'} dir={dir} right={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}/>
            <div style={{ background:'white', padding:'18px 22px' }}>
              <ol style={{ margin:0, padding:0, listStyle:'none' }}>
                {(report.sfda_talking_points||[]).map((pt,i) => (
                  <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'9px 0', borderBottom:i<report.sfda_talking_points.length-1?'1px solid #f1f5f9':'none', direction:dir }}>
                    <span style={{ fontWeight:800, fontSize:16, color:'#1c3370', flexShrink:0, minWidth:20, marginTop:1 }}>{i+1}.</span>
                    <span style={{ fontSize:15.5, color:'#334155', lineHeight:1.7 }}><RichText text={pt} dir={dir}/></span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop:32, textAlign:'center', padding:'16px', background:'white', borderRadius:12, border:`1px solid ${CARD_BORDER}` }}>
          <div style={{ fontSize:13.5, color:'#94a3b8' }}>{t.footer}</div>
          <div style={{ fontSize:10.5, color:'#cbd5e1', marginTop:4 }}>SFDA · {new Date().getFullYear()}</div>
        </div>

      </div>
    </div>
  );
}
