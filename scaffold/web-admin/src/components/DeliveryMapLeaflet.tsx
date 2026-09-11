import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryMap.theme.css';
import { DriverUpdatePayload, useDriverTracker } from '../hooks/useDriverTracker';
import { io, Socket } from 'socket.io-client';

export interface LeafletDeliveryDriverPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading?: number;
  status?: string;
  phone?: string;
}

export interface LeafletDeliveryStopPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  description?: string;
}

type LatLng = [number, number];

interface DeliveryMapLeafletProps {
  center?: LatLng;
  storeName?: string;
  storeAddress?: string;
  storeId?: string;
  drivers?: LeafletDeliveryDriverPoint[];
  stops?: LeafletDeliveryStopPoint[];
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

const DEFAULT_CENTER: LatLng = [39.17572, -76.82957];

async function fetchOsrmDrivingRoute(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;
    return coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
  } catch {
    return null;
  }
}

const DeliveryMapLeaflet: React.FC<DeliveryMapLeafletProps> = ({
  center = DEFAULT_CENTER,
  storeName = 'Store',
  storeAddress: _storeAddress = '',
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
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const storeMarkerRef = useRef<L.CircleMarker | null>(null);
  const driverMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const stopMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [followMode] = useState(followModeDefault);

  const { drivers: trackedDrivers, ingestUpdate } = useDriverTracker();

  const mergedDrivers = useMemo(() => {
    const base = new Map<string, LeafletDeliveryDriverPoint>();
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center[0], center[1]],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;
      storeMarkerRef.current?.remove();
      storeMarkerRef.current = null;
      driverMarkersRef.current.forEach((m) => m.remove());
      driverMarkersRef.current.clear();
      stopMarkersRef.current.forEach((m) => m.remove());
      stopMarkersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center[0], center[1]], map.getZoom(), { animate: true });
  }, [center]);

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
    socket.on('connect', () => {
      if (resolvedStoreId) socket.emit('drivers:subscribe', resolvedStoreId);
    });
    socket.on('drivers:location:update', handleLocation);
    socket.on('driver:location:updated', handleLocation);
    return () => {
      socket.disconnect();
    };
  }, [enableLiveSocket, apiUrl, resolvedStoreId, ingestUpdate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!storeMarkerRef.current) {
      storeMarkerRef.current = L.circleMarker([center[0], center[1]], {
        radius: 10,
        color: '#ffffff',
        weight: 2,
        fillColor: '#f97316',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(storeName);
    } else {
      storeMarkerRef.current.setLatLng([center[0], center[1]]);
    }
  }, [center, storeName]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    mergedDrivers.forEach((driver) => {
      seen.add(driver.id);
      let marker = driverMarkersRef.current.get(driver.id);
      if (!marker) {
        marker = L.circleMarker([driver.lat, driver.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: '#22c55e',
          fillOpacity: 1,
        }).addTo(map);
        marker.on('click', () => onDriverClick?.(driver.id));
        driverMarkersRef.current.set(driver.id, marker);
      }
      marker.setLatLng([driver.lat, driver.lng]);
      marker.setStyle({
        weight: selectedDriverId === driver.id ? 3 : 2,
      });
      if (selectedDriverId === driver.id && followMode) {
        map.panTo([driver.lat, driver.lng]);
      }
    });

    driverMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        driverMarkersRef.current.delete(id);
      }
    });
  }, [mergedDrivers, selectedDriverId, followMode, onDriverClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    stops.forEach((stop) => {
      seen.add(stop.id);
      let marker = stopMarkersRef.current.get(stop.id);
      const fill = stop.id === selectedStopId ? '#0ea5e9' : '#f59e0b';
      if (!marker) {
        marker = L.circleMarker([stop.lat, stop.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: fill,
          fillOpacity: 1,
        }).addTo(map);
        marker.on('click', () => onStopClick?.(stop.id));
        stopMarkersRef.current.set(stop.id, marker);
      }
      marker.setLatLng([stop.lat, stop.lng]);
      marker.setStyle({ fillColor: fill });
      marker.bindTooltip(stop.label);
    });

    stopMarkersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        stopMarkersRef.current.delete(id);
      }
    });
  }, [stops, selectedStopId, onStopClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetStop = (selectedStopId ? stops.find((s) => s.id === selectedStopId) : undefined) || stops[0];

    routeLayerRef.current?.remove();
    routeLayerRef.current = null;

    if (!targetStop) return;

    let cancelled = false;
    void (async () => {
      const path = await fetchOsrmDrivingRoute(center[0], center[1], targetStop.lat, targetStop.lng);
      if (cancelled || !mapRef.current) return;
      if (path && path.length > 1) {
        const poly = L.polyline(path, {
          color: '#22c55e',
          weight: 5,
          opacity: 0.85,
        }).addTo(map);
        routeLayerRef.current = poly;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [center, stops, selectedStopId]);

  return (
    <div
      className={`delivery-map relative h-full min-h-[520px] w-full overflow-hidden ${embedded ? '' : 'rounded-xl border border-slate-800 bg-slate-950'} ${className ?? ''}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-[1] leaflet-dark-tiles" />

      <div className="absolute bottom-3 left-3 z-[500] bg-slate-900/80 backdrop-blur-sm p-3 rounded-xl border border-white/10 pointer-events-none">
        <div className="flex flex-col gap-2 text-[11px] font-medium text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
            <span>Store · OSM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span>Driver</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            <span>Stop</span>
          </div>
          <p className="text-[9px] text-slate-500 pt-1 border-t border-white/10 mt-1">
            Tiles © OSM · Routes OSRM demo · No Google API key
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapLeaflet;
