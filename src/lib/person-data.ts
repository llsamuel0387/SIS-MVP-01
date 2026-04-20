import crypto from "crypto";
import type { PersonSection, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Delegate subset so `upsertPersonSection` can run inside `prisma.$transaction`. */
export type PersonSectionDb = Pick<PrismaClient, "personSection">;

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

function getEncryptionKey(): Buffer {
  return resolveKey("PERSON_DATA_KEY_BASE64");
}

function getPrevEncryptionKey(): Buffer | null {
  return tryResolveKey("PERSON_DATA_KEY_PREV_BASE64");
}

function encryptJson(payload: Record<string, unknown>) {
  const key = getEncryptionKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  const plainText = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    cipherText: encrypted.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

function decryptJsonWith(
  key: Buffer,
  section: Pick<PersonSection, "cipherText" | "nonce" | "authTag">
): Record<string, unknown> {
  const nonce = Buffer.from(section.nonce, "base64");
  const authTag = Buffer.from(section.authTag, "base64");
  const encrypted = Buffer.from(section.cipherText, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as Record<string, unknown>;
}

export function decryptPersonSectionPayload(
  section: Pick<PersonSection, "cipherText" | "nonce" | "authTag">
): Record<string, unknown> {
  try {
    return decryptJsonWith(getEncryptionKey(), section);
  } catch {
    const prev = getPrevEncryptionKey();
    if (prev) {
      return decryptJsonWith(prev, section);
    }
    throw new Error("PersonSection decryption failed with all available keys");
  }
}

export async function upsertPersonSection(
  input: {
    personId: string;
    sectionKey: string;
    payload: Record<string, unknown>;
  },
  db: PersonSectionDb = prisma
): Promise<void> {
  const encrypted = encryptJson(input.payload);
  await db.personSection.upsert({
    where: {
      personId_sectionKey: {
        personId: input.personId,
        sectionKey: input.sectionKey
      }
    },
    update: {
      version: 1,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag
    },
    create: {
      personId: input.personId,
      sectionKey: input.sectionKey,
      version: 1,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag
    }
  });
}
