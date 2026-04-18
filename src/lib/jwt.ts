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

function resolveJwtSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name]?.trim();
  if (value && value.length >= 32 && !/^REPLACE_WITH_/i.test(value)) {
    return value;
  }
  throw new Error(`${name} is required and must be at least 32 characters long`);
}

const ACCESS_SECRET = resolveJwtSecret("JWT_ACCESS_SECRET");
const REFRESH_SECRET = resolveJwtSecret("JWT_REFRESH_SECRET");

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
