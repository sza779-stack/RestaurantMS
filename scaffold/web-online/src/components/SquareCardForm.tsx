import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

declare global {
  interface Window {
    Square?: any;
  }
}

export type SquareCardHandle = {
  tokenize: () => Promise<string>;
};

type Props = {
  applicationId: string;
  locationId: string;
  disabled?: boolean;
};

/** Square Web Payments — card nonce is sent to `/payments/square/charge`. */
const SquareCardForm = forwardRef<SquareCardHandle, Props>(
  ({ applicationId, locationId, disabled }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const paymentsRef = useRef<any>(null);
    const cardRef = useRef<any>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      tokenize: async () => {
        if (!cardRef.current) throw new Error('Square card field is still loading.');
        const res = await cardRef.current.tokenize();
        if (res.status !== 'OK' || !res.token) {
          const errs = Array.isArray(res.errors)
            ? res.errors.map((e: any) => e.detail).join(' ')
            : '';
          throw new Error(errs || 'Square could not verify this card.');
        }
        return res.token;
      },
    }));

    useEffect(() => {
      if (!applicationId || !locationId || disabled) return;

      let cancelled = false;

      const loadSdk = (): Promise<void> =>
        new Promise((resolve, reject) => {
          if (window.Square) return resolve();
          const s = document.createElement('script');
          s.src = 'https://web.squarecdn.com/v1/square.js';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Square.js'));
          document.head.appendChild(s);
        });

      (async () => {
        try {
          await loadSdk();
          const Sq = window.Square;
          if (!Sq?.payments || cancelled) return;

          paymentsRef.current = await Sq.payments(applicationId, locationId);

          cardRef.current = await paymentsRef.current.card({
            style: {
              '.input-container': {
                borderColor: 'rgba(148,163,184,0.35)',
              },
              'input:is(:focus,:focus-visible)': {
                borderColor: '#818cf8',
              },
              'input:is(.error,.invalid)': {
                borderColor: '#fb7185',
              },
              input: {
                backgroundColor: 'rgba(15,23,42,0.6)',
                color: '#ffffff',
              },
              'input.is-disabled': {
                backgroundColor: 'rgba(15,23,42,0.4)',
              },
            },
          });
          if (hostRef.current) {
            await cardRef.current.attach(hostRef.current);
          }
          if (!cancelled) setReady(true);
        } catch (e: any) {
          console.error('[Square]', e);
          if (!cancelled) setLoadError(e?.message || 'Square unavailable');
        }
      })();

      return () => {
        cancelled = true;
        cardRef.current?.destroy?.()?.catch?.(() => {});
        cardRef.current = null;
      };
    }, [applicationId, locationId, disabled]);

    if (!applicationId || !locationId) {
      return (
        <p className="text-xs text-gray-400 text-center px-4">
          Configure Square Application ID & Location ID in Admin to collect cards online.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {loadError && (
          <p className="text-xs text-rose-300 text-center px-4">{loadError}</p>
        )}
        <div ref={hostRef} className="min-h-[70px]" />
        {!loadError &&
          (ready ? (
            <p className="text-[10px] text-gray-500 text-center">Card field ready</p>
          ) : (
            <p className="text-[10px] text-gray-500 text-center">Loading Square…</p>
          ))}
      </div>
    );
  },
);

SquareCardForm.displayName = 'SquareCardForm';

export default SquareCardForm;
