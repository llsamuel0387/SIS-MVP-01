import type { PersonSection, User, UserProfile, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptNullableSensitiveField } from "@/lib/pii-field";
import { readIdentityFromPersonSections } from "@/lib/person-profile";
import { joinEnglishLegalName, joinKoreanLegalName } from "@/lib/display-name";

export async function getRolePermissions(roleId: string): Promise<string[]> {
  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true }
  });
  return rows.map((row) => row.permission.code);
}

export function sanitizeUserRecord(user: User & { role: { code: string } }): {
  id: string;
  loginId: string;
  role: string;
  status: UserStatus;
} {
  return {
    id: user.id,
    loginId: user.loginId,
    role: user.role.code,
    status: user.status
  };
}

export function getDisplayNameFromProfile(profile?: UserProfile | null): string {
  if (!profile) {
    return "";
  }
  const english = joinEnglishLegalName(
    decryptNullableSensitiveField(profile.firstNameEn),
    decryptNullableSensitiveField(profile.middleNameEn),
    decryptNullableSensitiveField(profile.lastNameEn)
  ).trim();
  if (english.length > 0) {
    return english;
  }
  return joinKoreanLegalName(
    decryptNullableSensitiveField(profile.firstNameKo),
    decryptNullableSensitiveField(profile.lastNameKo)
  ).trim();
}

/** Prefer decrypted identity from Person sections when UserProfile was overwritten or is stale. */
export function getDisplayNameFromUser(
  profile: UserProfile | null | undefined,
  person: { sections?: PersonSection[] | null } | null | undefined
): string {
  const identity = readIdentityFromPersonSections(person?.sections ?? undefined);
  const fromIdentityEn = joinEnglishLegalName(
    identity.firstNameEn,
    identity.middleNameEn,
    identity.lastNameEn
  ).trim();
  const fromIdentityKo = joinKoreanLegalName(identity.firstNameKo, identity.lastNameKo).trim();
  const fromIdentity = fromIdentityEn || fromIdentityKo;
  if (fromIdentity.length > 0) {
    return fromIdentity;
  }
  return getDisplayNameFromProfile(profile ?? null);
}
