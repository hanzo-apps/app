/**
 * A real IAM, in-process.
 *
 * Auth tests are only worth anything if the tokens are real: signed by a key the
 * app has to go and fetch, with claims it has to actually verify. So this stands
 * up an RS256 key pair, serves OIDC discovery + JWKS from it over MSW, and mints
 * tokens shaped exactly like the ones hanzo.id issues (verified against a live
 * token: uuid `sub`, `owner`/`organization` claims, `aud` = the client id).
 *
 * That makes the interesting cases expressible: a token whose payload is right
 * but whose SIGNATURE is forged, and a genuinely-signed token minted for a
 * DIFFERENT Hanzo app. Both are indistinguishable from a valid one to anything
 * that merely decodes.
 */
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose';
import { http, HttpResponse } from 'msw';

export const IAM = 'https://iam.test';
export const CLIENT_ID = 'hanzo-app';

let priv: CryptoKey;
let jwk: Record<string, unknown>;

/** Generate the key pair once; safe to await repeatedly. */
async function keys() {
  if (!priv) {
    const pair = await generateKeyPair('RS256', { extractable: true });
    priv = pair.privateKey;
    jwk = { ...(await exportJWK(pair.publicKey)), alg: 'RS256', use: 'sig', kid: 'test-key' };
  }
  return { priv, jwk };
}

/** The OIDC discovery document this fixture's IAM serves. */
export async function discovery() {
  await keys();
  return { issuer: IAM, jwks_uri: `${IAM}/v1/iam/.well-known/jwks` };
}

/** The public key set, as IAM's JWKS endpoint would return it. */
export async function jwks() {
  return { keys: [(await keys()).jwk] };
}

/** True when a URL is one of the two IAM discovery/JWKS endpoints. */
export function isDiscoveryUrl(url: string) {
  return url.includes('/.well-known/openid-configuration') || url.includes('/.well-known/jwks');
}

/** MSW handlers for OIDC discovery + JWKS. Register before minting. */
export async function iamHandlers() {
  await keys();
  return [
    http.get(`${IAM}/.well-known/openid-configuration`, async () => HttpResponse.json(await discovery())),
    http.get(`${IAM}/v1/iam/.well-known/jwks`, async () => HttpResponse.json(await jwks())),
  ];
}

export interface MintOptions {
  sub?: string;
  owner?: string;
  email?: string;
  name?: string;
  aud?: string;
  /** Seconds from now until expiry; negative mints an already-expired token. */
  ttl?: number;
}

/** A genuinely-signed IAM access token, shaped like hanzo.id's. */
export async function mint(o: MintOptions = {}): Promise<string> {
  await keys();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    owner: o.owner ?? 'acme',
    organization: o.owner ?? 'acme',
    email: o.email ?? 'someone@acme.test',
    name: o.name ?? 'Someone',
    azp: o.aud ?? CLIENT_ID,
    tokenType: 'access-token',
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(IAM)
    .setAudience(o.aud ?? CLIENT_ID)
    .setSubject(o.sub ?? '11111111-2222-3333-4444-555555555555')
    .setIssuedAt(now)
    .setExpirationTime(now + (o.ttl ?? 3600))
    .sign(priv);
}

/**
 * The same token with its signature replaced — the payload still decodes
 * perfectly, which is precisely why decoding is not verifying.
 */
export function forge(token: string): string {
  const [header, payload] = token.split('.');
  return `${header}.${payload}.${'A'.repeat(342)}`;
}

/** Rewrite a claim and re-sign nothing — a self-made token, no IAM involved. */
export async function selfSigned(claims: Record<string, unknown>): Promise<string> {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  })}.`;
}
