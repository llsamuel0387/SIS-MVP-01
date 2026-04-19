import type { AuditAction } from "@/lib/audit";
import type { SessionUser } from "@/lib/authz";
import { ERROR_CODES } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { decryptPersonSectionPayload } from "@/lib/person-data";
import { getStudentSegmentationConfig } from "@/lib/student-segmentation-config";
import {
  createEmptyStudentSegmentation,
  mergeStudentSegmentationPatchForAdmin,
  readStudentSegmentationSectionPayload,
  validateStudentSegmentationAgainstConfig
} from "@/lib/student-segmentation";
import { STAFF_TIER_PERMISSION_GRANTS } from "@/lib/permissions";
import { getRolePermissions } from "@/lib/user-admin";
import { invalidateAllUserSessions } from "@/lib/session";
import type { AdminAccountUserPatchBody } from "@/lib/admin-accounts/patch-admin-account.schema";
import {
  assembleAdminAccountUserDetailJson,
  buildPatchAdminAccountAudit,
  buildPatchAdminAccountResponseJson,
  parsePatchProfilePayload,
  validatePatchAgainstTargetAndActor,
  validatePatchEnumFields,
  validateSegmentationPayload,
  type AdminAccountPatchUpdatedRecord,
  type AdminAccountUserDetailRecord,
  type ParsedPatchProfiles
} from "@/lib/admin-accounts/admin-account-user.helpers";
import {
  applyProfilePatchInTx,
  applySegmentationPatchInTx,
  applyUserControlFieldsInTx,
  DuplicateEmailOnProfileUpdateError,
  InvalidProfilePhotoError
} from "@/lib/admin-accounts/admin-account-user-patch-tx.helpers";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type AdminAccountUserDetailJson = ReturnType<typeof assembleAdminAccountUserDetailJson>;

export async function getAdminAccountUserDetail(
  userId: string
): Promise<{ ok: true; json: AdminAccountUserDetailJson } | { ok: false; code: ErrorCode }> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, staff: true, student: true, profile: true, person: { include: { sections: true } } }
  });

  if (!target) {
    return { ok: false, code: ERROR_CODES.RESOURCE_USER_NOT_FOUND };
  }

  const rolePermissions = await getRolePermissions(target.roleId);
  const tierPermissions = target.staff?.staffTier ? STAFF_TIER_PERMISSION_GRANTS[target.staff.staffTier] : [];
  const permissions = Array.from(new Set([...rolePermissions, ...tierPermissions]));

  return { ok: true, json: assembleAdminAccountUserDetailJson(target as AdminAccountUserDetailRecord, permissions) };
}

export type PatchAdminAccountUserSuccess = {
  json: ReturnType<typeof buildPatchAdminAccountResponseJson>;
  audit: {
    action: AuditAction;
    detail: Record<string, unknown>;
  };
};

export async function patchAdminAccountUser(
  actor: SessionUser,
  userId: string,
  body: AdminAccountUserPatchBody
): Promise<{ ok: true; data: PatchAdminAccountUserSuccess } | { ok: false; code: ErrorCode }> {
  if (userId === actor.id) {
    return { ok: false, code: ERROR_CODES.ACCOUNT_SELF_ACTION_BLOCKED };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, staff: true, student: true, profile: true, person: { include: { sections: true } } }
  });
  if (!target) {
    return { ok: false, code: ERROR_CODES.RESOURCE_USER_NOT_FOUND };
  }

  const detailRecord = target as AdminAccountUserDetailRecord;

  const enumErr = validatePatchEnumFields(body);
  if (enumErr) {
    return { ok: false, code: enumErr };
  }

  const hasProfilePayload = body.profile !== undefined;
  const targetActorErr = validatePatchAgainstTargetAndActor(actor, detailRecord, body, hasProfilePayload);
  if (targetActorErr) {
    return { ok: false, code: targetActorErr };
  }

  const segErr = validateSegmentationPayload(body);
  if (segErr) {
    return { ok: false, code: segErr };
  }
  if (body.staffTier !== undefined && detailRecord.role.code === "STAFF" && !detailRecord.staff) {
    return { ok: false, code: ERROR_CODES.RESOURCE_STAFF_NOT_FOUND };
  }
  if (body.segmentation && !target.person) {
    return { ok: false, code: ERROR_CODES.RESOURCE_USER_NOT_FOUND };
  }
  if (body.segmentation !== undefined && detailRecord.person && detailRecord.role.code === "STUDENT") {
    const segmentationSection = detailRecord.person.sections.find((s) => s.sectionKey === "student-segmentation.v1");
    const currentValues = segmentationSection
      ? readStudentSegmentationSectionPayload(decryptPersonSectionPayload(segmentationSection)).values
      : createEmptyStudentSegmentation();
    const merged = mergeStudentSegmentationPatchForAdmin(currentValues, body.segmentation);
    const config = await getStudentSegmentationConfig();
    if (!validateStudentSegmentationAgainstConfig(merged, config).ok) {
      return { ok: false, code: ERROR_CODES.VALIDATION_SEGMENTATION_INVALID_CHOICE };
    }
  }

  let parsedProfiles: ParsedPatchProfiles | null = null;
  if (hasProfilePayload) {
    const parsed = parsePatchProfilePayload(target.role.code, body.profile);
    if (!parsed.ok) {
      return { ok: false, code: parsed.code };
    }
    parsedProfiles = parsed.parsed;
  }

  const validStatus = body.status === "ACTIVE" || body.status === "INACTIVE";

  try {
    await prisma.$transaction(async (tx) => {
      if (body.segmentation && target.person) {
        await applySegmentationPatchInTx(tx, target.person, body.segmentation);
      }

      if (hasProfilePayload && parsedProfiles) {
        await applyProfilePatchInTx(tx, {
          userId,
          target: detailRecord,
          parsed: parsedProfiles
        });
      }

      await applyUserControlFieldsInTx(tx, {
        userId,
        body,
        validStatus
      });
    });
  } catch (e) {
    if (e instanceof DuplicateEmailOnProfileUpdateError) {
      return { ok: false, code: ERROR_CODES.ACCOUNT_ALREADY_EXISTS };
    }
    if (e instanceof InvalidProfilePhotoError) {
      return { ok: false, code: ERROR_CODES.VALIDATION_INVALID_PAYLOAD };
    }
    throw e;
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, staff: true, student: true }
  });
  if (!updated) {
    return { ok: false, code: ERROR_CODES.RESOURCE_USER_NOT_FOUND };
  }

  const updatedRecord = updated as AdminAccountPatchUpdatedRecord;

  if (body.status && body.status !== "ACTIVE") {
    await invalidateAllUserSessions(userId);
  }

  const audit = buildPatchAdminAccountAudit(body, updatedRecord);

  return {
    ok: true,
    data: {
      json: buildPatchAdminAccountResponseJson(updatedRecord),
      audit
    }
  };
}

export type DeleteAdminAccountUserSuccess = {
  audit: {
    action: AuditAction;
    detail: Record<string, unknown>;
  };
};

export async function deleteAdminAccountUser(
  actor: SessionUser,
  userId: string
): Promise<{ ok: true; data: DeleteAdminAccountUserSuccess } | { ok: false; code: ErrorCode }> {
  if (userId === actor.id) {
    return { ok: false, code: ERROR_CODES.ACCOUNT_SELF_ACTION_BLOCKED };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  if (!target) {
    return { ok: false, code: ERROR_CODES.RESOURCE_USER_NOT_FOUND };
  }

  await invalidateAllUserSessions(userId);
  await prisma.user.delete({ where: { id: userId } });

  return {
    ok: true,
    data: {
      audit: {
        action: "account_delete",
        detail: { loginId: target.loginId, role: target.role.code }
      }
    }
  };
}
