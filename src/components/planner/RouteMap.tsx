import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin, Loader2 } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PORTS = {
  Rotterdam: [51.9225, 4.47917] as [number, number],
  Antwerp: [51.2194, 4.4025] as [number, number],
};

const GERMANY_CENTER: [number, number] = [51.1657, 10.4515];

function MapController({ origin, destination, terminal }: { origin: [number, number] | null, destination: [number, number] | null, terminal: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(origin, destination);
      if (terminal) {
        bounds.extend(terminal);
      }
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else {
      map.flyTo(GERMANY_CENTER, 5, { duration: 1.5 });
    }
  }, [map, origin, destination, terminal]);
  return null;
}

const createLabelIcon = (text: string, bgColor: string) => {
  return L.divIcon({
    className: 'custom-map-label',
    html: `<div style="background-color: ${bgColor}; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; transform: translate(-50%, -50%);">${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export function RouteMap({ type }: { type: 'import' | 'export' }) {
  const { importRequest, exportRequest, importResult, exportResult } = usePlannerStore();
  const request = type === 'import' ? importRequest : exportRequest;
  const result = type === 'import' ? importResult : exportResult;
  const portName = type === 'import' ? importRequest.dischargePort : exportRequest.portTerminal;
  
  const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!request.postcode || request.postcode.length < 5) {
      setCustomerCoords(null);
      return;
    }

    const fetchCoords = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${request.postcode}&country=Germany&format=json`);
        const data = await res.json();
        if (data && data.length > 0) {
          setCustomerCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setCustomerCoords(null);
        }
      } catch (error) {
        console.error("Geocoding error", error);
        setCustomerCoords(null);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchCoords, 800);
    return () => clearTimeout(timeout);
  }, [request.postcode]);

  const portCoords = PORTS[portName as keyof typeof PORTS] || PORTS.Rotterdam;

  // Only set origin and destination if we have valid customer coordinates
  const origin = customerCoords ? (type === 'import' ? portCoords : customerCoords) : null;
  const destination = customerCoords ? (type === 'import' ? customerCoords : portCoords) : null;

  const originLabel = type === 'import' ? `Port of ${portName}` : `Customer (${request.postcode})`;
  const destLabel = type === 'import' ? `Customer (${request.postcode})` : `Port of ${portName}`;

  // Terminal logic
  let terminalCoords: [number, number] | null = null;
  let terminalLabel = '';
  
  if (result && result.feasibleDepartures.length > 0) {
    const terminal = result.feasibleDepartures[0].terminal;
    terminalLabel = terminal.name;
    
    // Hardcoded terminal coordinates based on PRD
    if (terminal.id === 'DUISBURG') terminalCoords = [51.4344, 6.7623];
    else if (terminal.id === 'KORNWESTHEIM') terminalCoords = [48.8667, 9.1833];
    else if (terminal.id === 'NUREMBERG') terminalCoords = [49.4521, 11.0767];
    else if (terminal.id === 'MUNICH') terminalCoords = [48.1351, 11.5820];
    else if (terminal.id === 'LEIPZIG') terminalCoords = [51.3397, 12.3731];
  }

  return (
    <div className="h-[500px] w-full relative group rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
      {loading && (
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200 flex items-center space-x-2 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Locating...</span>
        </div>
      )}

      <MapContainer 
        center={GERMANY_CENTER} 
        zoom={5} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ZoomControl position="bottomright" />
        
        <MapController origin={origin} destination={destination} terminal={terminalCoords} />
        
        {origin && destination && (
          <>
            <Marker position={origin} icon={createLabelIcon(`Start: ${originLabel}`, '#00243d')} />
            <Marker position={destination} icon={createLabelIcon(`End: ${destLabel}`, '#42b0d5')} />
            
            {terminalCoords && (
              <Marker position={terminalCoords} icon={createLabelIcon(`Via: ${terminalLabel}`, '#f59e0b')} />
            )}

            {terminalCoords ? (
              <>
                <Polyline 
                  positions={[origin, terminalCoords]} 
                  color="#f59e0b" 
                  weight={4} 
                  dashArray="10, 10" 
                  opacity={0.8}
                />
                <Polyline 
                  positions={[terminalCoords, destination]} 
                  color="#42b0d5" 
                  weight={4} 
                  dashArray="10, 10" 
                  opacity={0.8}
                />
              </>
            ) : (
              <Polyline 
                positions={[origin, destination]} 
                color="#42b0d5" 
                weight={4} 
                dashArray="10, 10" 
                opacity={0.8}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 space-y-3 pointer-events-none sm:pointer-events-auto">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Network Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#00243d]" />
            <span className="text-[11px] font-bold text-slate-700">Origin Point</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-[11px] font-bold text-slate-700">Inland Hub</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#42b0d5]" />
            <span className="text-[11px] font-bold text-slate-700">Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}

