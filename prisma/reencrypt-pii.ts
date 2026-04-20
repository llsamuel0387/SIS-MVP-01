/**
 * PII re-encryption script — run after rotating PERSON_DATA_KEY_BASE64.
 *
 * ──────────────────────────────────────────────────────────────
 * PREREQUISITES — do these before running the script
 * ──────────────────────────────────────────────────────────────
 * 1. Back up the database first. This script is transactional, but a
 *    backup is the only way to recover if something goes wrong outside
 *    the transaction (e.g. a bug in this script corrupts decryption).
 *
 * 2. Stop the application server. Running re-encryption while the app
 *    is writing new data can cause rows encrypted with the new key to
 *    be overwritten with old-key ciphertexts.
 *
 * 3. Set environment variables:
 *      PERSON_DATA_KEY_BASE64      = NEW key  (openssl rand -base64 32)
 *      PERSON_DATA_KEY_PREV_BASE64 = OLD key  (the value you are replacing)
 *    If PII_INDEX_KEY_BASE64 is also rotating, set the new value here
 *    and the script will re-derive all email lookup indices automatically.
 *
 * ──────────────────────────────────────────────────────────────
 * WHAT THIS SCRIPT RE-ENCRYPTS
 * ──────────────────────────────────────────────────────────────
 *   - PersonSection blobs (identity, address, photo, segmentation, …)
 *   - UserProfile encrypted string fields (names, addresses, nationality, …)
 *   - UserProfile email lookup indices (re-derived from PersonSection identity)
 *   - InformationChangeRequest encrypted fields (requestedEmail, notes, …)
 *
 * All operations run inside a single database transaction.
 * If anything fails the entire transaction is rolled back and the
 * database is left unchanged.
 *
 * ──────────────────────────────────────────────────────────────
 * AFTER A SUCCESSFUL RUN
 * ──────────────────────────────────────────────────────────────
 * 1. Start the application and verify it works correctly (login, profile
 *    display, certificate issuance, information-change requests).
 * 2. Only after confirming everything works, remove PERSON_DATA_KEY_PREV_BASE64
 *    from your environment / secrets manager.
 *    ⚠ Do NOT remove it before verifying — it is the only way to decrypt
 *      data that was encrypted with the old key if verification fails.
 * 3. If you rotated PII_INDEX_KEY_BASE64 as well, the old index values are
 *    no longer in the database after this script runs. Removing
 *    PII_INDEX_KEY_PREV_BASE64 (if you added one) follows the same rule.
 *
 * Run via: npm run db:reencrypt-pii
 */

import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";
import {
  encryptSensitiveField,
  decryptSensitiveField,
  isEmailLookupIndex,
  toEmailLookupIndex
} from "../src/lib/pii-field";
import { decryptPersonSectionPayload, upsertPersonSection } from "../src/lib/person-data";
import type { PersonSectionDb } from "../src/lib/person-data";

const prisma = new PrismaClient();

function maskKey(envVar: string): string {
  const raw = process.env[envVar];
  if (!raw) return "✗ NOT SET";
  return `✓ …${raw.slice(-6)}`;
}

async function promptConfirm(
  sectionCount: number,
  profileCount: number,
  requestCount: number
): Promise<void> {
  console.log("⚠  This will re-encrypt ALL PII in the database.");
  console.log(`   Current key:  PERSON_DATA_KEY_BASE64      ${maskKey("PERSON_DATA_KEY_BASE64")}`);
  console.log(`   Previous key: PERSON_DATA_KEY_PREV_BASE64 ${maskKey("PERSON_DATA_KEY_PREV_BASE64")}`);
  console.log(`   Records to process: PersonSection(${sectionCount}), UserProfile(${profileCount}), InformationChangeRequest(${requestCount})`);
  console.log();

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  await new Promise<void>((resolve, reject) => {
    rl.question('Type "reencrypt" to continue: ', (answer) => {
      rl.close();
      if (answer.trim() === "reencrypt") {
        resolve();
      } else {
        reject(new Error(`Aborted — you typed "${answer.trim()}" instead of "reencrypt".`));
      }
    });
  });
}

const ENC_PREFIX = "enc:v1:";

function reencryptString(value: string | null | undefined): string | null | undefined {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;
  const plain = decryptSensitiveField(value);
  if (!plain) return value;
  return encryptSensitiveField(plain);
}

async function reencryptPersonSections(tx: PersonSectionDb & Pick<PrismaClient, "personSection">): Promise<number> {
  const sections = await tx.personSection.findMany();
  let count = 0;

  for (const section of sections) {
    const payload = decryptPersonSectionPayload(section);
    await upsertPersonSection({ personId: section.personId, sectionKey: section.sectionKey, payload }, tx);
    count++;
  }

  return count;
}

async function reencryptUserProfiles(tx: PrismaClient): Promise<number> {
  const users = await tx.user.findMany({
    include: {
      profile: true,
      person: { include: { sections: true } }
    }
  });

  const PROFILE_FIELDS = [
    "firstNameKo", "lastNameKo", "firstNameEn", "middleNameEn", "lastNameEn",
    "nationality", "phone", "address",
    "termCountry", "termAddressLine1", "termAddressLine2", "termPostCode",
    "homeCountry", "homeAddressLine1", "homeAddressLine2", "homePostCode"
  ] as const;

  let count = 0;

  for (const user of users) {
    const profile = user.profile;
    if (!profile) continue;

    const updates: Record<string, string | null> = {};

    for (const field of PROFILE_FIELDS) {
      const val = (profile as Record<string, unknown>)[field];
      if (typeof val === "string") {
        const next = reencryptString(val);
        if (next !== val) updates[field] = next ?? null;
      }
    }

    // Re-derive email lookup index (needed when PII_INDEX_KEY_BASE64 rotates)
    if (profile.email && isEmailLookupIndex(profile.email)) {
      const identitySection = user.person?.sections.find((s) => s.sectionKey === "identity.v1");
      if (identitySection) {
        const identity = decryptPersonSectionPayload(identitySection);
        const email = typeof identity.email === "string" ? identity.email : null;
        if (email) {
          const newIndex = toEmailLookupIndex(email);
          if (newIndex !== profile.email) updates["email"] = newIndex;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await tx.userProfile.update({ where: { id: profile.id }, data: updates });
    }

    count++;
  }

  return count;
}

async function reencryptInformationChangeRequests(tx: PrismaClient): Promise<number> {
  const requests = await tx.informationChangeRequest.findMany();

  const FIELDS = [
    "requestedEmail",
    "requestedTermCountry", "requestedTermAddressLine1", "requestedTermAddressLine2", "requestedTermPostCode",
    "requestedHomeCountry", "requestedHomeAddressLine1", "requestedHomeAddressLine2", "requestedHomePostCode",
    "requesterNote", "reviewerNote"
  ] as const;

  let count = 0;

  for (const req of requests) {
    const updates: Record<string, string | null> = {};

    for (const field of FIELDS) {
      const val = (req as Record<string, unknown>)[field];
      if (typeof val === "string") {
        const next = reencryptString(val);
        if (next !== val) updates[field] = next ?? null;
      }
    }

    if (Object.keys(updates).length > 0) {
      await tx.informationChangeRequest.update({ where: { id: req.id }, data: updates });
    }

    count++;
  }

  return count;
}

async function main() {
  if (!process.env.PERSON_DATA_KEY_PREV_BASE64) {
    console.error(
      "ERROR: PERSON_DATA_KEY_PREV_BASE64 is not set.\n\n" +
      "  Set PERSON_DATA_KEY_PREV_BASE64 to the OLD key\n" +
      "  and PERSON_DATA_KEY_BASE64 to the NEW key, then re-run.\n"
    );
    process.exit(1);
  }

  const [sectionCount, profileCount, requestCount] = await Promise.all([
    prisma.personSection.count(),
    prisma.user.count({ where: { profile: { isNot: null } } }),
    prisma.informationChangeRequest.count()
  ]);

  await promptConfirm(sectionCount, profileCount, requestCount);

  console.log("\nStarting re-encryption inside a single transaction...");
  console.log("If anything fails the database will be rolled back to its original state.\n");

  await prisma.$transaction(
    async (tx) => {
      const sectionCount = await reencryptPersonSections(tx as unknown as PersonSectionDb & PrismaClient);
      console.log(`  PersonSection:              ${sectionCount} rows re-encrypted`);

      const profileCount = await reencryptUserProfiles(tx as unknown as PrismaClient);
      console.log(`  UserProfile:                ${profileCount} rows processed`);

      const requestCount = await reencryptInformationChangeRequests(tx as unknown as PrismaClient);
      console.log(`  InformationChangeRequest:   ${requestCount} rows processed`);
    },
    { timeout: 120_000 }
  );

  console.log("\nRe-encryption committed successfully.");
  console.log("\nNext steps:");
  console.log("  1. Start the app and verify login, profile display, and data access work correctly.");
  console.log("  2. Once verified, remove PERSON_DATA_KEY_PREV_BASE64 from your environment/secrets.");
  console.log("     ⚠ Do NOT remove it before verifying — it cannot be recovered after removal.");
}

main()
  .catch((e) => {
    console.error("\nRe-encryption FAILED. The database transaction was rolled back — no data was changed.\n");
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
