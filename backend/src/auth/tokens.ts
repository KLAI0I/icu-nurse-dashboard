import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

const enc = new TextEncoder();

export type AccessPayload = { sub: string; role: "ADMIN" | "STAFF"; staffId?: string | null };

export async function signAccessToken(payload: AccessPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${config.accessTtlMin}m`)
    .sign(enc.encode(config.jwtAccessSecret));
}

export async function signRefreshToken(payload: { sub: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${config.refreshTtlDays}d`)
    .sign(enc.encode(config.jwtRefreshSecret));
}

export async function verifyAccess(token: string) {
  const { payload } = await jwtVerify(token, enc.encode(config.jwtAccessSecret));
  return payload as any;
}

export async function verifyRefresh(token: string) {
  const { payload } = await jwtVerify(token, enc.encode(config.jwtRefreshSecret));
  return payload as any;
}
