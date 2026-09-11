import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useLocalSetting — typed, parse-safe localStorage state with cross-tab sync.
 *
 * Why: across the codebase we have ~150 lines of `JSON.parse(localStorage.getItem(...))`
 * boilerplate (settings, suspended orders, OSDU display toggles, theme, etc.), each with
 * subtly different error-handling and no cross-tab notification. This hook standardises:
 *   - default value on first load,
 *   - safe JSON parse with `validate` escape hatch,
 *   - `storage` event listener so two POS tabs stay in sync,
 *   - custom `window` event so the same tab gets notified when *another part of itself*
 *     writes to the same key (the native `storage` event only fires cross-tab).
 *
 * Usage:
 *   const [settings, setSettings] = useLocalSetting('osdu-display', {
 *     defaultValue: { showDelivery: false, soundEnabled: true },
 *   });
 *
 * Validation:
 *   const [num, setNum] = useLocalSetting('count', {
 *     defaultValue: 0,
 *     validate: (v): v is number => typeof v === 'number',
 *   });
 */

export interface UseLocalSettingOptions<T> {
  defaultValue: T;
  /** Narrow an unknown parsed JSON value back to T. Falsy result triggers the default. */
  validate?: (value: unknown) => value is T;
  /** Custom serializer. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** Custom parser. Defaults to `JSON.parse`. */
  deserialize?: (raw: string) => unknown;
}

const LOCAL_SETTING_CHANGE_EVENT = 'cursor-app:local-setting-change';

function readKey<T>(key: string, opts: UseLocalSettingOptions<T>): T {
  if (typeof window === 'undefined') return opts.defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return opts.defaultValue;
    const parsed = (opts.deserialize ?? JSON.parse)(raw);
    if (opts.validate && !opts.validate(parsed)) return opts.defaultValue;
    return parsed as T;
  } catch {
    return opts.defaultValue;
  }
}

export function useLocalSetting<T>(
  key: string,
  options: UseLocalSettingOptions<T>,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  // Stash options in a ref so the read-callback identity stays stable across renders.
  const optsRef = useRef(options);
  optsRef.current = options;

  const [value, setValue] = useState<T>(() => readKey(key, optsRef.current));

  // Reload when key changes.
  useEffect(() => {
    setValue(readKey(key, optsRef.current));
  }, [key]);

  // Cross-tab and intra-tab sync.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setValue(readKey(key, optsRef.current));
    };
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string }>).detail;
      if (!detail || detail.key !== key) return;
      setValue(readKey(key, optsRef.current));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_SETTING_CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_SETTING_CHANGE_EVENT, onCustom);
    };
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        if (typeof window !== 'undefined') {
          try {
            const serialize = optsRef.current.serialize ?? JSON.stringify;
            window.localStorage.setItem(key, serialize(resolved));
            window.dispatchEvent(
              new CustomEvent(LOCAL_SETTING_CHANGE_EVENT, { detail: { key } }),
            );
          } catch {
            // Quota/SecurityError — keep React state but accept that other tabs/components
            // won't notice until the next storage event or a manual reload.
          }
        }
        return resolved;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent(LOCAL_SETTING_CHANGE_EVENT, { detail: { key } }));
      } catch {
        /* noop */
      }
    }
    setValue(optsRef.current.defaultValue);
  }, [key]);

  return [value, set, clear];
}
