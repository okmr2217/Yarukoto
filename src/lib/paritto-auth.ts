import { jwtVerify, createRemoteJWKSet } from "jose";

const PARITTO_AUTH_URL = process.env.PARITTO_AUTH_URL!;
const CLIENT_ID = process.env.PARITTO_CLIENT_ID!;
const CLIENT_SECRET = process.env.PARITTO_CLIENT_SECRET!;

let _jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
function getJwks() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(`${PARITTO_AUTH_URL}/api/auth/jwks`));
  }
  return _jwks;
}

export async function verifyJwt(token: string): Promise<{ sub: string; email: string; name?: string }> {
  const { payload } = await jwtVerify(token, getJwks());
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string | undefined,
  };
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; email: string; name?: string }> {
  const res = await fetch(`${PARITTO_AUTH_URL}/api/auth/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Userinfo request failed: ${res.status}`);
  }
  return res.json() as Promise<{ sub: string; email: string; name?: string }>;
}

export function buildAuthorizationUrl(state: string, redirectUri: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    resource: CLIENT_ID,
  });
  return `${PARITTO_AUTH_URL}/api/auth/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${PARITTO_AUTH_URL}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      resource: CLIENT_ID,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${PARITTO_AUTH_URL}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      resource: CLIENT_ID,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }

  return res.json();
}
