import { Prisma, PrismaClient } from "@prisma/client";
import {
  encryptNullableSensitiveField,
  isEmailLookupIndex,
  toEmailLookupIndex
} from "../src/lib/pii-field";

const prisma = new PrismaClient();

function shouldEncrypt(value?: string | null): boolean {
  if (!value) {
    return false;
  }
  return !value.startsWith("enc:v1:");
}

async function backfillUserProfiles() {
  const rows = await prisma.userProfile.findMany();
  let updated = 0;

  for (const row of rows) {
    const next: Prisma.UserProfileUpdateInput = {};

    if (shouldEncrypt(row.firstNameKo)) next.firstNameKo = encryptNullableSensitiveField(row.firstNameKo) ?? "";
    if (shouldEncrypt(row.lastNameKo)) next.lastNameKo = encryptNullableSensitiveField(row.lastNameKo) ?? "";
    if (shouldEncrypt(row.firstNameEn)) next.firstNameEn = encryptNullableSensitiveField(row.firstNameEn);
    if (shouldEncrypt(row.middleNameEn)) next.middleNameEn = encryptNullableSensitiveField(row.middleNameEn);
    if (shouldEncrypt(row.lastNameEn)) next.lastNameEn = encryptNullableSensitiveField(row.lastNameEn);
    if (shouldEncrypt(row.nationality)) next.nationality = encryptNullableSensitiveField(row.nationality);
    if (shouldEncrypt(row.termCountry)) next.termCountry = encryptNullableSensitiveField(row.termCountry);
    if (shouldEncrypt(row.termAddressLine1)) next.termAddressLine1 = encryptNullableSensitiveField(row.termAddressLine1);
    if (shouldEncrypt(row.termAddressLine2)) next.termAddressLine2 = encryptNullableSensitiveField(row.termAddressLine2);
    if (shouldEncrypt(row.termPostCode)) next.termPostCode = encryptNullableSensitiveField(row.termPostCode);
    if (shouldEncrypt(row.homeCountry)) next.homeCountry = encryptNullableSensitiveField(row.homeCountry);
    if (shouldEncrypt(row.homeAddressLine1)) next.homeAddressLine1 = encryptNullableSensitiveField(row.homeAddressLine1);
    if (shouldEncrypt(row.homeAddressLine2)) next.homeAddressLine2 = encryptNullableSensitiveField(row.homeAddressLine2);
    if (shouldEncrypt(row.homePostCode)) next.homePostCode = encryptNullableSensitiveField(row.homePostCode);

    if (row.email && !isEmailLookupIndex(row.email)) {
      next.email = toEmailLookupIndex(row.email);
    }
    if (row.dateOfBirth) {
      next.dateOfBirth = null;
    }

    if (Object.keys(next).length > 0) {
      await prisma.userProfile.update({
        where: { id: row.id },
        data: next
      });
      updated += 1;
    }
  }

  return updated;
}

async function backfillInformationRequests() {
  const rows = await prisma.informationChangeRequest.findMany();
  let updated = 0;

  for (const row of rows) {
    const next: Prisma.InformationChangeRequestUpdateInput = {};
    if (shouldEncrypt(row.requestedEmail)) next.requestedEmail = encryptNullableSensitiveField(row.requestedEmail);
    if (shouldEncrypt(row.requestedTermCountry)) next.requestedTermCountry = encryptNullableSensitiveField(row.requestedTermCountry);
    if (shouldEncrypt(row.requestedTermAddressLine1))
      next.requestedTermAddressLine1 = encryptNullableSensitiveField(row.requestedTermAddressLine1);
    if (shouldEncrypt(row.requestedTermAddressLine2))
      next.requestedTermAddressLine2 = encryptNullableSensitiveField(row.requestedTermAddressLine2);
    if (shouldEncrypt(row.requestedTermPostCode)) next.requestedTermPostCode = encryptNullableSensitiveField(row.requestedTermPostCode);
    if (shouldEncrypt(row.requestedHomeCountry)) next.requestedHomeCountry = encryptNullableSensitiveField(row.requestedHomeCountry);
    if (shouldEncrypt(row.requestedHomeAddressLine1))
      next.requestedHomeAddressLine1 = encryptNullableSensitiveField(row.requestedHomeAddressLine1);
    if (shouldEncrypt(row.requestedHomeAddressLine2))
      next.requestedHomeAddressLine2 = encryptNullableSensitiveField(row.requestedHomeAddressLine2);
    if (shouldEncrypt(row.requestedHomePostCode)) next.requestedHomePostCode = encryptNullableSensitiveField(row.requestedHomePostCode);
    if (shouldEncrypt(row.requesterNote)) next.requesterNote = encryptNullableSensitiveField(row.requesterNote);
    if (shouldEncrypt(row.reviewerNote)) next.reviewerNote = encryptNullableSensitiveField(row.reviewerNote);

    if (Object.keys(next).length > 0) {
      await prisma.informationChangeRequest.update({
        where: { id: row.id },
        data: next
      });
      updated += 1;
    }
  }

  return updated;
}

async function run() {
  const profileUpdated = await backfillUserProfiles();
  const requestUpdated = await backfillInformationRequests();

  console.log(`[backfill:pii] userProfile rows updated: ${profileUpdated}`);
  console.log(`[backfill:pii] informationChangeRequest rows updated: ${requestUpdated}`);
}

run()
  .catch((error) => {
    console.error("[backfill:pii] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
