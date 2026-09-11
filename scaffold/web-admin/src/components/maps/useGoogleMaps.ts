import { useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Centralised loader for the Google Maps JS API.
//
// Why this exists:
//   - Two separate components (DeliveryMap and DispatchMap) were each trying to
//     touch `google.maps.*` inside their own useEffect hooks before the script
//     had finished loading. That produces `ReferenceError: google is not defined`
//     which the app's RootErrorBoundary surfaces as "POS hit an unexpected error".
//   - The old <GoogleMapsWrapper> only gated children's *render* path, not their
//     parents' effects. We need a real promise the caller can await.
//
// What this provides:
//   - ensureGoogleMaps(libs?)  -> idempotent promise that resolves once the API
//                                  (and the requested optional libraries) is loaded.
//                                  Reuses an in-flight load if called concurrently.
//   - useGoogleMapsReady(libs?) -> React hook that triggers a load on mount and
//                                  returns { isLoaded, loadError }. Components
//                                  must check isLoaded before any `google.*` call.
//
// Note on missing key: a missing VITE_GOOGLE_MAPS_API_KEY is reported as a normal
// load error (not a thrown exception) so callers can render a fallback UI instead
// of crashing the whole React tree.

export type GoogleMapsLibrary =
  | 'drawing'
  | 'geometry'
  | 'localContext'
  | 'places'
  | 'visualization';

// Single in-flight promise per "set of libraries we have already requested".
// Subsequent calls with overlapping libraries reuse the same load.
let loadPromise: Promise<void> | null = null;
const requestedLibraries = new Set<string>();
let optionsApplied = false;

export function ensureGoogleMaps(
  libraries: GoogleMapsLibrary[] = ['geometry', 'places'],
): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    return Promise.reject(
      new Error(
        'Google Maps API key is missing. Set VITE_GOOGLE_MAPS_API_KEY in scaffold/web-admin/.env.',
      ),
    );
  }

  // setOptions() must only be called once; the loader throws on subsequent calls.
  if (!optionsApplied) {
    // Cast to any: the typed signature is overly strict about property names.
    (setOptions as any)({ apiKey });
    optionsApplied = true;
  }

  const toLoad = libraries.filter((lib) => !requestedLibraries.has(lib));
  if (loadPromise && toLoad.length === 0) {
    return loadPromise;
  }

  const nextPromise = (loadPromise ?? Promise.resolve()).then(() =>
    Promise.all([
      // 'maps' is the core library; always required.
      importLibrary('maps' as any),
      ...toLoad.map((lib) => importLibrary(lib as any)),
    ]).then(() => {
      toLoad.forEach((lib) => requestedLibraries.add(lib));
    }),
  );

  loadPromise = nextPromise;
  return nextPromise;
}

export interface UseGoogleMapsReady {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMapsReady(
  libraries: GoogleMapsLibrary[] = ['geometry', 'places'],
): UseGoogleMapsReady {
  const [isLoaded, setIsLoaded] = useState<boolean>(
    () => typeof window !== 'undefined' && Boolean((window as any).google?.maps),
  );
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Stable key over the libraries array to avoid retriggering on identical lists.
  const librariesKey = [...libraries].sort().join(',');

  useEffect(() => {
    let cancelled = false;
    ensureGoogleMaps(libraries)
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [librariesKey]);

  return { isLoaded, loadError };
}
