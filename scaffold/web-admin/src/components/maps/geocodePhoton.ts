/**
 * Photon (Komoot) — OpenStreetMap-based geocoder with permissive use for apps.
 * Used when Maps provider is OPENSTREETMAP so DispatchMap never touches google.maps.Geocoder.
 */
export async function geocodeAddressPhoton(query: string): Promise<[number, number] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.features?.[0];
    const coords = f?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  } catch {
    return null;
  }
}
