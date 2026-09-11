import React, { ReactNode } from 'react';
import { useGoogleMapsReady, GoogleMapsLibrary } from './useGoogleMaps';

interface GoogleMapsWrapperProps {
  children: ReactNode;
  libraries?: GoogleMapsLibrary[];
}

// Gate any subtree that touches `google.maps.*` behind this wrapper.
//
// Important contract: children are *not mounted at all* until the API is loaded.
// That means a child component's useEffect hooks won't run until `google` is
// defined, which is exactly what we need to keep components like DeliveryMap from
// crashing on first render.
//
// Use this for the rendered map subtree. For pure imperative needs (e.g. a one-off
// Geocoder call from a useEffect) prefer awaiting `ensureGoogleMaps()` directly so
// you don't introduce a spinner into a UI that doesn't otherwise display a map.
const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({
  children,
  libraries = ['geometry', 'places'],
}) => {
  const { isLoaded, loadError } = useGoogleMapsReady(libraries);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-900 border border-red-500/30 rounded-xl">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-red-400 mb-2">Google Maps Load Error</h3>
        <p className="text-slate-400 text-sm max-w-md">{loadError.message}</p>
        <p className="mt-4 text-xs text-slate-500 italic">Falling back to schematic view if available.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 rounded-xl">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Loading map…</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default GoogleMapsWrapper;
