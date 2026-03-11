import { useEffect, useRef, useState } from 'react';

const STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

// ISO numeric risk sets
const HIGH   = new Set([643,156,364,408,760,368,4,887,729,104,862,434,466,706,558,180]);
const MEDIUM = new Set([76,356,818,792,360,484,566,764,32,170,608,710,504,400,414,634,512,48,12,422,231,404,834,288,800,384]);
const LOW    = new Set([840,826,250,276,392,702,784,756,124,36,554,578,752,208,528,56,40,372,620,724,380,246,352,410,376,203,703,616,348,642,100,191,705,233,428,440,442,682,300]);

const ISO_NAME = {4:'Afghanistan',12:'Algeria',24:'Angola',32:'Argentina',36:'Australia',40:'Austria',48:'Bahrain',50:'Bangladesh',56:'Belgium',68:'Bolivia',76:'Brazil',100:'Bulgaria',104:'Myanmar',116:'Cambodia',120:'Cameroon',124:'Canada',144:'Sri Lanka',152:'Chile',156:'China',170:'Colombia',180:'DR Congo',191:'Croatia',203:'Czech Republic',208:'Denmark',218:'Ecuador',231:'Ethiopia',246:'Finland',250:'France',276:'Germany',288:'Ghana',300:'Greece',320:'Guatemala',324:'Guinea',340:'Honduras',348:'Hungary',356:'India',360:'Indonesia',364:'Iran',368:'Iraq',372:'Ireland',376:'Israel',380:'Italy',392:'Japan',398:'Kazakhstan',400:'Jordan',404:'Kenya',408:'North Korea',410:'South Korea',414:'Kuwait',422:'Lebanon',428:'Latvia',434:'Libya',440:'Lithuania',442:'Luxembourg',466:'Mali',484:'Mexico',496:'Mongolia',504:'Morocco',512:'Oman',528:'Netherlands',554:'New Zealand',558:'Nicaragua',566:'Nigeria',578:'Norway',586:'Pakistan',604:'Peru',608:'Philippines',616:'Poland',620:'Portugal',634:'Qatar',642:'Romania',643:'Russia',682:'Saudi Arabia',686:'Senegal',703:'Slovakia',705:'Slovenia',706:'Somalia',710:'South Africa',724:'Spain',729:'Sudan',752:'Sweden',756:'Switzerland',760:'Syria',764:'Thailand',784:'UAE',792:'Turkey',800:'Uganda',804:'Ukraine',826:'United Kingdom',840:'United States',858:'Uruguay',862:'Venezuela',704:'Vietnam',887:'Yemen'};
const NAME_ISO = Object.fromEntries(Object.entries(ISO_NAME).map(([k,v])=>[v,+k]));

function riskOf(name){const iso=NAME_ISO[name];if(!iso)return'none';if(HIGH.has(iso))return'high';if(MEDIUM.has(iso))return'medium';if(LOW.has(iso))return'low';return'none';}

const RISK = {
  low:   {label:'LOW RISK',   bg:'#dcfce7',color:'#16a34a',fill:'#22c55e'},
  medium:{label:'MEDIUM RISK',bg:'#fef9c3',color:'#ca8a04',fill:'#f59e0b'},
  high:  {label:'HIGH RISK',  bg:'#fee2e2',color:'#dc2626',fill:'#ef4444'},
  none:  {label:'',           bg:'#f1f5f9',color:'#64748b',fill:'#e5e7eb'},
};

const INTEL = {
  'United States': {desc:'Stable political environment with robust institutions',tags:['Strong healthcare infrastructure','Well-established regulatory framework','Active FDA collaboration'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'United Kingdom':{desc:'Advanced regulatory environment with strong bilateral ties',tags:['MHRA collaboration','Post-Brexit framework','Strong trade ties'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'France':        {desc:'Key EU regulatory hub with active pharmaceutical sector',tags:['EMA oversight','Strong pharma industry','EU market access'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Germany':       {desc:"Europe's largest economy with leading medtech industry",tags:['BfArM regulatory body','Major medtech hub','Strong KSA trade ties'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Switzerland':   {desc:'Neutral stance with premier pharmaceutical industry',tags:['Home to major pharma HQs','Swissmedic collaboration','WHO headquarters location'],advisory:'Exercise normal precautions',url:'https://www.eda.admin.ch',urlLabel:'Swiss Federal Dept. of Foreign Affairs'},
  'UAE':           {desc:'Strategic Gulf hub with Vision 2031 healthcare ambitions',tags:['DHA regulatory body','Vision 2031 alignment','Active SFDA collaboration'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Japan':         {desc:'Advanced regulatory framework with PMDA oversight',tags:['PMDA collaboration','Major biotech sector','Strong innovation'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Singapore':     {desc:'Asia-Pacific regulatory leader and biomedical hub',tags:['HSA regulatory body','ASEAN gateway','Biomedical research hub'],advisory:'Exercise normal precautions',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'China':         {desc:'Large market with complex regulatory environment',tags:['NMPA regulation','Complex market access','Geopolitical tensions'],advisory:'Exercise increased caution',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Russia':        {desc:'Significant geopolitical risk — ongoing international sanctions',tags:['Active conflict zones','Western sanctions','Restricted travel'],advisory:'Do not travel',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Brazil':        {desc:'Largest Latin American economy with ANVISA oversight',tags:['ANVISA regulatory body','Growing pharma market','Security considerations'],advisory:'Exercise increased caution',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'India':         {desc:'Major pharmaceutical producer with CDSCO regulation',tags:['CDSCO oversight','Generic drug leader','Growing biotech sector'],advisory:'Exercise increased caution',url:'https://travel.state.gov',urlLabel:'U.S. State Department'},
  'Saudi Arabia':  {desc:'Home country — SFDA headquarters',tags:['Regulatory authority','Vision 2030','SFDA HQ'],advisory:'Normal operations',url:'https://www.sfda.gov.sa',urlLabel:'SFDA'},
};

function getIntel(name){
  const base=INTEL[name]||{desc:`${name} — upcoming official visit`,tags:['Official delegation','Bilateral agenda'],advisory:'Consult your travel office',url:'https://travel.state.gov',urlLabel:'Travel Advisory'};
  return {...base, risk: riskOf(name)};
}

const COORDS = {'Los Angeles':{lat:34.05,lng:-118.24},'New York':{lat:40.71,lng:-74.01},'Washington':{lat:38.89,lng:-77.04},'London':{lat:51.51,lng:-0.13},'Paris':{lat:48.86,lng:2.35},'Berlin':{lat:52.52,lng:13.41},'Geneva':{lat:46.20,lng:6.15},'Davos':{lat:46.80,lng:9.84},'Zurich':{lat:47.38,lng:8.54},'Dubai':{lat:25.20,lng:55.27},'Abu Dhabi':{lat:24.47,lng:54.37},'Tokyo':{lat:35.68,lng:139.69},'Singapore':{lat:1.35,lng:103.82},'Beijing':{lat:39.91,lng:116.39},'Sydney':{lat:-33.87,lng:151.21},'Mumbai':{lat:19.08,lng:72.88},'Cairo':{lat:30.04,lng:31.24},'Riyadh':{lat:24.69,lng:46.72},'Brussels':{lat:50.85,lng:4.35},'Vienna':{lat:48.21,lng:16.37},'Toronto':{lat:43.65,lng:-79.38},'San Francisco':{lat:37.77,lng:-122.42},'Seoul':{lat:37.57,lng:126.98},'Bangkok':{lat:13.75,lng:100.52},'United States':{lat:37.09,lng:-95.71},'United Kingdom':{lat:51.51,lng:-0.13},'France':{lat:48.86,lng:2.35},'Germany':{lat:52.52,lng:13.41},'Japan':{lat:35.68,lng:139.69},'UAE':{lat:25.20,lng:55.27},'Saudi Arabia':{lat:24.69,lng:46.72},'Switzerland':{lat:46.82,lng:8.23},'Singapore':{lat:1.35,lng:103.82}};

function loadDeps(){
  return new Promise(res=>{
    let n=0; const done=()=>{if(++n===2)res();};
    if(window.maplibregl){done();}else{
      const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';document.head.appendChild(c);
      const s=document.createElement('script');s.src='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';s.onload=done;document.head.appendChild(s);
    }
    if(window.topojson){done();}else{
      const t=document.createElement('script');t.src='https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';t.onload=done;document.head.appendChild(t);
    }
  });
}

export default function WorldMap({upcomingReports=[]}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const [sel, setSel] = useState(null);

  const dests = [...new Map(upcomingReports.map(r=>[r.country,{country:r.country,city:r.city}])).values()].slice(0,8);

  useEffect(()=>{if(upcomingReports.length>0&&!sel)setSel(upcomingReports[0].country);},[upcomingReports]);

  useEffect(()=>{
    loadDeps().then(async ()=>{
      if(!ref.current||mapRef.current)return;
      const map=new window.maplibregl.Map({container:ref.current,style:STYLE,center:[15,22],zoom:1.55,minZoom:1,maxZoom:6,attributionControl:false,interactive:true});
      mapRef.current=map;

      const topo=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then(r=>r.json());
      const geo=window.topojson.feature(topo,topo.objects.countries);

      // Tag each feature with risk BEFORE adding to source
      geo.features.forEach(f=>{
        const n=parseInt(f.id);
        f.properties.risk=HIGH.has(n)?'high':MEDIUM.has(n)?'medium':LOW.has(n)?'low':'none';
        f.properties.name=ISO_NAME[n]||'';
      });

      map.on('load',()=>{
        map.resize();
        map.addSource('world',{type:'geojson',data:geo,generateId:false});

        // Base fill — uncolored countries (none)
        map.addLayer({id:'fill-none',type:'fill',source:'world',
          filter:['==',['get','risk'],'none'],
          paint:{'fill-color':'#e5e7eb','fill-opacity':0}});

        // Colored fills — one layer per risk to avoid expression issues
        map.addLayer({id:'fill-low',type:'fill',source:'world',
          filter:['==',['get','risk'],'low'],
          paint:{'fill-color':'#22c55e','fill-opacity':0.80}});

        map.addLayer({id:'fill-medium',type:'fill',source:'world',
          filter:['==',['get','risk'],'medium'],
          paint:{'fill-color':'#f59e0b','fill-opacity':0.80}});

        map.addLayer({id:'fill-high',type:'fill',source:'world',
          filter:['==',['get','risk'],'high'],
          paint:{'fill-color':'#ef4444','fill-opacity':0.80}});

        // White borders
        map.addLayer({id:'borders',type:'line',source:'world',
          paint:{'line-color':'#ffffff','line-width':0.6,'line-opacity':0.7}});

        // Hover highlight
        map.addLayer({id:'fill-hover',type:'fill',source:'world',
          paint:{'fill-color':'#0d1829','fill-opacity':0}});

        // Destination markers
        const pts=upcomingReports.map(r=>{const g=COORDS[r.city]||COORDS[r.country];if(!g)return null;return{type:'Feature',geometry:{type:'Point',coordinates:[g.lng,g.lat]},properties:{name:r.event_name||r.city,city:r.city,country:r.country}};}).filter(Boolean);
        if(pts.length){
          map.addSource('dots',{type:'geojson',data:{type:'FeatureCollection',features:pts}});
          map.addLayer({id:'dot-ring',type:'circle',source:'dots',paint:{'circle-radius':10,'circle-color':'transparent','circle-stroke-width':2,'circle-stroke-color':'#22c55e'}});
          map.addLayer({id:'dot-core',type:'circle',source:'dots',paint:{'circle-radius':4,'circle-color':'#22c55e'}});
        }

        const popup=new window.maplibregl.Popup({closeButton:false,offset:10,className:'ehp'});

        ['fill-low','fill-medium','fill-high'].forEach(lid=>{
          map.on('mousemove',lid,e=>{
            if(!e.features.length)return;
            const f=e.features[0];
            const name=f.properties.name;
            const r=f.properties.risk;
            if(!name||r==='none')return;
            map.getCanvas().style.cursor='pointer';
            const cfg=RISK[r];
            map.setPaintProperty('fill-hover','fill-opacity',['case',['==',['get','name'],name],0.18,0]);
            popup.setLngLat(e.lngLat).setHTML(`<div style="font-family:'Cairo',sans-serif;padding:9px 13px"><div style="font-weight:700;font-size:13px;color:#111827;margin-bottom:4px">${name}</div><span style="background:${cfg.bg};color:${cfg.color};padding:2px 9px;border-radius:20px;font-size:10.5px;font-weight:700">${cfg.label}</span></div>`).addTo(map);
          });
          map.on('mouseleave',lid,()=>{map.getCanvas().style.cursor='';map.setPaintProperty('fill-hover','fill-opacity',0);popup.remove();});
          map.on('click',lid,e=>{if(e.features.length&&e.features[0].properties.name)setSel(e.features[0].properties.name);});
        });

        if(pts.length){
          map.on('mouseenter','dot-core',e=>{map.getCanvas().style.cursor='pointer';const p=e.features[0].properties;popup.setLngLat(e.features[0].geometry.coordinates).setHTML(`<div style="font-family:'Cairo',sans-serif;padding:8px 12px"><b style="font-size:12px;color:#111827">${p.name}</b><br/><span style="font-size:11px;color:#6b7280">${p.city}·${p.country}</span></div>`).addTo(map);});
          map.on('mouseleave','dot-core',()=>{map.getCanvas().style.cursor='';popup.remove();});
        }
      });
    });
    return()=>{if(mapRef.current){mapRef.current.remove();mapRef.current=null;}};
  },[]);

  const intel = sel ? getIntel(sel) : null;
  const cfg   = intel ? (RISK[intel.risk]||RISK.none) : null;
  const isUp  = sel ? dests.some(d=>d.country===sel) : false;

  return (
    <div style={{background:'white',borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>

      {/* Header */}
      <div style={{padding:'14px 16px 8px',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
            <span style={{fontSize:15,color:'#16a34a'}}>⊕</span>
            <span style={{fontWeight:700,fontSize:15,color:'#111827',fontFamily:"'Cairo',sans-serif"}}>خريطة تقييم المخاطر الجيوسياسية في الوقت الفعلي</span>
          </div>
          <div style={{fontSize:11.5,color:'#0d9488',fontFamily:"'Cairo',sans-serif",paddingInlineStart:22}}>تقييم المخاطر الجيوسياسية لوجهات سفر الرئيس التنفيذي</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,fontSize:11,fontFamily:"'Cairo',sans-serif",color:'#6b7280',flexShrink:0}}>
          {[['#22c55e','Low Risk'],['#f59e0b','Medium'],['#ef4444','High Risk']].map(([c,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:'50%',background:c}}/>{l}</div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:'50%',border:'1.5px solid #f59e0b',background:'transparent'}}/>Upcoming Travel</div>
        </div>
      </div>

      {/* Map */}
      <div style={{padding:'0 12px 10px'}}>
        <div style={{borderRadius:10,overflow:'hidden',border:'1px solid #e5e7eb',height:360,position:'relative',background:'#f3f4f6'}}>
          <div ref={ref} style={{position:'absolute',inset:0}}/>
        </div>
      </div>

      {/* Destination chips */}
      {dests.length>0&&(
        <div style={{margin:'0 12px 10px',padding:'10px 14px',borderRadius:10,border:'1px solid #bbf7d0',background:'#f0fdf4'}}>
          <div style={{fontSize:11.5,fontWeight:700,color:'#16a34a',marginBottom:8,fontFamily:"'Cairo',sans-serif"}}>Upcoming CEO Travel Destinations</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {dests.map((d,i)=>(
              <div key={i} onClick={()=>setSel(d.country)} style={{display:'flex',alignItems:'center',gap:5,background:'white',border:`1.5px solid ${sel===d.country?'#22c55e':'#d1fae5'}`,borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:500,color:'#374151',fontFamily:"'Cairo',sans-serif",cursor:'pointer'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e'}}/>{d.country}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intel Card */}
      {intel&&(
        <div style={{margin:'0 12px 14px',borderRadius:12,border:'1px solid #e8edf4',background:'white',padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:42,height:42,borderRadius:10,background:cfg.fill,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:'#111827',fontFamily:"'Cairo',sans-serif"}}>{sel}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:2,fontFamily:"'Cairo',sans-serif"}}>{intel.desc}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
              <span style={{background:cfg.bg,color:cfg.color,borderRadius:20,padding:'3px 12px',fontSize:10.5,fontWeight:800,fontFamily:"'Cairo',sans-serif"}}>{cfg.label}</span>
              {isUp&&<span style={{background:'transparent',color:'#f59e0b',border:'1.5px solid #f59e0b',borderRadius:20,padding:'3px 12px',fontSize:10.5,fontWeight:700,fontFamily:"'Cairo',sans-serif"}}>Upcoming Travel</span>}
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:16,marginBottom:12}}>
            {intel.tags.map((t,i)=><span key={i} style={{fontSize:11.5,color:cfg.color,fontFamily:"'Cairo',sans-serif",fontWeight:500}}>{t}</span>)}
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid #f1f5f9',paddingTop:10}}>
            <div style={{fontSize:11.5,color:'#94a3b8',fontFamily:"'Cairo',sans-serif",display:'flex',alignItems:'center',gap:5}}>
              <span>⚠️</span><span style={{color:'#6b7280'}}>Travel Advisory:</span><span style={{color:'#0d9488'}}>{intel.advisory}</span>
            </div>
            <a href={intel.url} target="_blank" rel="noreferrer" style={{fontSize:11.5,color:'#374151',fontFamily:"'Cairo',sans-serif",fontWeight:500,textDecoration:'none',display:'flex',alignItems:'center',gap:4,border:'1px solid #e2e8f0',borderRadius:8,padding:'5px 10px'}}>
              ↗ Read more on {intel.urlLabel}
            </a>
          </div>
        </div>
      )}

      <style>{`.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right,.maplibregl-ctrl-top-right{display:none!important}.ehp .maplibregl-popup-content{border-radius:8px!important;padding:0!important;box-shadow:0 4px 20px rgba(0,0,0,0.12)!important;border:1px solid #e2e8f0!important}.ehp .maplibregl-popup-tip{display:none!important}`}</style>
    </div>
  );
}
