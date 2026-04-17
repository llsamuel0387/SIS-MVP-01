import jwt from "jsonwebtoken";
import type { PermissionCode, RoleCode } from "@/lib/permissions";

export type AuthTokenPayload = {
  sub: string;
  loginId: string;
  role: RoleCode;
  studentId?: string;
  assignedStudentIds?: string[];
  permissions?: PermissionCode[];
  tokenType: "access" | "refresh";
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function resolveJwtSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET", devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value && value.length >= 32) {
    return value;
  }
  if (IS_PRODUCTION) {
    throw new Error(`${name} is required in production and must be at least 32 characters long`);
  }
  return value && value.length > 0 ? value : devFallback;
}

const ACCESS_SECRET = resolveJwtSecret("JWT_ACCESS_SECRET", "dev_access_secret_change_me");
const REFRESH_SECRET = resolveJwtSecret("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me");

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

export function signAccessToken(payload: Omit<AuthTokenPayload, "tokenType">): string {
  return jwt.sign({ ...payload, tokenType: "access" }, ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TTL_SECONDS
  });
}

export function signRefreshToken(payload: Omit<AuthTokenPayload, "tokenType">): string {
  return jwt.sign({ ...payload, tokenType: "refresh" }, REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: REFRESH_TTL_SECONDS
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ["HS256"] }) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: ["HS256"] }) as AuthTokenPayload;
}

export const TOKEN_TTL = {
  accessSeconds: ACCESS_TTL_SECONDS,
  refreshSeconds: REFRESH_TTL_SECONDS
};
