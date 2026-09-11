/** Matches StoreSettings.mapsProvider from API */
export type MapsNavProvider = 'GOOGLE' | 'OPENSTREETMAP';

export function normalizeMapsNavProvider(value: unknown): MapsNavProvider {
  if (value === 'OPENSTREETMAP') return 'OPENSTREETMAP';
  return 'GOOGLE';
}

/**
 * External turn-by-turn links (no embedded map SDK on driver PWA).
 */
export function getDirectionsUrl(
  provider: MapsNavProvider | undefined,
  address: { lat?: number; lng?: number } | undefined,
  destinationLabel: string,
  currentLocation?: { lat: number; lng: number },
): string {
  const mode = normalizeMapsNavProvider(provider);

  if (mode === 'OPENSTREETMAP') {
    if (address?.lat != null && address?.lng != null && currentLocation) {
      const route = `${currentLocation.lat},${currentLocation.lng};${address.lat},${address.lng}`;
      return `https://www.openstreetmap.org/directions?engine=osrm_car&route=${encodeURIComponent(route)}`;
    }
    if (address?.lat != null && address?.lng != null) {
      const route = `;${address.lat},${address.lng}`;
      return `https://www.openstreetmap.org/directions?engine=osrm_car&route=${encodeURIComponent(route)}`;
    }
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(destinationLabel)}`;
  }

  const destination =
    address?.lat != null && address?.lng != null ? `${address.lat},${address.lng}` : encodeURIComponent(destinationLabel);

  if (currentLocation) {
    return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

export function getMapSearchUrl(provider: MapsNavProvider | undefined, query: string): string {
  const mode = normalizeMapsNavProvider(provider);
  if (mode === 'OPENSTREETMAP') {
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
