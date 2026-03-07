import { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ─── Design tokens ────────────────────────────────────────
const NAV_DARK    = '#1e1b4b';
const SECTION_BG  = 'linear-gradient(135deg,#0d1e3d 0%,#1c3370 60%,#1e4a9a 100%)';
const CARD_BORDER = '#e8edf4';
const SHADOW_CARD = '0 2px 12px rgba(0,0,0,0.06)';
const FONT        = "'Cairo',sans-serif";

// ─── Default data ─────────────────────────────────────────
const defaultData = {
  report_title: 'مشاركة معالي الرئيس التنفيذي في مؤتمر معهد ميلكن العالمي 4-6 مايو 2025م',
  report_subtitle: 'لوس انجلوس-الولايات المتحدة الامريكية',
  meeting_date: '4 – 6 مايو 2025',
  city: 'لوس أنجلوس- الولايات المتحدة الامريكية',
  visit_objectives: [
    'عرض التجربة التنظيمية السعودية في قطاع التقنية الحيوية بما يشمل الأطر التشريعية الحديثة وتسريع إجراءات التسجيل باستخدام الذكاء الاصطناعي.',
    'تعزيز حضور المملكة في المحافل الصحية والاستثمارية الدولية وبناء شراكات استراتيجية مع جهات تنظيمية ومؤسسات بحثية وشركات عالمية.',
    'الاستفادة من تجارب الاستثمار في الصناعات الصحية ودورها في دعم الابتكار وتعزيز جودة وسلامة المنتجات الحيوية.',
  ],
  delegation: [
    { name:'معالي الرئيس التنفيذي الدكتور/ هشام بن سعد الجضعي', title:'الرئيس التنفيذي', department:'الرئيس التنفيذي' },
    { name:'سعادة الأستاذة/ الآء بنت فؤاد سندي', title:'مساعد الرئيس لقطاع الشؤون التنفيذية', department:'الشؤون التنفيذية' },
    { name:'الاستاذة/ ابرار الصبيحي', title:'رئيس قسم المراسم', department:'الرئيس التنفيذي' },
  ],
  agenda_days: [
    {
      day_label:'اليوم الأول', date:'3 مايو 2025م',
      items:[
        { time:'6:00 ص', activity:'المغادرة من مطار الملك خالد الدولي', location:'الرياض' },
        { time:'16:05 م', activity:'الوصول الى مطار لوس انجلوس الدولي', location:'لوس انجلوس' },
        { time:'19:00م', activity:'جلسة اجتياز', location:'مقر الإقامة الفندقية للوفد' },
      ],
    },
    {
      day_label:'اليوم الثاني', date:'4 مايو 2025م',
      items:[
        { time:'8:00ص-20:00م', activity:'افتتاح الجلسة الحوارية', location:'فندق بيفرلي هيلتون – لوس أنجلوس' },
        { time:'12:30-14:30م', activity:'Leaders in Health', location:'فندق بيفرلي هيلتون' },
        { time:'15:00م-17:00م', activity:'ورشة عمل البيت السعودي', location:'لم يحدد' },
      ],
    },
    {
      day_label:'اليوم الثالث', date:'5 مايو 2025م',
      items:[{ time:'9:30ص-16:00م', activity:'افتتاح الجلسة الحوارية', location:'فندق بيفرلي هيلتون' }],
    },
    {
      day_label:'اليوم الرابع', date:'6 مايو 2025م',
      items:[
        { time:'10:00-11:00ص', activity:'The Roadmap to Longevity', location:'فندق بيفرلي هيلتون' },
        { time:'11:30ص-12:30م', activity:'Driving Investment into Health Innovations (Invite Only)', location:'فندق بيفرلي هيلتون' },
        { time:'16:40م', activity:'المغادرة من مطار لوس انجلوس الدولي', location:'لوس انجلوس' },
      ],
    },
  ],
  conference_responsible: 'السيد/ ريتشارد ديتيزيو',
  conference_responsible_title: 'الرئيس التنفيذي لمعهد ميلكن.',
  conference_overview: 'يُعد مؤتمر معهد ميلكن العالمي أحد أبرز المنصات الفكرية والاقتصادية في العالم ويُعقد سنويًا في مدينة لوس أنجلوس بالولايات المتحدة الأمريكية.',
  conference_slogan: '"نحو مستقبل مزدهر – Toward a Flourishing Future"',
  conference_dates: 'خلال الفترة من 4 إلى 7 مايو 2025.',
  conference_participants: 'أكثر من 4,000 مشارك من مختلف أنحاء العالم.',
  conference_speakers_count: 'ما يزيد عن 900 متحدث وقرابة 200 جلسة متخصصة.',
  conference_tracks: [
    'الوصول -الفرص -والتنقل الاقتصادي','الأعمال والصناعة','الطاقة والبيئة','الأسواق المالية',
    'الصحة والبحوث الطبية','رأس المال البشري- تطوير القوى العاملة- التعليم',
    'العلاقات الدولية والجيواقتصادية','العمل الخيري والأثر الاجتماعي','السياسات والتنظيمات',
    'الأمن والمخاطر','المجتمع والثقافة','التقنية والابتكار',
  ],
  prev_2023_outcomes: [
    'الذكاء الاصطناعي في الرعاية الصحية: تم التركيز على إمكانات الذكاء الاصطناعي في تحسين نظم الرعاية الصحية.',
    'الصحة العامة والوقاية: نوقشت استراتيجيات تعزيز الصحة العامة من خلال التركيز على الوقاية من الأمراض غير المعدية.',
  ],
  prev_2024_outcomes: [
    'مبادرات صحية جديدة: أستعرض المعهد عدة مبادرات تهدف إلى تشكيل مستقبل الصحة.',
    'التغير المناخي والاستدامة: تمت مناقشة المساهمات المالية لتحقيق أهداف الحد من الانبعاثات.',
  ],
  ksa_participation_2023: [
    'شارك معالي وزير الاقتصاد والتخطيط فيصل الإبراهيم في جلسة حوارية بعنوان "العولمة : نماذج جديدة في الابتكار والتكامل" في 1 مايو 2023.',
    'شارك معالي وزير الاستثمار خالد الفالح في جلسة بعنوان "السعودية : من الرؤية إلى الواقع" في 2 مايو 2023.',
  ],
  ksa_participation_2024: [
    'شارك معالي رئيس مجلس هيئة السوق المالية محمد القويز في جلسة بعنوان "أسواق رأس المال في السعودية".',
    'شاركت السيدة سارة السحيمي رئيسة مجلس إدارة مجموعة تداول السعودية كمتحدثة في المؤتمر.',
  ],
  key_speakers: [
    { name:'كريستالينا غورغييفا', role:'المدير العام لصندوق النقد الدولي (IMF)', linkedin_url:'' },
    { name:'أجاى بانغا', role:'رئيس البنك الدولي', linkedin_url:'' },
    { name:'جين فريزر', role:'الرئيس التنفيذي لشركة Citigroup', linkedin_url:'' },
    { name:'فرناندو حداد', role:'وزير المالية في البرازيل', linkedin_url:'' },
    { name:'خالد الفالح', role:'وزير الاستثمار، المملكة العربية السعودية', linkedin_url:'' },
    { name:'عبدالله بن عامر العيسى', role:'وزير الاتصالات وتقنية المعلومات، المملكة العربية السعودية', linkedin_url:'' },
    { name:'توني بلير', role:'رئيس الوزراء البريطاني السابق', linkedin_url:'' },
    { name:'إيلون ماسك', role:'المؤسس والرئيس التنفيذي لشركة Tesla', linkedin_url:'' },
  ],
  bilateral_meetings: [
    { entity:'', counterpart:'', date:'مايو 2025م', time:'', location:'', talking_points:['Opening Remark from the SFDA',"SFDA's Experience",'Q&A and discussion'] },
  ],
  consulate_phone:'0013104796000',
  consulate_email:'uscacon@mofa.gov.sa',
  consulate_hours:'من 9 صباحاً – حتى 4 مساءً',
  consulate_holidays:'السبت الجمعة',
  consulate_address:'The Royal Consulate General Of Saudi Arabia In Los Angeles California. 12400 Wilshire Blvd Suite 700 Los Angeles ,CA 90025',
  consul_general_name:'الأستاذ/ بندر بن فهد الزيد',
  consul_general_title:'القنصل العام للمملكة العربية السعودية في لوس أنجلوس',
  consul_appointment_since:'منذ 2023 حتى الآن',
  prayer_times: [
    { date:'4 مايو 2025م', day:'الاحد',   fajr:'4:45 AM', shurooq:'6:01 AM', dhuhr:'12:50 PM', asr:'4:33 PM', maghrib:'7:39 PM', isha:'8:56 PM' },
    { date:'5 مايو 2025م', day:'الاثنين', fajr:'4:43 AM', shurooq:'6:00 AM', dhuhr:'12:50 PM', asr:'4:33 PM', maghrib:'7:40 PM', isha:'8:57 PM' },
    { date:'6 مايو 2025م', day:'الثلاثاء',fajr:'4:42 AM', shurooq:'5:59 AM', dhuhr:'12:50 PM', asr:'4:33 PM', maghrib:'7:41 PM', isha:'8:58 PM' },
    { date:'7 مايو 2025م', day:'الاربعاء',fajr:'4:41 AM', shurooq:'5:58 AM', dhuhr:'12:50 PM', asr:'4:33 PM', maghrib:'7:42 PM', isha:'8:59 PM' },
  ],
  weather_days: [
    { day:'4', high:'19°', low:'12°' },{ day:'5', high:'19°', low:'12°' },
    { day:'6', high:'20°', low:'12°' },{ day:'7', high:'20°', low:'11°' },
  ],
};

// ─── Reusable primitives ──────────────────────────────────

/** Label */
const Lbl = ({ text }) => (
  <div style={{ fontSize:10.5, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6, fontFamily:FONT }}>
    {text}
  </div>
);

/** Input / Textarea */
const inpStyle = {
  width:'100%', padding:'9px 12px',
  border:`1.5px solid ${CARD_BORDER}`,
  borderRadius:9, fontSize:13, color:'#0f172a',
  background:'#f8fafc', outline:'none', fontFamily:FONT,
  boxSizing:'border-box', direction:'rtl', transition:'border-color 0.15s,background 0.15s',
};
const onFoc = e => { e.target.style.borderColor='#6366f1'; e.target.style.background='white'; };
const onBlr = e => { e.target.style.borderColor=CARD_BORDER; e.target.style.background='#f8fafc'; };

function Inp({ label, value, onChange, rows=1 }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <Lbl text={label}/>}
      {rows > 1
        ? <textarea rows={rows} style={{ ...inpStyle, resize:'vertical', lineHeight:1.65 }} value={value} onChange={e=>onChange(e.target.value)} onFocus={onFoc} onBlur={onBlr}/>
        : <input style={inpStyle} value={value} onChange={e=>onChange(e.target.value)} onFocus={onFoc} onBlur={onBlr}/>}
    </div>
  );
}

/** List field with add/remove */
function ListField({ label, items, onChange }) {
  const add    = () => onChange([...items, '']);
  const remove = i => onChange(items.filter((_,idx) => idx !== i));
  const update = (i,v) => { const a=[...items]; a[i]=v; onChange(a); };
  return (
    <div style={{ marginBottom:12 }}>
      <Lbl text={label}/>
      {items.map((item,i) => (
        <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
          <textarea rows={2} style={{ ...inpStyle, flex:1 }} value={item} onChange={e=>update(i,e.target.value)} onFocus={onFoc} onBlur={onBlr}/>
          <button onClick={()=>remove(i)}
            style={{ width:30, height:30, borderRadius:7, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:5 }}>
            ✕
          </button>
        </div>
      ))}
      <button onClick={add}
        style={{ padding:'7px 14px', background:'#eff6ff', color:'#1c3370', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
        + إضافة
      </button>
    </div>
  );
}

/** Section card with gradient header */
function Section({ icon, title, children }) {
  return (
    <div style={{ background:'white', borderRadius:14, border:`1px solid ${CARD_BORDER}`, boxShadow: SHADOW_CARD, marginBottom:16, overflow:'hidden' }}>
      <div style={{ background: SECTION_BG, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, direction:'rtl' }}>
        {icon && <span style={{ fontSize:16 }}>{icon}</span>}
        <span style={{ color:'white', fontWeight:800, fontSize:14, fontFamily:FONT }}>{title}</span>
      </div>
      <div style={{ padding:'20px 22px', direction:'rtl' }}>
        {children}
      </div>
    </div>
  );
}

/** Repeat block (member, meeting, etc.) */
function RepeatBlock({ label, index, onRemove, children }) {
  return (
    <div style={{ background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:12, padding:'16px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, direction:'rtl' }}>
        <span style={{ fontWeight:700, fontSize:13, color:'#1c3370', fontFamily:FONT }}>{label} {index+1}</span>
        <button onClick={onRemove}
          style={{ padding:'4px 12px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
          ✕ حذف
        </button>
      </div>
      {children}
    </div>
  );
}

/** Add button */
function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ padding:'9px 20px', background:'#eff6ff', color:'#1c3370', border:'1px solid #bfdbfe', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:16 }}>+</span> {label}
    </button>
  );
}

// ─── TABS ─────────────────────────────────────────────────
const TABS = [
  { id:'cover',     label:'الغلاف',            icon:'📋' },
  { id:'visit',     label:'الزيارة',            icon:'🎯' },
  { id:'delegation',label:'الوفد',              icon:'👥' },
  { id:'agenda',    label:'جدول الأعمال',       icon:'📅' },
  { id:'conference',label:'بيانات المؤتمر',     icon:'🏛️' },
  { id:'speakers',  label:'المتحدثون',          icon:'🎤' },
  { id:'bilateral', label:'اللقاءات الثنائية',  icon:'🤝' },
  { id:'consulate', label:'القنصلية',           icon:'🏢' },
  { id:'prayer',    label:'الطقس والصلاة',      icon:'🕌' },
];

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function MilkenForm() {
  const [data,           setData]           = useState(defaultData);
  const [loading,        setLoading]        = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error,          setError]          = useState('');
  const [activeTab,      setActiveTab]      = useState('cover');

  const set    = key => val => setData(p => ({ ...p, [key]: val }));
  const setNested = (key,idx,field) => val => setData(p => {
    const arr = [...p[key]]; arr[idx] = { ...arr[idx], [field]: val }; return { ...p, [key]: arr };
  });
  const updateAgenda = (di, field, val) => setData(p => {
    const arr=[...p.agenda_days]; arr[di]={...arr[di],[field]:val}; return {...p,agenda_days:arr};
  });
  const updateAgendaItem = (di,ii,field,val) => setData(p => {
    const arr=[...p.agenda_days]; arr[di]={...arr[di],items:[...arr[di].items]}; arr[di].items[ii]={...arr[di].items[ii],[field]:val}; return {...p,agenda_days:arr};
  });
  const updatePrayer  = (i,f,v) => setData(p => { const a=[...p.prayer_times]; a[i]={...a[i],[f]:v}; return {...p,prayer_times:a}; });
  const updateWeather = (i,f,v) => setData(p => { const a=[...p.weather_days]; a[i]={...a[i],[f]:v}; return {...p,weather_days:a}; });

  const handlePDF = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE}/generate-pdf/`, data, { responseType:'blob', headers:{'Content-Type':'application/json'} });
      const url = window.URL.createObjectURL(new Blob([res.data],{type:'application/pdf'}));
      const a = document.createElement('a'); a.href=url;
      a.setAttribute('download',`Milken_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch(e) { setError('خطأ في توليد PDF: '+(e.response?.data?.error||e.message)); }
    finally { setLoading(false); }
  };

  const handlePreview = async () => {
    setPreviewLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE}/preview-html/`, data, { headers:{'Content-Type':'application/json'} });
      const win = window.open('','_blank'); win.document.write(res.data); win.document.close();
    } catch(e) { setError('خطأ في المعاينة: '+e.message); }
    finally { setPreviewLoading(false); }
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', paddingBottom:60, direction:'rtl', fontFamily:FONT }}>

      {/* ── Page header ── */}
      <div style={{ background:'white', borderRadius:14, padding:'20px 24px', border:`1px solid ${CARD_BORDER}`, boxShadow: SHADOW_CARD, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', direction:'rtl' }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:900, color:'#0d1829', fontFamily:FONT }}>نموذج تقرير مؤتمر ميلكن</h2>
          <p style={{ margin:0, fontSize:12.5, color:'#94a3b8', fontFamily:FONT }}>قم بتعديل البيانات ثم أنشئ PDF أو معاينة HTML</p>
        </div>
        <div style={{ width:48, height:48, borderRadius:12, background: SECTION_BG, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 14px rgba(28,51,112,0.3)' }}>🏛️</div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:20, background:'white', borderRadius:12, padding:6, border:`1px solid ${CARD_BORDER}`, boxShadow: SHADOW_CARD }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{
              padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer',
              fontFamily:FONT, fontSize:12.5, fontWeight:600, transition:'all 0.15s',
              display:'flex', alignItems:'center', gap:5,
              background: activeTab===tab.id ? NAV_DARK : 'transparent',
              color:      activeTab===tab.id ? 'white'  : '#64748b',
            }}>
            <span style={{ fontSize:13 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB CONTENT ══════════════════════════════════════ */}

      {/* COVER */}
      {activeTab==='cover' && (
        <Section icon="📋" title="بيانات صفحة الغلاف">
          <Inp label="عنوان التقرير (الغلاف)" value={data.report_title} onChange={set('report_title')} rows={2}/>
          <Inp label="العنوان الفرعي (الغلاف)" value={data.report_subtitle} onChange={set('report_subtitle')}/>
        </Section>
      )}

      {/* VISIT */}
      {activeTab==='visit' && (
        <Section icon="🎯" title="المعلومات الأساسية للزيارة">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="تاريخ الاجتماع" value={data.meeting_date} onChange={set('meeting_date')}/>
            <Inp label="المدينة" value={data.city} onChange={set('city')}/>
          </div>
          <ListField label="أهداف الزيارة" items={data.visit_objectives} onChange={set('visit_objectives')}/>
        </Section>
      )}

      {/* DELEGATION */}
      {activeTab==='delegation' && (
        <Section icon="👥" title="قائمة الوفد المشارك بالزيارة">
          {data.delegation.map((m,i) => (
            <RepeatBlock key={i} label="عضو" index={i} onRemove={()=>setData(p=>({...p,delegation:p.delegation.filter((_,idx)=>idx!==i)}))}>
              <Inp label="الاسم"            value={m.name}       onChange={setNested('delegation',i,'name')}/>
              <Inp label="المنصب"           value={m.title}      onChange={setNested('delegation',i,'title')}/>
              <Inp label="القطاع / الإدارة" value={m.department} onChange={setNested('delegation',i,'department')}/>
            </RepeatBlock>
          ))}
          <AddBtn onClick={()=>setData(p=>({...p,delegation:[...p.delegation,{name:'',title:'',department:''}]}))} label="إضافة عضو"/>
        </Section>
      )}

      {/* AGENDA */}
      {activeTab==='agenda' && (
        <Section icon="📅" title="موجز جدول الأعمال">
          {data.agenda_days.map((day,di) => (
            <div key={di} style={{ background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:12, marginBottom:14, overflow:'hidden' }}>
              {/* Day header */}
              <div style={{ background:'#1e3a6e', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', direction:'rtl' }}>
                <span style={{ color:'white', fontWeight:800, fontSize:13.5, fontFamily:FONT }}>{day.day_label} — {day.date}</span>
              </div>
              <div style={{ padding:'14px 16px', direction:'rtl' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <Inp label="اليوم"   value={day.day_label} onChange={v=>updateAgenda(di,'day_label',v)}/>
                  <Inp label="التاريخ" value={day.date}      onChange={v=>updateAgenda(di,'date',v)}/>
                </div>
                {day.items.map((item,ii) => (
                  <div key={ii} style={{ background:'white', border:`1px solid ${CARD_BORDER}`, borderRadius:9, padding:'12px', marginBottom:8 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:10, marginBottom:6 }}>
                      <Inp label="الوقت"   value={item.time}     onChange={v=>updateAgendaItem(di,ii,'time',v)}/>
                      <Inp label="النشاط"  value={item.activity} onChange={v=>updateAgendaItem(di,ii,'activity',v)}/>
                      <Inp label="الموقع"  value={item.location} onChange={v=>updateAgendaItem(di,ii,'location',v)}/>
                    </div>
                    <button onClick={()=>{const arr=[...data.agenda_days];arr[di]={...arr[di],items:arr[di].items.filter((_,idx)=>idx!==ii)};setData(p=>({...p,agenda_days:arr}));}}
                      style={{ padding:'4px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>
                      ✕ حذف النشاط
                    </button>
                  </div>
                ))}
                <button onClick={()=>{const arr=[...data.agenda_days];arr[di]={...arr[di],items:[...arr[di].items,{time:'',activity:'',location:''}]};setData(p=>({...p,agenda_days:arr}));}}
                  style={{ padding:'6px 14px', background:'#eff6ff', color:'#1c3370', border:'1px solid #bfdbfe', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:FONT }}>
                  + إضافة نشاط
                </button>
              </div>
            </div>
          ))}
          <AddBtn onClick={()=>setData(p=>({...p,agenda_days:[...p.agenda_days,{day_label:'يوم جديد',date:'',items:[]}]}))} label="إضافة يوم"/>
        </Section>
      )}

      {/* CONFERENCE */}
      {activeTab==='conference' && (
        <Section icon="🏛️" title="بيانات المؤتمر">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="المسؤول (الاسم)"   value={data.conference_responsible}       onChange={set('conference_responsible')}/>
            <Inp label="المسؤول (المنصب)"  value={data.conference_responsible_title} onChange={set('conference_responsible_title')}/>
            <Inp label="تواريخ المؤتمر"     value={data.conference_dates}             onChange={set('conference_dates')}/>
            <Inp label="عدد المشاركين"      value={data.conference_participants}      onChange={set('conference_participants')}/>
          </div>
          <Inp label="نظرة عامة عن المؤتمر" value={data.conference_overview}     onChange={set('conference_overview')} rows={4}/>
          <Inp label="الشعار"              value={data.conference_slogan}          onChange={set('conference_slogan')}/>
          <Inp label="عدد المتحدثين والجلسات" value={data.conference_speakers_count} onChange={set('conference_speakers_count')}/>
          <ListField label="المحاور الرئيسية" items={data.conference_tracks}    onChange={set('conference_tracks')}/>
          <ListField label="مخرجات 2023"      items={data.prev_2023_outcomes}   onChange={set('prev_2023_outcomes')}/>
          <ListField label="مخرجات 2024"      items={data.prev_2024_outcomes}   onChange={set('prev_2024_outcomes')}/>
          <ListField label="مشاركات المملكة 2023" items={data.ksa_participation_2023} onChange={set('ksa_participation_2023')}/>
          <ListField label="مشاركات المملكة 2024" items={data.ksa_participation_2024} onChange={set('ksa_participation_2024')}/>
        </Section>
      )}

      {/* SPEAKERS */}
      {activeTab==='speakers' && (
        <Section icon="🎤" title="أبرز المتحدثين">
          {data.key_speakers.map((sp,i) => (
            <RepeatBlock key={i} label="متحدث" index={i} onRemove={()=>setData(p=>({...p,key_speakers:p.key_speakers.filter((_,idx)=>idx!==i)}))}>
              <Inp label="الاسم"          value={sp.name}         onChange={setNested('key_speakers',i,'name')}/>
              <Inp label="المنصب"         value={sp.role}         onChange={setNested('key_speakers',i,'role')}/>
              <Inp label="رابط LinkedIn"  value={sp.linkedin_url} onChange={setNested('key_speakers',i,'linkedin_url')}/>
            </RepeatBlock>
          ))}
          <AddBtn onClick={()=>setData(p=>({...p,key_speakers:[...p.key_speakers,{name:'',role:'',linkedin_url:''}]}))} label="إضافة متحدث"/>
        </Section>
      )}

      {/* BILATERAL */}
      {activeTab==='bilateral' && (
        <Section icon="🤝" title="اللقاءات الثنائية">
          {data.bilateral_meetings.map((m,i) => (
            <RepeatBlock key={i} label="لقاء" index={i} onRemove={()=>setData(p=>({...p,bilateral_meetings:p.bilateral_meetings.filter((_,idx)=>idx!==i)}))}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Inp label="الجهة"        value={m.entity}      onChange={setNested('bilateral_meetings',i,'entity')}/>
                <Inp label="الطرف النظير" value={m.counterpart} onChange={setNested('bilateral_meetings',i,'counterpart')}/>
                <Inp label="التاريخ"      value={m.date}        onChange={setNested('bilateral_meetings',i,'date')}/>
                <Inp label="الوقت"        value={m.time}        onChange={setNested('bilateral_meetings',i,'time')}/>
                <Inp label="الموقع"       value={m.location}    onChange={setNested('bilateral_meetings',i,'location')}/>
              </div>
              <ListField
                label="نقاط الحديث"
                items={m.talking_points||[]}
                onChange={val=>setNested('bilateral_meetings',i,'talking_points')(val)}
              />
            </RepeatBlock>
          ))}
          <AddBtn onClick={()=>setData(p=>({...p,bilateral_meetings:[...p.bilateral_meetings,{entity:'',counterpart:'',date:'',time:'',location:'',talking_points:[]}]}))} label="إضافة لقاء"/>
        </Section>
      )}

      {/* CONSULATE */}
      {activeTab==='consulate' && (
        <Section icon="🏢" title="القنصلية السعودية — لوس أنجلوس">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="رقم الهاتف"      value={data.consulate_phone}    onChange={set('consulate_phone')}/>
            <Inp label="البريد الإلكتروني" value={data.consulate_email}  onChange={set('consulate_email')}/>
            <Inp label="ساعات العمل"     value={data.consulate_hours}    onChange={set('consulate_hours')}/>
            <Inp label="أيام العطلة"     value={data.consulate_holidays} onChange={set('consulate_holidays')}/>
          </div>
          <Inp label="العنوان" value={data.consulate_address} onChange={set('consulate_address')} rows={2}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="اسم القنصل العام"    value={data.consul_general_name}        onChange={set('consul_general_name')}/>
            <Inp label="منصب القنصل العام"   value={data.consul_general_title}       onChange={set('consul_general_title')}/>
            <Inp label="تاريخ التعيين"       value={data.consul_appointment_since}   onChange={set('consul_appointment_since')}/>
          </div>
        </Section>
      )}

      {/* PRAYER & WEATHER */}
      {activeTab==='prayer' && (
        <>
          {/* Weather */}
          <Section icon="🌤️" title="الطقس">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {data.weather_days.map((w,i) => (
                <div key={i} style={{ background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:10, padding:'12px' }}>
                  <Inp label="اليوم"         value={w.day}  onChange={v=>updateWeather(i,'day',v)}/>
                  <Inp label="أعلى درجة"     value={w.high} onChange={v=>updateWeather(i,'high',v)}/>
                  <Inp label="أدنى درجة"     value={w.low}  onChange={v=>updateWeather(i,'low',v)}/>
                </div>
              ))}
            </div>
          </Section>

          {/* Prayer */}
          <Section icon="🕌" title="مواقيت الصلاة">
            {data.prayer_times.map((pt,i) => (
              <div key={i} style={{ background:'#f8fafc', border:`1px solid ${CARD_BORDER}`, borderRadius:10, padding:'14px', marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1c3370', marginBottom:10, fontFamily:FONT }}>{pt.date} — {pt.day}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {['date','day','fajr','shurooq','dhuhr','asr','maghrib','isha'].map(field => (
                    <Inp key={field}
                      label={{ date:'التاريخ',day:'اليوم',fajr:'الفجر',shurooq:'الشروق',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء' }[field]}
                      value={pt[field]}
                      onChange={v=>updatePrayer(i,field,v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ══ ACTION BAR ═══════════════════════════════════════ */}
      <div style={{ background:'white', borderRadius:14, padding:'18px 22px', border:`1px solid ${CARD_BORDER}`, boxShadow: SHADOW_CARD, direction:'rtl' }}>
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid rgba(239,68,68,0.25)', borderRadius:9, padding:'10px 14px', marginBottom:14, color:'#dc2626', fontSize:13, fontFamily:FONT }}>
            {error}
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'flex-start', gap:12, flexWrap:'wrap' }}>
          {/* Preview */}
          <button onClick={handlePreview} disabled={previewLoading}
            style={{ padding:'11px 24px', background:'white', color:'#1c3370', border:`1.5px solid #1c3370`, borderRadius:10, fontSize:13, fontWeight:700, cursor: previewLoading?'not-allowed':'pointer', fontFamily:FONT, display:'flex', alignItems:'center', gap:7, transition:'all 0.15s', opacity: previewLoading?0.6:1 }}
            onMouseEnter={e=>{ if(!previewLoading){ e.currentTarget.style.background='#eff6ff'; }}}
            onMouseLeave={e=>{ e.currentTarget.style.background='white'; }}>
            {previewLoading
              ? <span style={{ width:13,height:13,border:'2px solid rgba(28,51,112,0.3)',borderTopColor:'#1c3370',borderRadius:'50%',display:'inline-block',animation:'nrf-spin 0.7s linear infinite' }}/>
              : '🔍'}
            {previewLoading ? 'جارٍ المعاينة...' : 'معاينة HTML'}
          </button>

          {/* Generate PDF */}
          <button onClick={handlePDF} disabled={loading}
            style={{ padding:'11px 28px', background: loading?'#818cf8':NAV_DARK, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor: loading?'not-allowed':'pointer', fontFamily:FONT, display:'flex', alignItems:'center', gap:7, boxShadow:'0 4px 14px rgba(30,27,75,0.3)', transition:'all 0.18s', opacity: loading?0.7:1 }}
            onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.background='#2d2a6e'; e.currentTarget.style.transform='translateY(-1px)'; }}}
            onMouseLeave={e=>{ e.currentTarget.style.background=loading?'#818cf8':NAV_DARK; e.currentTarget.style.transform='none'; }}>
            {loading
              ? <span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'nrf-spin 0.7s linear infinite' }}/>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            {loading ? 'جارٍ توليد PDF...' : 'توليد PDF وتنزيله'}
          </button>
        </div>

        <div style={{ marginTop:12, fontSize:11, color:'#94a3b8', fontFamily:FONT }}>
          📋 اسم الملف: Milken_Report_{new Date().toISOString().split('T')[0]}.pdf
        </div>
      </div>

      <style>{`@keyframes nrf-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
