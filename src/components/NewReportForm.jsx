import { useState, useRef } from 'react';
import { createReport, generateAI, getPDFUrl, getPreviewUrl } from '../services/api';
// briefingMapper is used internally by api.js — no direct import needed here

// ─── Countries ────────────────────────────────────────────
const COUNTRIES = [
  { en:'United States',ar:'الولايات المتحدة الأمريكية' },{ en:'United Kingdom',ar:'المملكة المتحدة' },
  { en:'Germany',ar:'ألمانيا' },{ en:'France',ar:'فرنسا' },{ en:'Italy',ar:'إيطاليا' },
  { en:'Spain',ar:'إسبانيا' },{ en:'Japan',ar:'اليابان' },{ en:'China',ar:'الصين' },
  { en:'South Korea',ar:'كوريا الجنوبية' },{ en:'India',ar:'الهند' },{ en:'Singapore',ar:'سنغافورة' },
  { en:'Australia',ar:'أستراليا' },{ en:'Canada',ar:'كندا' },{ en:'Brazil',ar:'البرازيل' },
  { en:'Mexico',ar:'المكسيك' },{ en:'Netherlands',ar:'هولندا' },{ en:'Switzerland',ar:'سويسرا' },
  { en:'Sweden',ar:'السويد' },{ en:'Norway',ar:'النرويج' },{ en:'Denmark',ar:'الدنمارك' },
  { en:'Belgium',ar:'بلجيكا' },{ en:'Austria',ar:'النمسا' },{ en:'Finland',ar:'فنلندا' },
  { en:'Portugal',ar:'البرتغال' },{ en:'Greece',ar:'اليونان' },{ en:'Poland',ar:'بولندا' },
  { en:'Turkey',ar:'تركيا' },{ en:'Russia',ar:'روسيا' },{ en:'Egypt',ar:'مصر' },
  { en:'Saudi Arabia',ar:'المملكة العربية السعودية' },{ en:'UAE',ar:'الإمارات العربية المتحدة' },
  { en:'Kuwait',ar:'الكويت' },{ en:'Qatar',ar:'قطر' },{ en:'Bahrain',ar:'البحرين' },
  { en:'Oman',ar:'عُمان' },{ en:'Jordan',ar:'الأردن' },{ en:'Lebanon',ar:'لبنان' },
  { en:'Iraq',ar:'العراق' },{ en:'Morocco',ar:'المغرب' },{ en:'Tunisia',ar:'تونس' },
  { en:'Algeria',ar:'الجزائر' },{ en:'South Africa',ar:'جنوب أفريقيا' },{ en:'Nigeria',ar:'نيجيريا' },
  { en:'Pakistan',ar:'باكستان' },{ en:'Malaysia',ar:'ماليزيا' },{ en:'Thailand',ar:'تايلاند' },
  { en:'Indonesia',ar:'إندونيسيا' },{ en:'Vietnam',ar:'فيتنام' },{ en:'Philippines',ar:'الفلبين' },
  { en:'Taiwan',ar:'تايوان' },{ en:'Hong Kong',ar:'هونغ كونغ' },{ en:'New Zealand',ar:'نيوزيلندا' },
  { en:'Argentina',ar:'الأرجنتين' },{ en:'Colombia',ar:'كولومبيا' },{ en:'Chile',ar:'تشيلي' },
];
const EVENT_TYPES_EN = ['Conference','Summit','Exhibition','Forum','Workshop','Bilateral Meeting','Scientific Congress','Trade Show'];
const EVENT_TYPES_AR = ['مؤتمر','قمة','معرض','منتدى','ورشة عمل','اجتماع ثنائي','مؤتمر علمي','معرض تجاري'];

const L = {
  ar: {
    pageTitle:'إنشاء تقرير تنفيذي جديد',
    pageSubtitle:'أدخل تفاصيل المهمة وسيقوم المساعد الذكي بإنشاء مسودة تقرير احترافي مدعوم بالبيانات.',
    stepsLabel:'مراحل التنفيذ',
    steps:['تفاصيل الحدث','تحديد الموقع','جدولة المواعيد','توليد المسودة'],
    stepsSubDone:'مكتمل', stepsSubActive:'قيد الإدخال...',
    step1:'الخطوة 1', step2:'الخطوة 2', step3:'الخطوة 3',
    eventDetails:'تفاصيل الحدث',
    eventName:'اسم الحدث', eventNamePH:'مثال: مؤتمر السفر والتحول الرقمي 2024',
    eventType:'نوع الحدث', eventTypePH:'اختر نوع الحدث',
    reportLang:'لغة التقرير', langAr:'Arabic (العربية)', langEn:'English',
    eventWebsite:'رابط الحدث (اختياري)', websitePH:'https://event-website.com',
    location:'الموقع',
    country:'الدولة', countryPH:'مثال: المملكة العربية',
    city:'المدينة', cityPH:'مثال: الرياض',
    venue:'المقر', venuePH:'مثال: مركز المعارض',
    datesTitle:'تواريخ الحدث',
    startDate:'تاريخ البداية', endDate:'تاريخ النهاية',
    contextTitle:'سياق إضافي', contextLabel:'ملاحظات للمساعد الذكي',
    contextPH:'أضف أي سياق ذي صلة أو أهداف محددة لهذا التقرير...',
    generate:'إنشاء التقرير', cancel:'إلغاء', generating:'جاري الإنشاء...',
    tipsTitle:'نصائح التقارير',
    tipsBody:'للحصول على أفضل النتائج، يرجى إضافة تفاصيل دقيقة عن أهداف الرحلة والجهات التي تمت مقابلتها.',
    tipsList:['استخدم لغة مهنية ومباشرة','حدد التوصيات بوضوح'],
    aiChatLabel:'مقابلة فورية (AI)', aiChatPH:'جاري تحليل الطلب...',
    dir:'rtl',
    required:'يرجى تعبئة: اسم الحدث، المدينة، الدولة، وتاريخ البدء.',
    genTitle:'جاري إنشاء التقرير', genSubtitle:'يقوم الذكاء الاصطناعي بإعداد إحاطة استخباراتية متكاملة...',
    doneTitle:'تم إنشاء التقرير!',
    viewPDF:'📄 عرض PDF', previewHTML:'👁️ معاينة HTML', backDash:'→ العودة للوحة التحكم',
    sectionsGen:'الأقسام المُنشأة:',
    genSteps:['تحليل ملف مخاطر الوجهة...','جمع المعلومات الاستخباراتية الجيوسياسية...','مراجعة التنبيهات الصحية...','إنشاء تفاصيل المؤتمر...','بناء الوفد وجدول الأعمال...','تجميع المتحدثين والاجتماعات الثنائية...','إضافة القنصلية والطقس وأوقات الصلاة...','اكتمال هيكل التقرير...'],
    sections:[['🎯','أهداف الزيارة'],['📅','أيام جدول الأعمال'],['👥','أعضاء الوفد'],['🎤','المتحدثون الرئيسيون'],['🤝','الاجتماعات الثنائية'],['🔷','مسارات المؤتمر'],['📋','إجمالي الجلسات'],['🌤️','أيام الطقس'],['🕌','مواقيت الصلاة']],
    speakersSuffix:'متحدث', meetingsSuffix:'اجتماع',
  },
  en: {
    pageTitle:'Create New Executive Report',
    pageSubtitle:'Enter mission details and the AI assistant will generate a professional data-driven report draft.',
    stepsLabel:'Progress',
    steps:['Event Details','Location','Schedule','Generate Draft'],
    stepsSubDone:'Complete', stepsSubActive:'Entering...',
    step1:'Step 1', step2:'Step 2', step3:'Step 3',
    eventDetails:'Event Details',
    eventName:'Event Name', eventNamePH:'e.g., Milken Institute Global Conference 2026',
    eventType:'Event Type', eventTypePH:'Select event type',
    reportLang:'Report Language', langAr:'Arabic (العربية)', langEn:'English',
    eventWebsite:'Event Website (optional)', websitePH:'https://event-website.com',
    location:'Location',
    country:'Country', countryPH:'e.g., Saudi Arabia',
    city:'City', cityPH:'e.g., Riyadh',
    venue:'Venue', venuePH:'e.g., Convention Center',
    datesTitle:'Event Dates',
    startDate:'Start Date', endDate:'End Date',
    contextTitle:'Additional Context', contextLabel:'Notes for AI assistant',
    contextPH:'Add any relevant context or specific objectives for this report...',
    generate:'Create Report', cancel:'Cancel', generating:'Creating...',
    tipsTitle:'Report Tips',
    tipsBody:'For best results, add precise details about trip objectives and the parties you will be meeting.',
    tipsList:['Use professional, direct language','Define recommendations clearly'],
    aiChatLabel:'Live Chat (AI)', aiChatPH:'Analyzing your request...',
    dir:'ltr',
    required:'Please fill in: Event Name, City, Country, and Start Date.',
    genTitle:'Generating Your Report', genSubtitle:'AI is compiling a complete intelligence briefing...',
    doneTitle:'Report Generated!',
    viewPDF:'📄 View PDF', previewHTML:'👁️ Preview HTML', backDash:'← Back to Dashboard',
    sectionsGen:'Sections Generated:',
    genSteps:['Analyzing destination risk profile...','Collecting geopolitical intelligence...','Reviewing WHO health advisories...','Generating conference details...','Building delegation and agenda...','Compiling speakers and bilateral meetings...','Adding consulate, weather & prayer times...','Finalizing report structure...'],
    sections:[['🎯','Visit Objectives'],['📅','Agenda Days'],['👥','Delegation Members'],['🎤','Key Speakers'],['🤝','Bilateral Meetings'],['🔷','Conference Tracks'],['📋','Sessions Total'],['🌤️','Weather Days'],['🕌','Prayer Entries']],
    speakersSuffix:'speakers', meetingsSuffix:'meetings',
  },
};

// ─── Tokens ───────────────────────────────────────────────
const NAV   = '#1e1b4b';
const FONT  = "'Cairo',sans-serif";
const BORD  = '#e2e8f0';

// ─── Input style ─────────────────────────────────────────
const inp = (dir='rtl') => ({
  width:'100%', padding:'10px 13px', border:`1.5px solid ${BORD}`,
  borderRadius:9, fontSize:13, color:'#0f172a', background:'white',
  outline:'none', fontFamily:FONT, boxSizing:'border-box',
  direction:dir, transition:'border-color 0.15s',
});
const onFoc = e => { e.target.style.borderColor='#6366f1'; };
const onBlr = e => { e.target.style.borderColor=BORD; };
const selS  = dir => ({ ...inp(dir), WebkitAppearance:'menulist', MozAppearance:'menulist', appearance:'menulist', cursor:'pointer' });

// ─── Field label ─────────────────────────────────────────
const FL = ({ t, req }) => (
  <div style={{ fontSize:12.5, fontWeight:700, color:'#374151', marginBottom:6, fontFamily:FONT }}>
    {t} {req && <span style={{ color:'#ef4444' }}>*</span>}
  </div>
);

// ─── Step card — matches screenshot: step badge left, title right ──
function StepCard({ step, icon, title, children, dir }) {
  return (
    <div style={{ background:'white', borderRadius:14, border:`1.5px solid ${BORD}`, boxShadow:'0 1px 6px rgba(0,0,0,0.04)', marginBottom:14, overflow:'hidden' }}>
      {/* top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:`1px solid #f1f5f9`, direction:dir }}>
        {/* step badge — appears on the "end" side in RTL */}
        {step ? (
          <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', background:'#f8fafc', border:`1px solid #e8edf4`, borderRadius:6, padding:'3px 9px', fontFamily:FONT }}>
            {step}
          </span>
        ) : <span/>}
        {/* section title on the "start" side (right in RTL) */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14.5, fontWeight:800, color:'#1e293b', fontFamily:FONT }}>{title}</span>
          <span style={{ fontSize:17 }}>{icon}</span>
        </div>
      </div>
      <div style={{ padding:'18px 20px' }}>{children}</div>
    </div>
  );
}

// ─── Left Stepper panel ──────────────────────────────────
function Stepper({ l, currentStep }) {
  return (
    <div style={{ width:218, flexShrink:0, direction:'rtl' }}>
      {/* header */}
      <div style={{ fontSize:10.5, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:18, fontFamily:FONT }}>
        {l.stepsLabel}
      </div>

      {/* steps */}
      {l.steps.map((step, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const future = i > currentStep;
        return (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, direction:'rtl' }}>
            {/* circle + connector col */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:12, fontFamily:FONT,
                background: done ? '#22c55e' : active ? NAV : 'white',
                color:      done ? 'white'  : active ? 'white' : '#94a3b8',
                border: future ? `2px solid #e2e8f0` : 'none',
                boxShadow: active ? '0 3px 12px rgba(30,27,75,0.3)' : 'none',
              }}>
                {done
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1}
              </div>
              {i < l.steps.length - 1 && (
                <div style={{ width:2, height:32, marginTop:3, background: done ? '#22c55e' : '#e8edf4', borderRadius:2 }}/>
              )}
            </div>
            {/* text */}
            <div style={{ paddingTop:5, paddingBottom: i < l.steps.length - 1 ? 28 : 0 }}>
              <div style={{ fontSize:13, fontWeight: active ? 800 : done ? 700 : 500, color: future ? '#b0bec5' : '#1e293b', fontFamily:FONT, lineHeight:1.2 }}>
                {step}
              </div>
              {(done || active) && (
                <div style={{ fontSize:11, color: done ? '#22c55e' : '#94a3b8', marginTop:2, fontFamily:FONT }}>
                  {done ? l.stepsSubDone : l.stepsSubActive}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Tips card */}
      <div style={{ marginTop:26, borderRadius:13, background:NAV, padding:'16px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, direction:l.dir||'rtl' }}>
          <span style={{ fontSize:16 }}>💡</span>
          <span style={{ fontWeight:800, fontSize:13, color:'white', fontFamily:FONT }}>{l.tipsTitle}</span>
        </div>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.65, fontFamily:FONT, direction:l.dir||'rtl', margin:'0 0 12px' }}>
          {l.tipsBody}
        </p>
        {l.tipsList.map((tip, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, direction:l.dir||'rtl' }}>
            <div style={{ width:17, height:17, borderRadius:5, background:'rgba(99,102,241,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.8)', fontFamily:FONT }}>{tip}</span>
          </div>
        ))}
      </div>

      {/* AI mini widget */}
      <div style={{ marginTop:12, borderRadius:12, background:'white', border:`1px solid ${BORD}`, padding:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9, direction:l.dir||'rtl' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'#374151', fontFamily:FONT }}>{l.aiChatLabel}</span>
        </div>
        <div style={{ background:'#f8fafc', borderRadius:8, padding:'9px 11px', fontSize:12, color:'#94a3b8', fontFamily:FONT, direction:l.dir||'rtl', border:`1px solid ${BORD}`, minHeight:38 }}>
          {l.aiChatPH}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────
export default function NewReportForm({ onSuccess, onCancel, lang = 'ar' }) {
  const l       = L[lang] || L.ar;
  const isAr    = lang === 'ar';
  const dir     = isAr ? 'rtl' : 'ltr';
  const eTypes  = isAr ? EVENT_TYPES_AR : EVENT_TYPES_EN;

  const [form, setForm] = useState({
    title:'', event_name:'', event_type: eTypes[0],
    language: isAr ? 'Arabic' : 'English',
    event_website:'', city:'', country:'', venue:'',
    start_date:'', end_date:'', context:'',
    traveler_name:'Dr. Hisham Al Jadhey',
    traveler_title:'الرئيس التنفيذي للهيئة العامة للغذاء والدواء',
    agenda_speakers_url: '',
    speakers_url:        '',
  });
  const [phase,        setPhase]        = useState('form');
  const [genStep,      setGenStep]      = useState('');
  const [report,       setReport]       = useState(null);
  const [error,        setError]        = useState('');
  const [previewMode,  setPreviewMode]  = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef    = useRef(false);
  const createdReportRef = useRef(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Dynamic step derived from form completion
  const currentStep = !form.event_name ? 0 : !form.city || !form.country ? 1 : !form.start_date ? 2 : 3;

  const handleGenerate = async () => {
    if (submittingRef.current) return;
    if (!form.event_name || !form.city || !form.country || !form.start_date) { setError(l.required); return; }
    submittingRef.current = true; setIsSubmitting(true); setError(''); setPhase('generating');
    let idx = 0;
    const iv = setInterval(() => { setGenStep(l.genSteps[idx % l.genSteps.length]); idx++; }, 700);
    try {
      const payload = { ...form, title: form.title || form.event_name };
      let rep = createdReportRef.current;
      if (!rep) { const r = await createReport(payload); rep = r.data; createdReportRef.current = rep; }
      setGenStep(isAr ? 'استدعاء الذكاء الاصطناعي...' : 'Calling AI...');
      const genRes = await generateAI(rep.id);
      const full = genRes.data.report;
      clearInterval(iv); setReport(full); setPhase('done'); onSuccess(full);
    } catch (e) {
      clearInterval(iv);
      const data = e.response?.data;
      let raw = data && typeof data==='object' && !data.error && !data.detail
        ? Object.entries(data).map(([f,errs])=>`${f}: ${Array.isArray(errs)?errs.join(', '):String(errs)}`).join(' | ')
        : data?.error || data?.detail || data?.message || e.message || 'Failed.';
      setError(raw.includes('API_KEY')||raw.includes('Authentication') ? '⚠️ API key missing.'
        : raw.includes('quota')||raw.includes('billing') ? '⚠️ API quota exceeded.'
        : e.response?.status===400 ? `⚠️ Validation error — ${raw}` : `⚠️ ${raw}`);
      setPhase('form');
    } finally { submittingRef.current = false; setIsSubmitting(false); }
  };

  // ── Preview overlay ──────────────────────────────────────
  if (previewMode && report) {
    const url = previewMode==='pdf' ? getPDFUrl(report.id) : getPreviewUrl(report.id);
    return (
      <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.75)', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'#0d1829', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ color:'white', fontSize:14, fontWeight:700, fontFamily:FONT }}>{report.event_name}</span>
          <div style={{ display:'flex', gap:8 }}>
            <a href={getPDFUrl(report.id)} download style={{ padding:'7px 16px', background:NAV, color:'white', borderRadius:7, fontSize:12, fontWeight:600, textDecoration:'none', fontFamily:FONT }}>⬇</a>
            <button onClick={()=>setPreviewMode(null)} style={{ padding:'7px 16px', background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:7, fontSize:12, cursor:'pointer', fontFamily:FONT }}>✕</button>
          </div>
        </div>
        <iframe src={url} title="Preview" style={{ flex:1, border:'none', background:'white' }}/>
      </div>
    );
  }

  // ── Generating ───────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:22, direction:dir, fontFamily:FONT }}>
        <style>{`@keyframes nrf-spin{to{transform:rotate(360deg)}} @keyframes nrf-progress{from{width:0}to{width:95%}} @keyframes nrf-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        <div style={{ width:68, height:68, borderRadius:18, background:NAV, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, boxShadow:'0 8px 28px rgba(30,27,75,0.4)' }}>
          <span style={{ animation:'nrf-pulse 1.6s ease infinite' }}>✦</span>
        </div>
        <div style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 8px', fontFamily:FONT }}>{l.genTitle}</h2>
          <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>{l.genSubtitle}</p>
        </div>
        <div style={{ background:'white', borderRadius:14, padding:'18px 28px', border:`1.5px solid ${BORD}`, minWidth:360, textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:14 }}>
            <span style={{ animation:'nrf-spin 1s linear infinite', fontSize:18 }}>⏳</span>
            <span style={{ fontSize:13, color:'#334155', fontWeight:600, fontFamily:FONT }}>{genStep}</span>
          </div>
          <div style={{ background:'#f1f5f9', borderRadius:8, height:6, overflow:'hidden' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${NAV},#6366f1)`, animation:'nrf-progress 30s linear forwards', borderRadius:8 }}/>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────
  if (phase === 'done' && report) {
    const counts = [
      report.visit_objectives?.length, report.agenda?.length, report.delegation?.length,
      report.speakers?.length, report.bilateral_meetings?.length, report.conference_tracks?.length,
      (report.sessions?.day1?.length||0)+(report.sessions?.day2?.length||0)+(report.sessions?.day3?.length||0),
      report.weather?.length, report.prayer_times?.length,
    ];
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, padding:'40px 20px', direction:dir, fontFamily:FONT }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'#e8fdf2', border:'2px solid #a7f0c4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>✅</div>
        <div style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 8px', fontFamily:FONT }}>{l.doneTitle}</h2>
          <p style={{ color:'#64748b', fontSize:13, margin:0 }}><strong>{report.event_name}</strong> · {report.city}, {report.country}</p>
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          {[
            { label:l.viewPDF, action:()=>setPreviewMode('pdf'), primary:true },
            { label:l.previewHTML, action:()=>setPreviewMode('html'), primary:false },
            { label:l.backDash, action:onCancel, primary:false },
          ].map(({ label, action, primary }) => (
            <button key={label} onClick={action}
              style={{ padding:'12px 26px', background: primary?NAV:'white', color: primary?'white':'#1c3370', border: primary?'none':`1.5px solid ${primary?'transparent':'#1c3370'}`, borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT, boxShadow: primary?'0 4px 16px rgba(30,27,75,0.3)':'none' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ background:'white', borderRadius:14, border:`1.5px solid ${BORD}`, maxWidth:520, width:'100%', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ background:NAV, padding:'12px 20px' }}>
            <span style={{ color:'white', fontWeight:800, fontSize:14, fontFamily:FONT }}>{l.sectionsGen}</span>
          </div>
          <div style={{ padding:'8px 20px' }}>
            {l.sections.map(([ico, lbl], i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<l.sections.length-1?`1px solid #f1f5f9`:'none', fontSize:13, fontFamily:FONT }}>
                <span style={{ color:'#334155' }}>{ico} {lbl}</span>
                <span style={{ background:'#eff6ff', color:'#1c3370', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:800 }}>{counts[i]||0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ direction:dir, fontFamily:FONT }}>
      <style>{`@keyframes nrf-spin{to{transform:rotate(360deg)}} @keyframes nrf-progress{from{width:0}to{width:95%}}`}</style>

      <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>

        {/* LEFT PANEL — stepper */}
        <Stepper l={l} currentStep={currentStep} />

        {/* MAIN FORM */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Page hero */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:50, height:50, borderRadius:13, background:'#f1f5f9', border:`1px solid ${BORD}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, margin:'0 auto 14px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
              📊
            </div>
            <h2 style={{ margin:'0 0 7px', fontSize:22, fontWeight:900, color:'#0f172a', fontFamily:FONT, letterSpacing:isAr?0:'-0.02em' }}>
              {l.pageTitle}
            </h2>
            <p style={{ margin:0, fontSize:13, color:'#94a3b8', lineHeight:1.65, maxWidth:460, marginInline:'auto', fontFamily:FONT }}>
              {l.pageSubtitle}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid rgba(239,68,68,0.22)', borderRadius:10, padding:'11px 15px', marginBottom:14, color:'#dc2626', fontSize:13, fontFamily:FONT, display:'flex', gap:8, alignItems:'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* ══ STEP 1 — Event Details ══════════════════════ */}
          <StepCard step={l.step1} icon="📅" title={l.eventDetails} dir={dir}>
            {/* Event name */}
            <div style={{ marginBottom:14 }}>
              <FL t={l.eventName} req/>
              <input style={inp(dir)} placeholder={l.eventNamePH} value={form.event_name} onChange={set('event_name')} onFocus={onFoc} onBlur={onBlr}/>
            </div>
            {/* Type + Lang */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <FL t={l.eventType}/>
                <select style={selS(dir)} value={form.event_type} onChange={set('event_type')}>
                  <option value="">{l.eventTypePH}</option>
                  {eTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <FL t={l.reportLang} req/>
                <select style={selS(dir)} value={form.language} onChange={set('language')}>
                  <option value="Arabic">{l.langAr}</option>
                  <option value="English">{l.langEn}</option>
                </select>
              </div>
            </div>
            {/* Website */}
            <div>
              <FL t={l.eventWebsite}/>
              <div style={{ position:'relative' }}>
                <input style={{ ...inp(dir), paddingInlineEnd:36 }} placeholder={l.websitePH} value={form.event_website} onChange={set('event_website')} onFocus={onFoc} onBlur={onBlr}/>
                <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', [isAr?'left':'right']:12, color:'#94a3b8', fontSize:15, pointerEvents:'none' }}>🔗</span>
              </div>
            </div>
            {/* Speaker & Agenda URLs */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
              <div>
                <FL t={isAr ? 'رابط جدول الأعمال / المتحدثين (اختياري)' : 'Agenda / Speakers URL (optional)'}/>
                <input style={inp(dir)} placeholder="https://..." value={form.agenda_speakers_url} onChange={set('agenda_speakers_url')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
              <div>
                <FL t={isAr ? 'رابط صفحة المتحدثين (اختياري)' : 'Speakers Page URL (optional)'}/>
                <input style={inp(dir)} placeholder="https://..." value={form.speakers_url} onChange={set('speakers_url')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
            </div>
          </StepCard>

          {/* ══ STEP 2 — Location ════════════════════════════ */}
          <StepCard step={l.step2} icon="📍" title={l.location} dir={dir}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
              <div>
                <FL t={l.country} req/>
                <select style={selS(dir)} value={form.country} onChange={set('country')}>
                  <option value="">{l.countryPH}</option>
                  {COUNTRIES.map(c => { const v=isAr?c.ar:c.en; return <option key={c.en} value={v}>{v}</option>; })}
                </select>
              </div>
              <div>
                <FL t={l.city} req/>
                <input style={inp(dir)} placeholder={l.cityPH} value={form.city} onChange={set('city')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
              <div>
                <FL t={l.venue}/>
                <input style={inp(dir)} placeholder={l.venuePH} value={form.venue} onChange={set('venue')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
            </div>
          </StepCard>

          {/* ══ STEP 3 — Dates + Context (side by side) ══════ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {/* Dates */}
            <StepCard step={l.step3} icon="📅" title={l.datesTitle} dir={dir}>
              <div style={{ marginBottom:14 }}>
                <FL t={l.startDate} req/>
                <input type="date" style={inp(dir)} value={form.start_date} onChange={set('start_date')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
              <div>
                <FL t={l.endDate}/>
                <input type="date" style={inp(dir)} value={form.end_date} onChange={set('end_date')} onFocus={onFoc} onBlur={onBlr}/>
              </div>
            </StepCard>

            {/* Context */}
            <StepCard step="" icon="💬" title={l.contextTitle} dir={dir}>
              <FL t={l.contextLabel}/>
              <textarea
                style={{ ...inp(dir), resize:'none', height:116, lineHeight:1.65 }}
                placeholder={l.contextPH} value={form.context} onChange={set('context')} onFocus={onFoc} onBlur={onBlr}
              />
            </StepCard>
          </div>

          {/* ══ ACTIONS ═══════════════════════════════════════ */}
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14, paddingTop:8, paddingBottom:36 }}>
            {/* Generate — dark navy, ✦ icon, matches screenshot */}
            <button onClick={handleGenerate} disabled={isSubmitting}
              style={{ padding:'13px 34px', background: isSubmitting?'#818cf8':NAV, color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:isSubmitting?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:9, boxShadow:'0 4px 20px rgba(30,27,75,0.35)', fontFamily:FONT, transition:'all 0.18s', opacity:isSubmitting?0.75:1 }}
              onMouseEnter={e=>{ if(!isSubmitting){ e.currentTarget.style.background='#2d2a6e'; e.currentTarget.style.transform='translateY(-1px)'; }}}
              onMouseLeave={e=>{ e.currentTarget.style.background=isSubmitting?'#818cf8':NAV; e.currentTarget.style.transform='none'; }}>
              {isSubmitting
                ? <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'nrf-spin 0.7s linear infinite'}}/>
                : <span style={{ fontSize:16 }}>✦</span>}
              {isSubmitting ? l.generating : l.generate}
            </button>
            {/* Cancel — plain text */}
            <button onClick={onCancel}
              style={{ padding:'13px 22px', background:'transparent', border:'none', color:'#64748b', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, borderRadius:10, transition:'color 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.color='#1e293b'; }}
              onMouseLeave={e=>{ e.currentTarget.style.color='#64748b'; }}>
              {l.cancel}
            </button>
          </div>

        </div>{/* /main */}
      </div>
    </div>
  );
}
