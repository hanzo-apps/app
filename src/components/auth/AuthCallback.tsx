import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIam } from '@hanzo/iam/react';

/**
 * OAuth/OIDC callback — completes the PKCE token exchange (the @hanzo/iam SDK
 * reads code+state+verifier from the URL/storage) then lands on /account.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleCallback } = useIam();

  useEffect(() => {
    let cancelled = false;
    handleCallback()
      .then(() => { if (!cancelled) navigate('/account', { replace: true }); })
      .catch(() => { if (!cancelled) navigate('/login', { replace: true }); });
    return () => { cancelled = true; };
  }, [handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--black)] text-[var(--white)]">
      <p className="text-neutral-300">Signing you in…</p>
    </div>
  );
}
