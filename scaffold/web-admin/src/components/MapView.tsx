import React, { useMemo } from 'react';
import DeliveryMap from './DeliveryMap';

const DEFAULT_CENTER: [number, number] = [39.17572, -76.82957];

export interface MapMarker {
  id: string;
  position: [number, number];
  type: 'store' | 'driver' | 'pending' | 'active' | 'custom';
  title?: string;
  description?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ON_BREAK';
  data?: any;
}

export interface MapZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  color?: string;
  description?: string;
}

interface MapViewProps {
  center?: [number, number];
  markers?: MapMarker[];
  zones?: MapZone[];
  height?: string;
  width?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onZoneClick?: (zone: MapZone) => void;
  selectedMarkerId?: string | null;
}

const MapView: React.FC<MapViewProps> = ({
  center = DEFAULT_CENTER,
  markers = [],
  zones = [],
  height = '500px',
  width = '100%',
  onMarkerClick,
  onZoneClick,
  selectedMarkerId,
}) => {
  const drivers = useMemo(
    () =>
      markers
        .filter((m) => m.type === 'driver')
        .map((m) => ({
          id: m.id,
          name: m.title || 'Driver',
          lat: m.position[0],
          lng: m.position[1],
          status: m.status || 'ONLINE',
          heading: Number(m.data?.heading ?? 0),
        })),
    [markers],
  );

  const stops = useMemo(
    () => [
      ...markers
        .filter((m) => m.type !== 'driver')
        .map((m) => ({
          id: m.id,
          label: m.title || m.id,
          description: m.description,
          lat: m.position[0],
          lng: m.position[1],
        })),
      ...zones.map((z) => ({
        id: z.id,
        label: z.name,
        description: z.description || `Radius ${(z.radius / 1000).toFixed(1)} km`,
        lat: z.center[0],
        lng: z.center[1],
      })),
    ],
    [markers, zones],
  );

  return (
    <div style={{ height, width }}>
      <DeliveryMap
        center={center}
        drivers={drivers}
        stops={stops}
        selectedStopId={selectedMarkerId || undefined}
        onDriverClick={(id) => {
          const marker = markers.find((m) => m.id === id);
          if (marker) onMarkerClick?.(marker);
        }}
        onStopClick={(id) => {
          const marker = markers.find((m) => m.id === id);
          if (marker) onMarkerClick?.(marker);
          const zone = zones.find((z) => z.id === id);
          if (zone) onZoneClick?.(zone);
        }}
        enableLiveSocket={false}
      />
    </div>
  );
};

export default MapView;
