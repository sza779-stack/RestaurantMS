export type MapsProvider = 'GOOGLE' | 'OPENSTREETMAP';

/** Persisted on StoreSettings.mapsProvider */
export function normalizeMapsProvider(value: unknown): MapsProvider {
  if (value === 'OPENSTREETMAP') return 'OPENSTREETMAP';
  return 'GOOGLE';
}
