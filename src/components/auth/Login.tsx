import { Login as IamLogin } from '@hanzo/iam/views';

/**
 * Embedded Hanzo IAM login — in-app, on-domain (no redirect to iam.hanzo.ai).
 * Uses the canonical @hanzo/iam/views <Login> (PKCE; password + email-code).
 * On success the credential flow redirects to /auth/callback, which completes
 * the token exchange. Replaces the prior localStorage demo stub.
 */
const Login = () => (
  <div className="min-h-screen bg-[var(--black)] text-[var(--white)] flex items-center justify-center p-4">
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to Hanzo</h1>
        <p className="text-neutral-400 mt-2">Sign in to your account</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <IamLogin
          serverUrl={import.meta.env.VITE_HANZO_IAM_URL || 'https://iam.hanzo.ai'}
          clientId={import.meta.env.VITE_HANZO_IAM_APP || 'hanzo-app'}
          organization={import.meta.env.VITE_HANZO_IAM_ORG || 'hanzo'}
          redirectUri={`${window.location.origin}/auth/callback`}
          state=""
        />
      </div>

      <div className="text-center text-sm text-neutral-400">
        Don't have an account?{' '}
        <a href="/signup" className="text-purple-400 hover:underline">
          Sign up
        </a>
      </div>
    </div>
  </div>
);

export default Login;
