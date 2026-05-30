'use client'

import { useState, useEffect } from 'react'

const CITY_COORDS: Record<string, [number, number]> = {
  'آسفي': [32.2994, -9.2372],
  'Safi': [32.2994, -9.2372],
  'الدار البيضاء': [33.5731, -7.5898],
  'Casablanca': [33.5731, -7.5898],
  'مراكش': [31.6295, -7.9811],
  'Marrakech': [31.6295, -7.9811],
  'أكادير': [30.4278, -9.5981],
  'Agadir': [30.4278, -9.5981],
  'الرباط': [34.0209, -6.8416],
  'Rabat': [34.0209, -6.8416],
  'طنجة': [35.7595, -5.8340],
  'Tanger': [35.7595, -5.8340],
  'فاس': [34.0331, -5.0003],
  'Fès': [34.0331, -5.0003],
  'Fes': [34.0331, -5.0003],
  'مكناس': [33.8935, -5.5473],
  'Meknès': [33.8935, -5.5473],
  'Meknes': [33.8935, -5.5473],
}

function getMarkerColor(count: number): string {
  if (count >= 6) return '#7C3AED'
  if (count >= 3) return '#1D4ED8'
  return '#3B82F6'
}

interface CityData {
  city: string
  count: number
  transporteurs: { nom: string; vehicle_type: string | null }[]
}

interface Props {
  cityData: CityData[]
}

const MAP_STYLES = `
  .admin-map .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
    border: 1px solid #E5E7EB;
    padding: 0 !important;
    font-family: inherit;
  }
  .admin-map .leaflet-popup-content {
    margin: 0 !important;
  }
  .admin-map .leaflet-popup-tip-container {
    display: none;
  }
  .admin-map .leaflet-control-zoom {
    border: 1px solid #E5E7EB !important;
    border-radius: 10px !important;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
  }
  .admin-map .leaflet-control-zoom a {
    color: #374151 !important;
    border-bottom: 1px solid #E5E7EB !important;
    font-size: 16px !important;
    line-height: 28px !important;
    width: 28px !important;
    height: 28px !important;
  }
  .admin-map .leaflet-control-attribution {
    font-size: 9px !important;
    background: rgba(255,255,255,0.7) !important;
    backdrop-filter: blur(4px);
    border-radius: 6px 0 0 0 !important;
  }
`

export default function TransporteurMap({ cityData }: Props) {
  const [filterCity, setFilterCity] = useState<string>('all')
  const [MapComponent, setMapComponent] = useState<React.ReactNode>(null)

  const filteredData = filterCity === 'all' ? cityData : cityData.filter(c => c.city === filterCity)

  useEffect(() => {
    // Inject map styles once
    if (!document.getElementById('admin-map-css')) {
      const style = document.createElement('style')
      style.id = 'admin-map-css'
      style.textContent = MAP_STYLES
      document.head.appendChild(style)
    }

    async function loadMap() {
      const L = await import('leaflet')
      const { MapContainer, TileLayer, CircleMarker, Popup } = await import('react-leaflet')
      await import('leaflet/dist/leaflet.css')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl

      setMapComponent(
        <MapContainer
          center={[32.0, -6.8]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          className="admin-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {filteredData.flatMap(city => {
            const coords = CITY_COORDS[city.city]
            if (!coords) return []
            const color = getMarkerColor(city.count)
            const radius = Math.min(7 + city.count * 3, 26)

            return [
              // Outer halo ring
              <CircleMarker
                key={`${city.city}-halo`}
                center={coords}
                radius={radius + 7}
                interactive={false}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 0 }}
              />,
              // Inner filled dot
              <CircleMarker
                key={`${city.city}-dot`}
                center={coords}
                radius={radius}
                pathOptions={{ color: 'white', fillColor: color, fillOpacity: 0.9, weight: 2.5 }}
              >
                <Popup closeButton={false} offset={[0, -radius / 2]}>
                  <div style={{ padding: '10px 14px', minWidth: 160 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 6 }}>
                      {city.city}
                      <span style={{ fontWeight: 400, color: color, fontSize: 11, marginLeft: 6 }}>
                        {city.count} transporteur{city.count > 1 ? 's' : ''}
                      </span>
                    </p>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 11, color: '#6B7280' }}>
                      {city.transporteurs.slice(0, 5).map((t, i) => (
                        <li key={i} style={{ padding: '1px 0' }}>{t.nom}</li>
                      ))}
                      {city.count > 5 && (
                        <li style={{ color: '#9CA3AF', marginTop: 2 }}>+{city.count - 5} autres</li>
                      )}
                    </ul>
                  </div>
                </Popup>
              </CircleMarker>,
            ]
          })}
        </MapContainer>
      )
    }

    loadMap()
  }, [filteredData])

  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-nardo">Carte des transporteurs</p>
          <p className="text-xs text-muted mt-0.5">Répartition géographique</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted mr-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />1–2</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" />3–5</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" />6+</span>
          </div>
          <select
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs text-nardo bg-white"
          >
            <option value="all">Toutes les villes</option>
            {cityData.map(c => (
              <option key={c.city} value={c.city}>{c.city}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ height: 300 }}>
        {MapComponent ?? (
          <div className="h-full flex items-center justify-center text-muted text-sm bg-surface">
            Chargement de la carte...
          </div>
        )}
      </div>
    </div>
  )
}
