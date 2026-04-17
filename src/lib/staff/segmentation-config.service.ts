import type { SessionUser } from "@/lib/authz";
import { ERROR_CODES } from "@/lib/api-error";
import { canManageDepartmentPathwaySettings } from "@/lib/department-pathway-policy";
import {
  findSegmentationDeletionConflicts,
  getStudentSegmentationConfig,
  upsertStudentSegmentationConfig
} from "@/lib/student-segmentation-config";
import type { StudentSegmentationConfig } from "@/lib/student-segmentation";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export async function getStaffSegmentationConfigForApi() {
  const config = await getStudentSegmentationConfig();
  return config;
}

export type PutStaffSegmentationConfigResult =
  | { ok: true; config: StudentSegmentationConfig }
  | { ok: false; code: ErrorCode; details?: Record<string, unknown> };

export async function putStaffSegmentationConfigForApi(input: {
  actor: SessionUser;
  config: StudentSegmentationConfig;
}): Promise<PutStaffSegmentationConfigResult> {
  if (!canManageDepartmentPathwaySettings({ role: input.actor.role, staffTier: input.actor.staffTier })) {
    return { ok: false, code: ERROR_CODES.AUTH_FORBIDDEN as ErrorCode };
  }

  const conflicts = await findSegmentationDeletionConflicts(input.config);
  if (conflicts.departments.length > 0 || conflicts.pathways.length > 0) {
    return {
      ok: false,
      code: ERROR_CODES.VALIDATION_SEGMENTATION_IN_USE as ErrorCode,
      details: { departments: conflicts.departments, pathways: conflicts.pathways }
    };
  }

  const config = await upsertStudentSegmentationConfig({
    config: input.config,
    actorUserId: input.actor.id
  });

  return { ok: true, config };
}
