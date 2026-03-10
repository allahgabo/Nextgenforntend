import { useEffect, useRef, useState } from 'react';

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

// ── Risk sets (ISO numeric) ───────────────────────────────
const HIGH_RISK_IDS   = [643,156,364,408,760,368,4,887,729,104,862,434,466,706,558,180];
const MEDIUM_RISK_IDS = [76,356,818,682,792,360,484,566,764,32,170,608,710,504,400,414,634,512,48,12,422,231,404,834,288,800,384];
const LOW_RISK_IDS    = [840,826,250,276,392,702,784,756,124,36,554,578,752,208,528,56,40,372,620,724,380,246,352,410,376,203,703,616,348,642,100,191,705,233,428,440,442,352];

const HIGH_SET   = new Set(HIGH_RISK_IDS);
const MEDIUM_SET = new Set(MEDIUM_RISK_IDS);
const LOW_SET    = new Set(LOW_RISK_IDS);

// ── ISO numeric → name ───────────────────────────────────
const ISO_TO_NAME = {
  4:'Afghanistan',12:'Algeria',24:'Angola',32:'Argentina',36:'Australia',
  40:'Austria',50:'Bangladesh',56:'Belgium',68:'Bolivia',76:'Brazil',
  100:'Bulgaria',104:'Myanmar',116:'Cambodia',120:'Cameroon',124:'Canada',
  144:'Sri Lanka',152:'Chile',156:'China',170:'Colombia',180:'DR Congo',
  191:'Croatia',203:'Czech Republic',208:'Denmark',218:'Ecuador',231:'Ethiopia',
  246:'Finland',250:'France',276:'Germany',288:'Ghana',300:'Greece',
  320:'Guatemala',324:'Guinea',340:'Honduras',348:'Hungary',356:'India',
  360:'Indonesia',364:'Iran',368:'Iraq',372:'Ireland',376:'Israel',
  380:'Italy',392:'Japan',398:'Kazakhstan',400:'Jordan',404:'Kenya',
  408:'North Korea',410:'South Korea',414:'Kuwait',422:'Lebanon',
  428:'Latvia',434:'Libya',440:'Lithuania',442:'Luxembourg',466:'Mali',
  484:'Mexico',496:'Mongolia',504:'Morocco',512:'Oman',528:'Netherlands',
  554:'New Zealand',558:'Nicaragua',566:'Nigeria',578:'Norway',
  586:'Pakistan',604:'Peru',608:'Philippines',616:'Poland',620:'Portugal',
  634:'Qatar',642:'Romania',643:'Russia',682:'Saudi Arabia',686:'Senegal',
  703:'Slovakia',705:'Slovenia',706:'Somalia',710:'South Africa',
  724:'Spain',729:'Sudan',752:'Sweden',756:'Switzerland',760:'Syria',
  764:'Thailand',784:'UAE',792:'Turkey',800:'Uganda',804:'Ukraine',
  826:'United Kingdom',840:'United States',858:'Uruguay',
  862:'Venezuela',704:'Vietnam',887:'Yemen',
};

// ── Country intel cards ───────────────────────────────────
const COUNTRY_INTEL = {
  'United States':  { risk:'low',    desc:'Stable political environment with robust institutions', tags:['Strong healthcare infrastructure','Well-established regulatory framework','Active FDA collaboration'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'United Kingdom': { risk:'low',    desc:'Advanced regulatory environment with strong bilateral ties', tags:['MHRA collaboration','Post-Brexit framework','Strong trade ties'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'France':         { risk:'low',    desc:'Key EU regulatory hub with active pharmaceutical sector', tags:['EMA oversight','Strong pharma industry','EU market access'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Germany':        { risk:'low',    desc:"Europe's largest economy with leading medtech industry", tags:['BfArM regulatory body','Major medtech hub','Strong KSA trade ties'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Switzerland':    { risk:'low',    desc:'Global hub for pharma and biotech with Swissmedic oversight', tags:['Swissmedic authority','Davos WEF venue','Major pharma HQs'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'UAE':            { risk:'low',    desc:'Strategic Gulf hub with Vision 2031 healthcare ambitions', tags:['DHA regulatory body','Vision 2031 alignment','Active SFDA collaboration'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Japan':          { risk:'low',    desc:'Advanced regulatory framework with PMDA oversight', tags:['PMDA collaboration','Major biotech sector','Strong innovation'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Singapore':      { risk:'low',    desc:'Asia-Pacific regulatory leader and biomedical hub', tags:['HSA regulatory body','ASEAN gateway','Biomedical research hub'], advisory:'Exercise normal precautions', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'China':          { risk:'high',   desc:'Large market with complex regulatory environment', tags:['NMPA regulation','Complex market access','Geopolitical tensions'], advisory:'Exercise increased caution', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Russia':         { risk:'high',   desc:'Significant geopolitical risk — ongoing international sanctions', tags:['Active conflict zones','Western sanctions','Restricted travel'], advisory:'Do not travel', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Iran':           { risk:'high',   desc:'High diplomatic tension and restricted access', tags:['Sanctions regime','Restricted entry','Diplomatic risk'], advisory:'Do not travel', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Brazil':         { risk:'medium', desc:'Largest Latin American economy with ANVISA oversight', tags:['ANVISA regulatory body','Growing pharma market','Security considerations'], advisory:'Exercise increased caution', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'India':          { risk:'medium', desc:'Major pharmaceutical producer with CDSCO regulation', tags:['CDSCO oversight','Generic drug leader','Growing biotech sector'], advisory:'Exercise increased caution', url:'https://travel.state.gov/content/travel/en/traveladvisories.html', urlLabel:'U.S. State Department' },
  'Saudi Arabia':   { risk:'low',    desc:'Home country — SFDA headquarters', tags:['SFDA HQ','Vision 2030','Regulatory authority'], advisory:'Normal operations', url:'https://www.sfda.gov.sa', urlLabel:'SFDA' },
};

const RISK_CFG = {
  low:    { label:'LOW RISK',    bg:'#dcfce7', color:'#16a34a', dot:'#22c55e', fill:'#22c55e' },
  medium: { label:'MEDIUM RISK', bg:'#fef9c3', color:'#ca8a04', dot:'#f59e0b', fill:'#f59e0b' },
  high:   { label:'HIGH RISK',   bg:'#fee2e2', color:'#dc2626', dot:'#ef4444', fill:'#ef4444' },
};

function getIntel(country) {
  return COUNTRY_INTEL[country] || { risk:'low', desc:`${country} — destination for upcoming official visit`, tags:['Official delegation','Bilateral agenda'], advisory:'Consult your travel office', url:'https://travel.state.gov', urlLabel:'Travel Advisory' };
}

const CITY_COORDS = {
  'Los Angeles':{'lat':34.05,'lng':-118.24},'New York':{'lat':40.71,'lng':-74.01},
  'Washington':{'lat':38.89,'lng':-77.04},'London':{'lat':51.51,'lng':-0.13},
  'Paris':{'lat':48.86,'lng':2.35},'Berlin':{'lat':52.52,'lng':13.41},
  'Geneva':{'lat':46.20,'lng':6.15},'Davos':{'lat':46.80,'lng':9.84},
  'Zurich':{'lat':47.38,'lng':8.54},'Dubai':{'lat':25.20,'lng':55.27},
  'Abu Dhabi':{'lat':24.47,'lng':54.37},'Tokyo':{'lat':35.68,'lng':139.69},
  'Singapore':{'lat':1.35,'lng':103.82},'Beijing':{'lat':39.91,'lng':116.39},
  'Sydney':{'lat':-33.87,'lng':151.21},'Mumbai':{'lat':19.08,'lng':72.88},
  'Cairo':{'lat':30.04,'lng':31.24},'Riyadh':{'lat':24.69,'lng':46.72},
  'Brussels':{'lat':50.85,'lng':4.35},'Vienna':{'lat':48.21,'lng':16.37},
  'Toronto':{'lat':43.65,'lng':-79.38},'San Francisco':{'lat':37.77,'lng':-122.42},
  'Chicago':{'lat':41.88,'lng':-87.63},'Seoul':{'lat':37.57,'lng':126.98},
  'Bangkok':{'lat':13.75,'lng':100.52},'Nairobi':{'lat':-1.29,'lng':36.82},
  'Mexico City':{'lat':19.43,'lng':-99.13},'São Paulo':{'lat':-23.55,'lng':-46.63},
  'United States':{'lat':37.09,'lng':-95.71},'United Kingdom':{'lat':51.51,'lng':-0.13},
  'France':{'lat':48.86,'lng':2.35},'Germany':{'lat':52.52,'lng':13.41},
  'Japan':{'lat':35.68,'lng':139.69},'UAE':{'lat':25.20,'lng':55.27},
  'Saudi Arabia':{'lat':24.69,'lng':46.72},'Switzerland':{'lat':46.82,'lng':8.23},
};

function loadDeps() {
  return new Promise((resolve) => {
    let loaded = 0;
    const done = () => { if (++loaded === 2) resolve(); };
    if (window.maplibregl) { done(); } else {
      const css = document.createElement('link'); css.rel='stylesheet';
      css.href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
      s.onload=done; document.head.appendChild(s);
    }
    if (window.topojson) { done(); } else {
      const t = document.createElement('script');
      t.src='https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
      t.onload=done; document.head.appendChild(t);
    }
  });
}

export default function WorldMap({ upcomingReports = [] }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const destinations = [...new Map(
    upcomingReports.map(r => [r.country, { country: r.country, city: r.city }])
  ).values()].slice(0, 8);

  useEffect(() => {
    if (upcomingReports.length > 0 && !selectedCountry)
      setSelectedCountry(upcomingReports[0].country);
  }, [upcomingReports]);

  useEffect(() => {
    loadDeps().then(async () => {
      if (!containerRef.current || mapRef.current) return;

      const map = new window.maplibregl.Map({
        container: containerRef.current,
        style: LIGHT_STYLE,
        center: [10, 20],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 6,
        attributionControl: false,
        interactive: true,
      });
      mapRef.current = map;

      const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
      const geojson = window.topojson.feature(topo, topo.objects.countries);

      // Pre-color each feature
      geojson.features.forEach(f => {
        const id = parseInt(f.id);
        if (HIGH_SET.has(id))        f.properties.risk = 'high';
        else if (MEDIUM_SET.has(id)) f.properties.risk = 'medium';
        else if (LOW_SET.has(id))    f.properties.risk = 'low';
        else                         f.properties.risk = 'none';
      });

      map.on('load', () => {
        map.resize();

        map.addSource('countries', { type: 'geojson', data: geojson });

        // Colored fill based on pre-tagged risk property
        map.addLayer({
          id: 'countries-fill',
          type: 'fill',
          source: 'countries',
          paint: {
            'fill-color': [
              'match', ['get', 'risk'],
              'high',   '#ef4444',
              'medium', '#f59e0b',
              'low',    '#22c55e',
              '#e5e7eb'
            ],
            'fill-opacity': [
              'case', ['==', ['get', 'risk'], 'none'], 0, 0.80
            ],
          },
        });

        // Borders
        map.addLayer({
          id: 'countries-border',
          type: 'line',
          source: 'countries',
          paint: { 'line-color': '#ffffff', 'line-width': 0.5, 'line-opacity': 0.6 },
        });

        // Hover highlight layer
        map.addLayer({
          id: 'countries-hover',
          type: 'fill',
          source: 'countries',
          paint: { 'fill-color': '#1c3370', 'fill-opacity': 0 },
        });

        // Destination markers
        const destFeatures = upcomingReports.map(r => {
          const geo = CITY_COORDS[r.city] || CITY_COORDS[r.country];
          if (!geo) return null;
          return { type:'Feature', geometry:{ type:'Point', coordinates:[geo.lng, geo.lat] }, properties:{ name: r.event_name || r.city, city: r.city, country: r.country } };
        }).filter(Boolean);

        if (destFeatures.length) {
          map.addSource('destinations', { type:'geojson', data:{ type:'FeatureCollection', features:destFeatures } });
          map.addLayer({ id:'dest-ring', type:'circle', source:'destinations', paint:{ 'circle-radius':10, 'circle-color':'transparent', 'circle-stroke-width':2, 'circle-stroke-color':'#22c55e', 'circle-stroke-opacity':0.9 } });
          map.addLayer({ id:'dest-dot',  type:'circle', source:'destinations', paint:{ 'circle-radius':4,  'circle-color':'#22c55e', 'circle-opacity':1 } });
        }

        // Shared popup
        const popup = new window.maplibregl.Popup({ closeButton:false, offset:10, className:'ehaata-map-popup' });

        // Hover + click on colored countries
        map.on('mousemove', 'countries-fill', (e) => {
          if (!e.features.length) return;
          map.getCanvas().style.cursor = 'pointer';
          const f = e.features[0];
          const id = parseInt(f.id);
          const name = ISO_TO_NAME[id] || '';
          const risk = f.properties.risk;
          if (risk === 'none' || !name) return;
          const cfg = RISK_CFG[risk];
          map.setPaintProperty('countries-hover','fill-opacity',['case',['==',['id'],f.id],0.2,0]);
          popup.setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:'Cairo',sans-serif;padding:9px 13px;min-width:140px"><div style="font-weight:700;font-size:13px;color:#0d1829;margin-bottom:3px">${name}</div><span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${cfg.label}</span></div>`)
            .addTo(map);
        });
        map.on('mouseleave', 'countries-fill', () => {
          map.getCanvas().style.cursor = '';
          map.setPaintProperty('countries-hover','fill-opacity', 0);
          popup.remove();
        });
        map.on('click', 'countries-fill', (e) => {
          if (!e.features.length) return;
          const id = parseInt(e.features[0].id);
          const name = ISO_TO_NAME[id];
          if (name) setSelectedCountry(name);
        });

        // Dest dot tooltip
        map.on('mouseenter', 'dest-dot', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const p = e.features[0].properties;
          popup.setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`<div style="font-family:'Cairo',sans-serif;padding:8px 12px"><div style="font-weight:700;font-size:12px;color:#0d1829">${p.name}</div><div style="font-size:11px;color:#64748b">${p.city} · ${p.country}</div></div>`)
            .addTo(map);
        });
        map.on('mouseleave', 'dest-dot', () => { map.getCanvas().style.cursor=''; popup.remove(); });
      });
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  return (
    <div style={{ background:'white', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 18px 10px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
            <span style={{ fontSize:16, color:'#16a34a' }}>⊕</span>
            <span style={{ fontWeight:700, fontSize:15, color:'#111827', fontFamily:"'Cairo',sans-serif" }}>
              خريطة تقييم المخاطر الجيوسياسية في الوقت الفعلي
            </span>
          </div>
          <div style={{ fontSize:11.5, color:'#0d9488', fontFamily:"'Cairo',sans-serif", paddingInlineStart:23 }}>
            تقييم المخاطر الجيوسياسية لوجهات سفر الرئيس التنفيذي
          </div>
        </div>
        {/* Legend */}
        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:11, fontFamily:"'Cairo',sans-serif", color:'#6b7280', flexShrink:0 }}>
          {[['#22c55e','Low Risk'],['#f59e0b','Medium'],['#ef4444','High Risk']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/>{l}
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', border:'2px solid #f59e0b', background:'transparent' }}/>
            Upcoming Travel
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ padding:'0 10px 10px' }}>
        <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb', background:'#f3f4f6', height:370, position:'relative' }}>
          <div ref={containerRef} style={{ position:'absolute', top:0, left:0, right:0, bottom:0 }} />
        </div>
      </div>

      {/* ── Destination chips ── */}
      {destinations.length > 0 && (
        <div style={{ margin:'0 10px 10px', padding:'10px 14px', borderRadius:10, border:'1px solid #99f6e4', background:'#f0fdfa' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#0d9488', marginBottom:8, fontFamily:"'Cairo',sans-serif" }}>
            Upcoming CEO Travel Destinations
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {destinations.map((d,i) => (
              <div key={i} onClick={() => setSelectedCountry(d.country)} style={{
                display:'flex', alignItems:'center', gap:6, background:'white',
                border:`1px solid ${selectedCountry===d.country?'#22c55e':'#d1fae5'}`,
                borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:500,
                color:'#374151', fontFamily:"'Cairo',sans-serif", cursor:'pointer',
              }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e' }}/>
                {d.country}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Country Intel Card ── */}
      {selectedCountry && (() => {
        const intel = getIntel(selectedCountry);
        const cfg   = RISK_CFG[intel.risk] || RISK_CFG.low;
        return (
          <div style={{ margin:'0 10px 12px', borderRadius:12, border:'1px solid #e8edf4', background:'white', padding:'16px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:cfg.fill, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#0d1829', fontFamily:"'Cairo',sans-serif" }}>{selectedCountry}</div>
                  <div style={{ fontSize:12.5, color:'#64748b', marginTop:2, fontFamily:"'Cairo',sans-serif" }}>{intel.desc}</div>
                </div>
              </div>
              <div style={{ background:cfg.bg, color:cfg.color, borderRadius:20, padding:'4px 14px', fontSize:11, fontWeight:800, fontFamily:"'Cairo',sans-serif", whiteSpace:'nowrap', border:`1px solid ${cfg.color}33` }}>
                {cfg.label}
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {intel.tags.map((tag,i) => (
                <span key={i} style={{ fontSize:11.5, color:cfg.color, background:cfg.bg, borderRadius:20, padding:'2px 10px', fontFamily:"'Cairo',sans-serif", fontWeight:500 }}>{tag}</span>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #f1f5f9', paddingTop:10 }}>
              <div style={{ fontSize:12, color:'#94a3b8', fontFamily:"'Cairo',sans-serif" }}>
                ⚠️ <span style={{ fontWeight:600, color:'#64748b' }}>Travel Advisory:</span> {intel.advisory}
              </div>
              <a href={intel.url} target="_blank" rel="noreferrer"
                style={{ fontSize:11.5, color:'#1c3370', fontFamily:"'Cairo',sans-serif", fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                ↗ Read more on {intel.urlLabel}
              </a>
            </div>
          </div>
        );
      })()}

      <style>{`
        .maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right,.maplibregl-ctrl-top-right{display:none!important}
        .ehaata-map-popup .maplibregl-popup-content{border-radius:8px!important;padding:0!important;box-shadow:0 4px 20px rgba(0,0,0,0.12)!important;border:1px solid #e2e8f0!important}
        .ehaata-map-popup .maplibregl-popup-tip{display:none!important}
      `}</style>
    </div>
  );
}
