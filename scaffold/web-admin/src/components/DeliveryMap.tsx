import React, { useEffect, useMemo, useRef, useState } from 'react';
import GoogleMapsWrapper from './maps/GoogleMapsWrapper';
import DeliveryMapLeaflet from './DeliveryMapLeaflet';
import './DeliveryMap.theme.css';
import { DriverUpdatePayload, useDriverTracker } from '../hooks/useDriverTracker';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../hooks/useStore';
import type { MapsProvider } from './maps/mapsConfig';
import { normalizeMapsProvider } from './maps/mapsConfig';

type LatLng = [number, number];

export interface DeliveryDriverPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading?: number;
  status?: string;
  phone?: string;
}

export interface DeliveryStopPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  description?: string;
}

interface DeliveryMapProps {
  /** Overrides Store Settings → Maps provider when set (e.g. previews). */
  mapsProvider?: MapsProvider;
  center?: LatLng;
  storeName?: string;
  storeAddress?: string;
  storeId?: string;
  drivers?: DeliveryDriverPoint[];
  stops?: DeliveryStopPoint[];
  wsUrl?: string;
  apiUrl?: string;
  enableLiveSocket?: boolean;
  followModeDefault?: boolean;
  selectedDriverId?: string | null;
  selectedStopId?: string | null;
  onDriverClick?: (id: string) => void;
  onStopClick?: (id: string) => void;
  className?: string;
  embedded?: boolean;
}

const DEFAULT_CENTER: LatLng = [39.17572, -76.82957]; // 7060 Oakland Mills Rd, Columbia, MD 21046

const SchematicFallback: React.FC<{
  center: LatLng;
  drivers: DeliveryDriverPoint[];
  stops: DeliveryStopPoint[];
  selectedDriverId?: string | null;
  selectedStopId?: string | null;
  onDriverClick?: (id: string) => void;
  onStopClick?: (id: string) => void;
}> = ({ center, drivers, stops, selectedDriverId, selectedStopId, onDriverClick, onStopClick }) => {
  const pts: LatLng[] = [center, ...drivers.map((d) => [d.lat, d.lng] as LatLng), ...stops.map((s) => [s.lat, s.lng] as LatLng)];
  const minLat = Math.min(...pts.map((p) => p[0]));
  const maxLat = Math.max(...pts.map((p) => p[0]));
  const minLng = Math.min(...pts.map((p) => p[1]));
  const maxLng = Math.max(...pts.map((p) => p[1]));
  const latSpan = Math.max(0.001, maxLat - minLat);
  const lngSpan = Math.max(0.001, maxLng - minLng);
  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / lngSpan) * 60 + 20;
    const y = (1 - (lat - minLat) / latSpan) * 60 + 20;
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.22),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,.18),transparent_35%),linear-gradient(180deg,#020617,#031033)]">
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.2)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <button
        className="absolute -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border-2 border-slate-100 bg-orange-500 text-xs font-bold text-white shadow-xl shadow-orange-500/30"
        style={project(center[0], center[1])}
      >
        S
      </button>
      {drivers.map((d) => (
        <button
          key={d.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-2 text-[10px] font-bold text-white transition-all duration-500 ${
            selectedDriverId === d.id ? 'border-sky-300 bg-sky-600 scale-125 z-10' : 'border-slate-300 bg-emerald-600 shadow-lg'
          }`}
          style={project(d.lat, d.lng)}
          onClick={() => onDriverClick?.(d.id)}
        >
          D
        </button>
      ))}
      {stops.map((s) => (
        <button
          key={s.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-2 text-[10px] font-bold text-white transition-all ${
            selectedStopId === s.id ? 'border-sky-300 bg-sky-600 scale-125 z-10' : 'border-slate-300 bg-amber-500 shadow-lg'
          }`}
          style={project(s.lat, s.lng)}
          onClick={() => onStopClick?.(s.id)}
        >
          #
        </button>
      ))}
    </div>
  );
};

// Inner component that owns all `google.*` interactions. Rendered only as a child
// of <GoogleMapsWrapper>, which means React doesn't even mount it (and therefore
// won't run its effects) until the Maps JS API has finished loading. That's the
// invariant that prevents the `ReferenceError: google is not defined` crash that
// the RootErrorBoundary was surfacing as "POS hit an unexpected error".
const DeliveryMapInner: React.FC<DeliveryMapProps> = ({
  center = DEFAULT_CENTER,
  storeName = 'Store',
  storeAddress: _storeAddress = '7060 Oakland Mills Rd, Columbia, MD 21046',
  storeId,
  drivers = [],
  stops = [],
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000',
  enableLiveSocket = true,
  followModeDefault = false,
  selectedDriverId,
  selectedStopId,
  onDriverClick,
  onStopClick,
  className,
  embedded = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const storeMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const stopMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [followMode, _setFollowMode] = useState(followModeDefault);
  // Reserved for future runtime detection (e.g. WebGL unavailable). Kept so the
  // schematic-fallback render path stays compiled and easy to re-enable.
  const [useSchematicFallback] = useState(false);

  const { drivers: trackedDrivers, ingestUpdate } = useDriverTracker();

  const mergedDrivers = useMemo(() => {
    const base = new Map<string, DeliveryDriverPoint>();
    drivers.forEach((d) => base.set(d.id, d));
    Object.values(trackedDrivers).forEach((t) => {
      const existing = base.get(t.id);
      if (existing) {
        base.set(t.id, { ...existing, lat: t.lat, lng: t.lng, heading: t.heading });
      } else {
        base.set(t.id, { id: t.id, name: t.id, lat: t.lat, lng: t.lng, heading: t.heading, status: 'ONLINE' });
      }
    });
    return Array.from(base.values());
  }, [drivers, trackedDrivers]);

  const resolvedStoreId = useMemo(() => {
    if (storeId) return storeId;
    for (const key of ['interface-sync-store-id', 'pos-store-id', 'kds-store-id', 'packing-store-id', 'online-store-id']) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return undefined;
  }, [storeId]);

  // Initializing the Google Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: center[0], lng: center[1] },
      zoom: 13,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
        { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    };

    const map = new google.maps.Map(containerRef.current, mapOptions);
    mapRef.current = map;

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#22c55e",
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    return () => {
      driverMarkersRef.current.forEach(m => m.setMap(null));
      stopMarkersRef.current.forEach(m => m.setMap(null));
      storeMarkerRef.current?.setMap(null);
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Web socket for live location updates
  useEffect(() => {
    if (!enableLiveSocket) return;
    const socket: Socket = io(`${apiUrl}/ws`, { transports: ['websocket'], auth: { token: '' } });
    const handleLocation = (payload: any) => {
      const id = payload?.id || payload?.driverId;
      const lat = Number(payload?.lat ?? payload?.location?.lat);
      const lng = Number(payload?.lng ?? payload?.location?.lng);
      const heading = Number(payload?.heading ?? 0);
      if (id && Number.isFinite(lat) && Number.isFinite(lng)) ingestUpdate({ id: String(id), lat, lng, heading } as DriverUpdatePayload);
    };
    socket.on('connect', () => { if (resolvedStoreId) socket.emit('drivers:subscribe', resolvedStoreId); });
    socket.on('drivers:location:update', handleLocation);
    socket.on('driver:location:updated', handleLocation);
    return () => { socket.disconnect(); };
  }, [enableLiveSocket, apiUrl, resolvedStoreId, ingestUpdate]);

  // Handle store marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!storeMarkerRef.current) {
      storeMarkerRef.current = new google.maps.Marker({
        position: { lat: center[0], lng: center[1] },
        map,
        title: storeName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff"
        }
      });
    } else {
      storeMarkerRef.current.setPosition({ lat: center[0], lng: center[1] });
    }
  }, [center, storeName]);

  // Handle driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    mergedDrivers.forEach((driver) => {
      seen.add(driver.id);
      let marker = driverMarkersRef.current.get(driver.id);

      if (!marker) {
        marker = new google.maps.Marker({
          map,
          title: driver.name,
          icon: {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 1.5,
            anchor: new google.maps.Point(12, 24)
          }
        });
        marker.addListener('click', () => onDriverClick?.(driver.id));
        driverMarkersRef.current.set(driver.id, marker);
      }

      marker.setPosition({ lat: driver.lat, lng: driver.lng });

      if (selectedDriverId === driver.id && followMode) {
        map.panTo({ lat: driver.lat, lng: driver.lng });
      }
    });

    driverMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.setMap(null);
        driverMarkersRef.current.delete(id);
      }
    });
  }, [mergedDrivers, selectedDriverId, followMode, onDriverClick]);

  // Handle stop markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    stops.forEach((stop) => {
      seen.add(stop.id);
      let marker = stopMarkersRef.current.get(stop.id);

      if (!marker) {
        marker = new google.maps.Marker({
          map,
          title: stop.label,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: stop.id === selectedStopId ? "#0ea5e9" : "#f59e0b",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff"
          }
        });
        marker.addListener('click', () => onStopClick?.(stop.id));
        stopMarkersRef.current.set(stop.id, marker);
      } else {
        marker.setIcon({
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: stop.id === selectedStopId ? "#0ea5e9" : "#f59e0b",
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "#ffffff"
        });
      }
      marker.setPosition({ lat: stop.lat, lng: stop.lng });
    });

    stopMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.setMap(null);
        stopMarkersRef.current.delete(id);
      }
    });
  }, [stops, selectedStopId, onStopClick]);

  // Routing with Google Directions Service
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !directionsRendererRef.current) return;

    const targetStop = (selectedStopId ? stops.find(s => s.id === selectedStopId) : undefined) || stops[0];
    if (!targetStop) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: center[0], lng: center[1] },
        destination: { lat: targetStop.lat, lng: targetStop.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
        }
      }
    );
  }, [center, stops, selectedStopId]);

  return (
    <div className={`delivery-map relative h-full min-h-[520px] w-full overflow-hidden ${embedded ? '' : 'rounded-xl border border-slate-800 bg-slate-950'} ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0 z-[1]" />

      {useSchematicFallback && (
        <SchematicFallback
          center={center}
          drivers={mergedDrivers}
          stops={stops}
          selectedDriverId={selectedDriverId}
          selectedStopId={selectedStopId}
          onDriverClick={onDriverClick}
          onStopClick={onStopClick}
        />
      )}

      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/80 backdrop-blur-sm p-3 rounded-xl border border-white/10">
        <div className="flex flex-col gap-2 text-[11px] font-medium text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span>
            <span>Store Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
            <span>Active Driver</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
            <span>Delivery Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Routes to Google Maps (existing path) or Leaflet + OSM + OSRM / Photon (no API key).
const DeliveryMap: React.FC<DeliveryMapProps> = ({ mapsProvider: mapsProviderProp, ...props }) => {
  const { currentStore } = useStore();
  const mapsProvider = mapsProviderProp ?? normalizeMapsProvider(currentStore?.settings?.mapsProvider);

  if (mapsProvider === 'OPENSTREETMAP') {
    return <DeliveryMapLeaflet {...props} />;
  }

  return (
    <GoogleMapsWrapper>
      <DeliveryMapInner {...props} />
    </GoogleMapsWrapper>
  );
};

export default DeliveryMap;
