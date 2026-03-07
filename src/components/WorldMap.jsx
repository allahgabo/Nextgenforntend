import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

const W = 960, H = 310;
const RISK_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

const STATIC_MARKERS = [
  { city:'London',country:'UK',lat:51.5,lon:-0.12,risk:'low' },
  { city:'Paris',country:'France',lat:48.85,lon:2.35,risk:'medium' },
  { city:'Berlin',country:'Germany',lat:52.52,lon:13.4,risk:'low' },
  { city:'Moscow',country:'Russia',lat:55.75,lon:37.6,risk:'high' },
  { city:'Istanbul',country:'Turkey',lat:41.0,lon:28.97,risk:'medium' },
  { city:'Cairo',country:'Egypt',lat:30.06,lon:31.24,risk:'medium' },
  { city:'Riyadh',country:'Saudi Arabia',lat:24.7,lon:46.72,risk:'low' },
  { city:'Dubai',country:'UAE',lat:25.2,lon:55.27,risk:'low' },
  { city:'Tehran',country:'Iran',lat:35.69,lon:51.39,risk:'high' },
  { city:'Baghdad',country:'Iraq',lat:33.34,lon:44.4,risk:'high' },
  { city:'Mumbai',country:'India',lat:19.08,lon:72.88,risk:'low' },
  { city:'Beijing',country:'China',lat:39.9,lon:116.4,risk:'medium' },
  { city:'Tokyo',country:'Japan',lat:35.68,lon:139.69,risk:'low' },
  { city:'Seoul',country:'S. Korea',lat:37.57,lon:126.98,risk:'low' },
  { city:'Singapore',country:'Singapore',lat:1.35,lon:103.82,risk:'low' },
  { city:'Sydney',country:'Australia',lat:-33.87,lon:151.21,risk:'low' },
  { city:'New York',country:'USA',lat:40.71,lon:-74.0,risk:'low' },
  { city:'Los Angeles',country:'USA',lat:34.05,lon:-118.24,risk:'low' },
  { city:'Mexico City',country:'Mexico',lat:19.43,lon:-99.13,risk:'medium' },
  { city:'Nairobi',country:'Kenya',lat:-1.29,lon:36.82,risk:'medium' },
  { city:'Lagos',country:'Nigeria',lat:6.52,lon:3.38,risk:'high' },
  { city:'Kabul',country:'Afghanistan',lat:34.53,lon:69.17,risk:'high' },
  { city:'Kyiv',country:'Ukraine',lat:50.45,lon:30.52,risk:'high' },
  { city:'Bangkok',country:'Thailand',lat:13.75,lon:100.5,risk:'low' },
];

export default function WorldMap({ upcomingReports = [] }) {
  const [countries, setCountries] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState([0, 0]);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const ref = useRef(null);

  const proj = d3.geoNaturalEarth1().scale(143 * zoom).translate([W / 2 + pan[0], H / 2 + 10 + pan[1]]);
  const path = d3.geoPath().projection(proj);
  const graticule = d3.geoGraticule()();

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json()).then(topo => {
        const s = topo.transform?.scale || [1,1], t = topo.transform?.translate || [0,0];
        const dec = topo.arcs.map(a => { let x=0,y=0; return a.map(p => { x+=p[0]; y+=p[1]; return [x*s[0]+t[0], y*s[1]+t[1]]; }); });
        const arc = i => { const a = dec[i<0?~i:i]; return i<0?[...a].reverse():a; };
        const ring = al => al.flatMap(i => arc(i).slice(0,-1));
        const geom = o => {
          if (!o?.arcs) return null;
          if (o.type==='Polygon') return {type:'Polygon',coordinates:o.arcs.map(ring)};
          if (o.type==='MultiPolygon') return {type:'MultiPolygon',coordinates:o.arcs.map(r=>r.map(ring))};
          return null;
        };
        setCountries(topo.objects.countries.geometries.map(g=>({type:'Feature',id:g.id,geometry:geom(g)})).filter(f=>f.geometry));
      }).catch(()=>{});
  }, []);

  const onWheel = useCallback(e => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(8, z*(e.deltaY<0?1.15:0.87))));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const allMarkers = [
    ...STATIC_MARKERS,
    ...upcomingReports.map(r => ({ city:r.city, country:r.country, lat:r.lat||0, lon:r.lon||0, risk:r.risk_level||'low', upcoming:true, title:r.title }))
  ];

  return (
    <div ref={ref}
      style={{ position:'relative', background:'linear-gradient(160deg,#c8d8e8 0%,#b8ccd8 100%)', cursor:dragging?'grabbing':'grab', userSelect:'none', width:'100%', display:'block', lineHeight:0, margin:0, padding:0 }}
      onMouseDown={e=>{ setDragging(true); setDragStart([e.clientX-pan[0], e.clientY-pan[1]]); }}
      onMouseMove={e=>{ if(!dragging||!dragStart) return; setPan([e.clientX-dragStart[0], e.clientY-dragStart[1]]); }}
      onMouseUp={()=>{ setDragging(false); setDragStart(null); }}
      onMouseLeave={()=>{ setDragging(false); setDragStart(null); }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'100%', display:'block' }}>
        <defs>
          <linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8d8e8"/><stop offset="100%" stopColor="#b8ccd8"/>
          </linearGradient>
          <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2"/></filter>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)"/>
        <path d={path(graticule)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"/>
        {countries.map((f,i) => { const d=path(f); return d?<path key={i} d={d} fill="#cdd9e5" stroke="white" strokeWidth="0.5"/>:null; })}
        {allMarkers.map((city, i) => {
          const c = proj([city.lon, city.lat]);
          if (!c||c[0]<0||c[0]>W||c[1]<0||c[1]>H) return null;
          const [x,y] = c, col = RISK_COLORS[city.risk], isH = hovered===i;
          return (
            <g key={i} style={{cursor:'pointer'}} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
              {isH && <circle cx={x} cy={y} r={13} fill={col} opacity={0.12}/>}
              {city.upcoming && <circle cx={x} cy={y} r={isH?10:8} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.95}/>}
              <circle cx={x} cy={y} r={isH?6:4.5} fill={col} stroke="white" strokeWidth={1.2} filter="url(#shadow)" opacity={0.9}/>
            </g>
          );
        })}
        {hovered!==null && (() => {
          const city = allMarkers[hovered];
          const c = proj([city.lon, city.lat]);
          if (!c) return null;
          const [x,y] = c, tx=Math.min(x+14,W-150), ty=Math.max(y-58,4);
          return (
            <g pointerEvents="none">
              <rect x={tx-2} y={ty-2} width={148} height={city.upcoming?64:52} rx={7} fill="#0d1829" opacity={0.94}/>
              <text x={tx+8} y={ty+16} fill="white" fontSize={11} fontWeight={700}>{city.city}</text>
              <text x={tx+8} y={ty+29} fill="#94a3b8" fontSize={9.5}>{city.country}</text>
              <text x={tx+8} y={ty+45} fill={RISK_COLORS[city.risk]} fontSize={9.5} fontWeight={700}>
                {city.risk.charAt(0).toUpperCase()+city.risk.slice(1)} Risk{city.upcoming?' · Upcoming ✈':''}
              </text>
              {city.upcoming && <text x={tx+8} y={ty+58} fill="#60a5fa" fontSize={8.5}>{city.title?.slice(0,20)}...</text>}
            </g>
          );
        })()}
      </svg>
      <div style={{position:'absolute',top:12,right:12,display:'flex',flexDirection:'column',gap:2}}>
        {[['＋',()=>setZoom(z=>Math.min(z*1.4,8))],['－',()=>setZoom(z=>Math.max(z/1.4,0.5))],['↺',()=>{setZoom(1);setPan([0,0]);}]].map(([l,fn])=>(
          <button key={l} onClick={fn}
            style={{width:28,height:28,background:'white',border:'1px solid #e2e8f0',borderRadius:5,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',color:'#374151',fontWeight:600}}
            onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
            onMouseLeave={e=>e.currentTarget.style.background='white'}>{l}</button>
        ))}
      </div>
    </div>
  );
}
