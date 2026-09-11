import React, { useEffect, useMemo, useState } from 'react';
import DeliveryMap from '../../../components/DeliveryMap';
import { geocodeAddressPhoton } from '../../../components/maps/geocodePhoton';

type LatLng = [number, number];

interface MapDriver {
  id: string;
  name: string;
  phone?: string;
  status?: string;
  currentLocation?: { lat?: number; lng?: number } | null;
}

interface MapOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  deliveryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat?: number;
    lng?: number;
  };
  total: number;
}

interface DispatchMapProps {
  storeCenter: LatLng;
  storeName?: string;
  storeAddress?: string;
  storeId?: string;
  orders: MapOrder[];
  drivers: MapDriver[];
  selectedOrderId?: string | null;
  selectedDriverId?: string | null;
  onOrderClick?: (orderId: string) => void;
  onDriverClick?: (driverId: string) => void;
  loading?: boolean;
}

// FIXED Store location: 7060 Oakland Mills Rd, Columbia, MD 21046
export const FIXED_STORE_LOCATION: LatLng = [39.17572, -76.82957];
export const FIXED_STORE_ADDRESS = '7060 Oakland Mills Rd, Columbia, MD 21046';

const toNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAddressCoordinate = (address: any, keys: string[]): number | null => {
  for (const key of keys) {
    const value = toNumber(address?.[key]);
    if (value !== null) return value;
  }
  return null;
};

// Only drivers get fallback positioning near store if no GPS data
const getDriverPosition = (lat: number | null, lng: number | null, index: number): LatLng => {
  if (lat !== null && lng !== null) {
    return [lat, lng];
  }
  // Fallback: place driver in a small ring near store if no GPS
  const angle = ((index * 37) % 360) * (Math.PI / 180);
  const radius = 0.003;
  return [
    FIXED_STORE_LOCATION[0] + Math.cos(angle) * radius,
    FIXED_STORE_LOCATION[1] + Math.sin(angle) * radius,
  ];
};

const addressKeyForGeocode = (order: MapOrder) => {
  const addr = order.deliveryAddress as any;
  const street =
    order.deliveryAddress?.street ||
    addr?.address ||
    addr?.line1 ||
    addr?.address1 ||
    '';
  const city = order.deliveryAddress?.city || addr?.town || '';
  const state = order.deliveryAddress?.state || '';
  const zip = order.deliveryAddress?.zipCode || addr?.zip || '';
  return [street, city, state, zip].filter(Boolean).join(', ');
};

const DispatchMap: React.FC<DispatchMapProps> = ({
  storeCenter: _, // Ignored - use fixed store location
  storeName = 'Pizza Store',
  storeAddress = FIXED_STORE_ADDRESS,
  storeId,
  orders,
  drivers,
  selectedOrderId,
  selectedDriverId,
  onOrderClick,
  onDriverClick,
  loading = false,
}) => {
  const [geocodedByOrderId, setGeocodedByOrderId] = useState<Record<string, LatLng>>({});

  // Drivers update live with their current location
  const driverPoints = useMemo(
    () =>
      drivers.map((driver, index) => {
        const lat = toNumber(driver.currentLocation?.lat);
        const lng = toNumber(driver.currentLocation?.lng);
        const position = getDriverPosition(lat, lng, index);
        return {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          status: driver.status ?? 'UNKNOWN',
          lat: position[0],
          lng: position[1],
          heading: 0,
        };
      }),
    [drivers],
  );

  useEffect(() => {
    const controller = new AbortController();
    const pending = orders.filter((order) => {
      const addr = order.deliveryAddress as any;
      const lat = getAddressCoordinate(addr, ['lat', 'latitude']);
      const lng = getAddressCoordinate(addr, ['lng', 'longitude', 'lon', 'long']);
      return !(lat !== null && lng !== null) && !!addressKeyForGeocode(order);
    });

    if (pending.length === 0) return () => controller.abort();

    // Photon (OSM-backed) geocoder — works for both map providers and avoids
    // needing the Google Maps JS API loaded before we can place pins.
    void (async () => {
      for (const order of pending) {
        if (controller.signal.aborted) return;
        const query = addressKeyForGeocode(order);
        if (!query || geocodedByOrderId[order.id]) continue;

        const coords = await geocodeAddressPhoton(query);
        if (coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
          setGeocodedByOrderId((prev) => ({ ...prev, [order.id]: coords }));
        }
      }
    })();

    return () => controller.abort();
  }, [orders, geocodedByOrderId]);

  // Delivery stops: use actual coordinates from payload or geocoded address, no random fallback.
  const stopPoints = useMemo(() => {
    const mappedStops: Array<{
      id: string;
      label: string;
      description: string;
      lat: number;
      lng: number;
    }> = [];

    orders.forEach((order, index) => {
      const addr = order.deliveryAddress as any;
      const lat = getAddressCoordinate(addr, ['lat', 'latitude']);
      const lng = getAddressCoordinate(addr, ['lng', 'longitude', 'lon', 'long']);

      const street =
        order.deliveryAddress?.street ||
        addr?.address ||
        addr?.line1 ||
        addr?.address1 ||
        '';
      const city =
        order.deliveryAddress?.city ||
        addr?.town ||
        '';
      const fullAddress = [street, city].filter(Boolean).join(', ') || 'Address pending';
      const geocoded = geocodedByOrderId[order.id];
      const resolvedLat = lat ?? (geocoded ? geocoded[0] : null);
      const resolvedLng = lng ?? (geocoded ? geocoded[1] : null);

      if (resolvedLat === null || resolvedLng === null) {
        return;
      }

      mappedStops.push({
        id: order.id,
        label: `#${order.orderNumber}`,
        description: fullAddress,
        lat: resolvedLat,
        lng: resolvedLng,
      });
    });

    return mappedStops;
  }, [orders, geocodedByOrderId]);

  if (loading) {
    return (
      <div className="h-full min-h-[560px] p-3 animate-pulse">
        <div className="h-6 w-40 rounded bg-slate-800 mb-3" />
        <div className="h-[540px] rounded-lg bg-slate-800/80" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col p-3">
      <DeliveryMap
        center={FIXED_STORE_LOCATION}
        storeName={storeName}
        storeAddress={storeAddress}
        storeId={storeId}
        drivers={driverPoints}
        stops={stopPoints}
        selectedDriverId={selectedDriverId}
        selectedStopId={selectedOrderId}
        onDriverClick={onDriverClick}
        onStopClick={onOrderClick}
        enableLiveSocket={true}
        className="h-full min-h-[540px] rounded-xl"
        embedded
      />
    </div>
  );
};

export default DispatchMap;
