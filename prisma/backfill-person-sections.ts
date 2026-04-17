import crypto from "crypto";
import { PrismaClient, type PersonType } from "@prisma/client";
import { sanitizeImageUploadBase64 } from "../src/lib/photo-security";
import { toStudentSegmentationSectionPayload } from "../src/lib/student-segmentation";

const prisma = new PrismaClient();

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

  return {
    cipherText: encrypted.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64")
  };
}

async function upsertSection(personId: string, sectionKey: string, payload: Record<string, unknown>) {
  const encrypted = encryptJson(payload);
  await prisma.personSection.upsert({
    where: {
      personId_sectionKey: {
        personId,
        sectionKey
      }
    },
    update: {
      version: 1,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag
    },
    create: {
      personId,
      sectionKey,
      version: 1,
      cipherText: encrypted.cipherText,
      nonce: encrypted.nonce,
      authTag: encrypted.authTag
    }
  });
}

function inferPersonType(input: { roleCode: string; hasStudent: boolean; hasStaff: boolean }): PersonType {
  if (input.roleCode === "ADMIN") {
    return "ADMIN";
  }
  if (input.hasStudent) {
    return "STUDENT";
  }
  if (input.hasStaff) {
    return "STAFF";
  }
  return "STAFF";
}

async function run() {
  const users = await prisma.user.findMany({
    include: {
      role: true,
      profile: true,
      student: true,
      staff: true,
      person: true
    }
  });

  let migratedPeople = 0;
  let sectionWrites = 0;

  for (const user of users) {
    if (!user.profile) {
      continue;
    }

    const person =
      user.person ??
      (await prisma.person.create({
        data: {
          userId: user.id,
          type: inferPersonType({
            roleCode: user.role.code,
            hasStudent: Boolean(user.student),
            hasStaff: Boolean(user.staff)
          })
        }
      }));

    if (!user.person) {
      migratedPeople += 1;
    }

    await upsertSection(person.id, "identity.v1", {
      firstNameKo: user.profile.firstNameKo ?? "",
      lastNameKo: user.profile.lastNameKo ?? "",
      firstNameEn: user.profile.firstNameEn ?? "",
      middleNameEn: user.profile.middleNameEn ?? "",
      lastNameEn: user.profile.lastNameEn ?? "",
      nationality: user.profile.nationality ?? "",
      dateOfBirth: user.profile.dateOfBirth ? user.profile.dateOfBirth.toISOString().slice(0, 10) : "",
      email: user.profile.email ?? ""
    });
    sectionWrites += 1;

    if (user.student) {
      await upsertSection(person.id, "student-address.v1", {
        termTimeAddress: {
          country: user.profile.termCountry ?? "",
          addressLine1: user.profile.termAddressLine1 ?? "",
          addressLine2: user.profile.termAddressLine2 ?? "",
          postCode: user.profile.termPostCode ?? ""
        },
        homeAddress: {
          country: user.profile.homeCountry ?? "",
          addressLine1: user.profile.homeAddressLine1 ?? "",
          addressLine2: user.profile.homeAddressLine2 ?? "",
          postCode: user.profile.homePostCode ?? ""
        }
      });
      sectionWrites += 1;

      await upsertSection(
        person.id,
        "student-segmentation.v1",
        toStudentSegmentationSectionPayload({
          department: user.student.campus ?? "",
          pathway: "",
          classes: [user.student.gradeLevel ?? "", user.student.homeroom ?? ""].map((value) => value.trim()).filter(Boolean)
        })
      );
      sectionWrites += 1;
    }

    if (user.profile.photoUrl?.startsWith("data:image/png;base64,")) {
      const raw = user.profile.photoUrl.slice("data:image/png;base64,".length);
      const safeBase64 = await sanitizeImageUploadBase64(raw);
      await upsertSection(person.id, "photo.v1", {
        mimeType: "image/png",
        imageBase64: safeBase64
      });
      sectionWrites += 1;
    }
  }

  console.log(`[backfill] person created: ${migratedPeople}`);
  console.log(`[backfill] section writes: ${sectionWrites}`);
}

run()
  .catch((error) => {
    console.error("[backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
