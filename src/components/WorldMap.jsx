import { useEffect, useRef } from 'react';

// Modern WorldMap using MapLibre GL JS (free, no API key)
// Loaded via CDN script tag
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function loadMapLibre() {
  return new Promise((resolve) => {
    if (window.maplibregl) { resolve(window.maplibregl); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
    s.onload = () => resolve(window.maplibregl);
    document.head.appendChild(s);
  });
}

export default function WorldMap({ upcomingReports = [] }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  // Build GeoJSON from upcoming reports
  const buildGeoJSON = (reports) => ({
    type: 'FeatureCollection',
    features: reports.map(r => {
      const geo = CITY_COORDS[r.city] || CITY_COORDS[r.country];
      if (!geo) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [geo.lng, geo.lat] },
        properties: {
          name:    r.event_name || r.city,
          city:    r.city,
          country: r.country,
          status:  r.status,
          dates:   r.dates || '',
        },
      };
    }).filter(Boolean),
  });

  useEffect(() => {
    let map;
    loadMapLibre().then((maplibregl) => {
      if (!containerRef.current || mapRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style:     MAP_STYLE,
        center:    [20, 20],
        zoom:      1.6,
        minZoom:   1,
        maxZoom:   8,
        attributionControl: false,
        interactive: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        const geojson = buildGeoJSON(upcomingReports);

        // Add glow pulse layer
        map.addSource('reports', { type: 'geojson', data: geojson });

        // Outer glow
        map.addLayer({
          id: 'reports-glow',
          type: 'circle',
          source: 'reports',
          paint: {
            'circle-radius': 18,
            'circle-color': [
              'match', ['get', 'status'],
              'ready', '#10b981',
              'draft', '#f59e0b',
              '#6366f1'
            ],
            'circle-opacity': 0.15,
            'circle-blur': 1,
          },
        });

        // Middle ring
        map.addLayer({
          id: 'reports-ring',
          type: 'circle',
          source: 'reports',
          paint: {
            'circle-radius': 10,
            'circle-color': 'transparent',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': [
              'match', ['get', 'status'],
              'ready', '#10b981',
              'draft', '#f59e0b',
              '#6366f1'
            ],
            'circle-stroke-opacity': 0.6,
          },
        });

        // Core dot
        map.addLayer({
          id: 'reports-dot',
          type: 'circle',
          source: 'reports',
          paint: {
            'circle-radius': 5,
            'circle-color': [
              'match', ['get', 'status'],
              'ready', '#10b981',
              'draft', '#f59e0b',
              '#6366f1'
            ],
            'circle-opacity': 0.95,
          },
        });

        // Saudi Arabia home marker (always shown)
        map.addSource('home', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [45.07, 23.68] },
              properties: { name: 'Saudi Arabia', type: 'home' },
            }],
          },
        });

        map.addLayer({
          id: 'home-glow',
          type: 'circle',
          source: 'home',
          paint: {
            'circle-radius': 22,
            'circle-color': '#38bdf8',
            'circle-opacity': 0.12,
            'circle-blur': 0.8,
          },
        });

        map.addLayer({
          id: 'home-dot',
          type: 'circle',
          source: 'home',
          paint: {
            'circle-radius': 6,
            'circle-color': '#38bdf8',
            'circle-opacity': 1,
          },
        });

        // Popup on click
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
          className: 'ehaata-popup',
        });

        map.on('mouseenter', 'reports-dot', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          const statusColor = props.status === 'ready' ? '#10b981' : '#f59e0b';
          popup.setLngLat(e.features[0].geometry.coordinates)
            .setHTML(`
              <div style="font-family:'Cairo',sans-serif;padding:10px 14px;min-width:160px">
                <div style="font-weight:700;font-size:12px;color:#f1f5f9;margin-bottom:4px">${props.name}</div>
                <div style="font-size:10px;color:#94a3b8;margin-bottom:6px">${props.city} · ${props.country}</div>
                <span style="background:${statusColor}22;color:${statusColor};border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;border:1px solid ${statusColor}44">
                  ${props.status === 'ready' ? '✓ Ready' : '⏳ Draft'}
                </span>
                ${props.dates ? `<div style="font-size:9px;color:#64748b;margin-top:5px">${props.dates}</div>` : ''}
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'reports-dot', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        // Draw arc lines from Saudi Arabia to each destination
        geojson.features.forEach((f, i) => {
          const from = [45.07, 23.68];
          const to   = f.geometry.coordinates;
          const arcCoords = greatCircleArc(from, to, 40);

          map.addSource(`arc-${i}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: arcCoords } } });
          map.addLayer({
            id: `arc-${i}`,
            type: 'line',
            source: `arc-${i}`,
            paint: {
              'line-color': f.properties.status === 'ready' ? '#10b981' : '#f59e0b',
              'line-width': 1,
              'line-opacity': 0.35,
              'line-dasharray': [3, 4],
            },
          });
        });
      });
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    try {
      mapRef.current.getSource('reports')?.setData(buildGeoJSON(upcomingReports));
    } catch {}
  }, [upcomingReports]);

  return (
    <>
      <style>{`
        .ehaata-popup .maplibregl-popup-content {
          background: rgba(15,23,42,0.95) !important;
          border: 1px solid rgba(99,102,241,0.3) !important;
          border-radius: 10px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .ehaata-popup .maplibregl-popup-tip { border-top-color: rgba(15,23,42,0.95) !important; }
        .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right { display: none !important; }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: 240, borderRadius: 0 }} />
    </>
  );
}

// ── Great-circle arc interpolation ───────────────────────
function greatCircleArc(from, to, steps = 40) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const [lon1, lat1] = from.map(toRad);
  const [lon2, lat2] = to.map(toRad);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1-f)*Math.acos(
      Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)
    )) / Math.sin(Math.acos(
      Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)
    ) || 0.0001);
    const B = Math.sin(f * Math.acos(
      Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)
    )) / Math.sin(Math.acos(
      Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1)
    ) || 0.0001);
    const x = A*Math.cos(lat1)*Math.cos(lon1) + B*Math.cos(lat2)*Math.cos(lon2);
    const y = A*Math.cos(lat1)*Math.sin(lon1) + B*Math.cos(lat2)*Math.sin(lon2);
    const z = A*Math.sin(lat1)               + B*Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x*x + y*y)));
    const lon = toDeg(Math.atan2(y, x));
    pts.push([lon, lat]);
  }
  return pts;
}

// ── Known city/country coords ─────────────────────────────
const CITY_COORDS = {
  'Los Angeles':   { lat: 34.05,  lng: -118.24 },
  'New York':      { lat: 40.71,  lng: -74.01  },
  'Washington':    { lat: 38.89,  lng: -77.04  },
  'London':        { lat: 51.51,  lng: -0.13   },
  'Paris':         { lat: 48.86,  lng: 2.35    },
  'Berlin':        { lat: 52.52,  lng: 13.41   },
  'Geneva':        { lat: 46.20,  lng: 6.15    },
  'Dubai':         { lat: 25.20,  lng: 55.27   },
  'Tokyo':         { lat: 35.68,  lng: 139.69  },
  'Singapore':     { lat: 1.35,   lng: 103.82  },
  'Beijing':       { lat: 39.91,  lng: 116.39  },
  'Sydney':        { lat: -33.87, lng: 151.21  },
  'Mumbai':        { lat: 19.08,  lng: 72.88   },
  'Cairo':         { lat: 30.04,  lng: 31.24   },
  'Riyadh':        { lat: 24.69,  lng: 46.72   },
  'Davos':         { lat: 46.80,  lng: 9.84    },
  'Brussels':      { lat: 50.85,  lng: 4.35    },
  'Vienna':        { lat: 48.21,  lng: 16.37   },
  'Toronto':       { lat: 43.65,  lng: -79.38  },
  'San Francisco': { lat: 37.77,  lng: -122.42 },
  'Chicago':       { lat: 41.88,  lng: -87.63  },
  'Zurich':        { lat: 47.38,  lng: 8.54    },
  'Amsterdam':     { lat: 52.37,  lng: 4.90    },
  'Seoul':         { lat: 37.57,  lng: 126.98  },
  'Bangkok':       { lat: 13.75,  lng: 100.52  },
  'Nairobi':       { lat: -1.29,  lng: 36.82   },
  'Mexico City':   { lat: 19.43,  lng: -99.13  },
  'São Paulo':     { lat: -23.55, lng: -46.63  },
  // Country fallbacks
  'United States': { lat: 37.09,  lng: -95.71  },
  'United Kingdom':{ lat: 51.51,  lng: -0.13   },
  'France':        { lat: 48.86,  lng: 2.35    },
  'Germany':       { lat: 52.52,  lng: 13.41   },
  'Japan':         { lat: 35.68,  lng: 139.69  },
  'China':         { lat: 39.91,  lng: 116.39  },
  'UAE':           { lat: 25.20,  lng: 55.27   },
  'Saudi Arabia':  { lat: 24.69,  lng: 46.72   },
};
