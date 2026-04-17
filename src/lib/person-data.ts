import crypto from "crypto";
import type { PersonSection, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Delegate subset so `upsertPersonSection` can run inside `prisma.$transaction`. */
export type PersonSectionDb = Pick<PrismaClient, "personSection">;

function getEncryptionKey(): Buffer {
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

export function decryptPersonSectionPayload(section: Pick<PersonSection, "cipherText" | "nonce" | "authTag">): Record<string, unknown> {
  const key = getEncryptionKey();
  const nonce = Buffer.from(section.nonce, "base64");
  const authTag = Buffer.from(section.authTag, "base64");
  const encrypted = Buffer.from(section.cipherText, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");

  return JSON.parse(plain) as Record<string, unknown>;
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
