import { SignJWT, jwtVerify } from 'jose';

// ---------- TOKEN ISSUANCE ----------
export async function generateTokens(userId: string, env: Env) {
  const now = Math.floor(Date.now() / 1000);

  const accessToken = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(env.JWT_SECRET));

  const refreshToken = await new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(env.REFRESH_SECRET));

  return { accessToken, refreshToken };
}

// ---------- TOKEN VERIFICATION ----------
export async function verifyToken(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}