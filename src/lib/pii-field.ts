import crypto from "crypto";

const ENCRYPTED_PREFIX = "enc:v1";
const EMAIL_INDEX_PREFIX = "idx:v1";

function resolveKey(envVar: string): Buffer {
  // 1. Env var must be set and non-empty
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`${envVar} is required — generate one with: openssl rand -base64 32`);
  }
  // 2. Must be valid Base64
  if (!/^[A-Za-z0-9+/]+=*$/.test(raw)) {
    throw new Error(`${envVar} is not valid Base64 — generate a correct value with: openssl rand -base64 32`);
  }
  const key = Buffer.from(raw, "base64");
  // 3. Must decode to exactly 32 bytes
  if (key.length !== 32) {
    throw new Error(`${envVar} decoded to ${key.length} bytes but must be exactly 32 — use: openssl rand -base64 32`);
  }
  // 4. Must not be the all-zero placeholder from .env.example
  if (key.every((b) => b === 0)) {
    throw new Error(`${envVar} is the all-zero placeholder — generate a real key: openssl rand -base64 32`);
  }
  return key;
}

function tryResolveKey(envVar: string): Buffer | null {
  const raw = process.env[envVar];
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32 || key.every((b) => b === 0)) return null;
  return key;
}

function getDataKey(): Buffer {
  return resolveKey("PERSON_DATA_KEY_BASE64");
}

function getPrevDataKey(): Buffer | null {
  return tryResolveKey("PERSON_DATA_KEY_PREV_BASE64");
}

function getIndexKey(): Buffer {
  const envVar = process.env.PII_INDEX_KEY_BASE64 ? "PII_INDEX_KEY_BASE64" : "PERSON_DATA_KEY_BASE64";
  return resolveKey(envVar);
}

export function encryptSensitiveField(value: string): string {
  const plain = value.trim();
  if (!plain) {
    return "";
  }
  const key = getDataKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plain, "utf8")), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}:${nonce.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptWithKey(key: Buffer, value: string): string {
  const prefix = `${ENCRYPTED_PREFIX}:`;
  const payload = value.slice(prefix.length);
  const [nonceB64, tagB64, cipherB64] = payload.split(":");
  if (!nonceB64 || !tagB64 || !cipherB64) {
    return "";
  }
  const nonce = Buffer.from(nonceB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(cipherB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function decryptSensitiveField(value: string): string {
  if (!value) {
    return "";
  }
  const prefix = `${ENCRYPTED_PREFIX}:`;
  if (!value.startsWith(prefix)) {
    return value;
  }
  try {
    return decryptWithKey(getDataKey(), value);
  } catch {
    const prev = getPrevDataKey();
    if (prev) {
      try {
        return decryptWithKey(prev, value);
      } catch {
        return "";
      }
    }
    return "";
  }
}

export function encryptNullableSensitiveField(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return encryptSensitiveField(trimmed);
}

export function decryptNullableSensitiveField(value?: string | null): string {
  if (!value) {
    return "";
  }
  return decryptSensitiveField(value);
}

export function toEmailLookupIndex(email: string): string {
  const normalized = email.trim().toLowerCase();
  const digest = crypto.createHmac("sha256", getIndexKey()).update(normalized).digest("base64url");
  return `${EMAIL_INDEX_PREFIX}:${digest}`;
}

export function isEmailLookupIndex(value?: string | null): boolean {
  return Boolean(value && value.startsWith(`${EMAIL_INDEX_PREFIX}:`));
}
