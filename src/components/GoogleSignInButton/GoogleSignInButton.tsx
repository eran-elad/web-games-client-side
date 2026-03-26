import { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../../config/apiConfig';
import { loadGoogleScript } from '../../auth/loadGoogleScript';
import { useAuth } from '../../auth/AuthContext';
import './GoogleSignInButton.css';

type Variant = 'default' | 'compact';

export default function GoogleSignInButton({ variant = 'default' }: { variant?: Variant }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { signInWithGoogleCredential } = useAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return;

    const el = containerRef.current;
    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !el) return;
        const google = window.google?.accounts?.id;
        if (!google) return;

        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => {
            if (res.credential) void signInWithGoogleCredential(res.credential);
          },
        });

        google.renderButton(el, {
          type: 'standard',
          theme: 'outline',
          size: variant === 'compact' ? 'medium' : 'large',
          text: 'signin_with',
          width: variant === 'compact' ? '100%' : 280,
        });
      } catch {
        /* script load failure — leave container empty */
      }
    })();

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [signInWithGoogleCredential, variant]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return <div ref={containerRef} className={`google-sign-in-button google-sign-in-button--${variant}`} />;
}
