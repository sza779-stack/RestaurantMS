import { useCallback, useRef, useState } from 'react';

export interface DriverUpdatePayload {
  id: string;
  lat: number;
  lng: number;
  heading?: number;
}

export interface DriverTrackState extends DriverUpdatePayload {
  updatedAt: number;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class DriverMarkerAnimator {
  private points = new Map<string, { from: DriverTrackState; to: DriverTrackState; startAt: number; duration: number }>();

  constructor(private onFrame: (id: string, value: DriverTrackState) => void) {}

  upsert(next: DriverUpdatePayload, duration = 900) {
    const now = performance.now();
    const existing = this.points.get(next.id);
    const base: DriverTrackState = existing
      ? existing.to
      : { ...next, heading: next.heading ?? 0, updatedAt: Date.now() };

    const target: DriverTrackState = {
      id: next.id,
      lat: next.lat,
      lng: next.lng,
      heading: next.heading ?? base.heading ?? 0,
      updatedAt: Date.now(),
    };

    this.points.set(next.id, {
      from: base,
      to: target,
      startAt: now,
      duration,
    });
  }

  step(now: number) {
    let active = 0;
    this.points.forEach((item, id) => {
      const t = Math.min(1, (now - item.startAt) / item.duration);
      const value: DriverTrackState = {
        id,
        lat: lerp(item.from.lat, item.to.lat, t),
        lng: lerp(item.from.lng, item.to.lng, t),
        heading: lerp(item.from.heading ?? 0, item.to.heading ?? 0, t),
        updatedAt: item.to.updatedAt,
      };
      this.onFrame(id, value);
      if (t >= 1) {
        this.points.delete(id);
      } else {
        active += 1;
      }
    });
    return active > 0;
  }
}

export const useDriverTracker = () => {
  const [drivers, setDrivers] = useState<Record<string, DriverTrackState>>({});
  const animatorRef = useRef<DriverMarkerAnimator | null>(null);
  const rafRef = useRef<number | null>(null);

  if (!animatorRef.current) {
    animatorRef.current = new DriverMarkerAnimator((id, value) => {
      setDrivers((prev) => ({ ...prev, [id]: value }));
    });
  }

  const tick = useCallback((ts: number) => {
    const active = animatorRef.current?.step(ts) ?? false;
    if (active) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const ingestUpdate = useCallback((update: DriverUpdatePayload) => {
    animatorRef.current?.upsert(update);
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  return { drivers, ingestUpdate, start, stop };
};
