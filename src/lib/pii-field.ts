import crypto from "crypto";

const ENCRYPTED_PREFIX = "enc:v1";
const EMAIL_INDEX_PREFIX = "idx:v1";

function getDataKey(): Buffer {
  const raw = process.env.PERSON_DATA_KEY_BASE64;
  if (!raw) {
    throw new Error("PERSON_DATA_KEY_BASE64 is required");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("PERSON_DATA_KEY_BASE64 must decode to 32 bytes");
  }
  return key;
}

function getIndexKey(): Buffer {
  const raw = process.env.PII_INDEX_KEY_BASE64 ?? process.env.PERSON_DATA_KEY_BASE64;
  if (!raw) {
    throw new Error("PII_INDEX_KEY_BASE64 or PERSON_DATA_KEY_BASE64 is required");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("PII index key must decode to 32 bytes");
  }
  return key;
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

export function decryptSensitiveField(value: string): string {
  if (!value) {
    return "";
  }
  const prefix = `${ENCRYPTED_PREFIX}:`;
  if (!value.startsWith(prefix)) {
    return value;
  }
  try {
    const payload = value.slice(prefix.length);
    const [nonceB64, tagB64, cipherB64] = payload.split(":");
    if (!nonceB64 || !tagB64 || !cipherB64) {
      return "";
    }
    const key = getDataKey();
    const nonce = Buffer.from(nonceB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const encrypted = Buffer.from(cipherB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
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
