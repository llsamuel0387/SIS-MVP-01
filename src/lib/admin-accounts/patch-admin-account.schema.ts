import { z } from "zod";
import { studentSegmentationPatchSchema } from "@/lib/validation";

/**
 * PATCH `/api/admin/accounts/[userId]` envelope. `status` / `staffTier` / `enrollmentStatus` are accepted as
 * strings here so invalid values reach the service and map to `ACCOUNT_INVALID_STATUS` (legacy behavior).
 * Profile body is validated in the service once the target role is known.
 */
export const adminAccountUserPatchBodySchema = z
  .object({
    status: z.string().optional(),
    staffTier: z.string().optional(),
    enrollmentStatus: z.string().optional(),
    segmentation: studentSegmentationPatchSchema.optional(),
    profile: z.unknown().optional()
  })
  .superRefine((data, ctx) => {
    const hasProfile = data.profile !== undefined;
    const hasSeg = data.segmentation !== undefined;
    const hasControl = data.status !== undefined || data.staffTier !== undefined || data.enrollmentStatus !== undefined;
    if (hasProfile && (hasSeg || hasControl)) {
      ctx.addIssue({
        code: "custom",
        path: ["profile"],
        message: "profile_cannot_combine_with_other_updates"
      });
    }
    const hasAny =
      hasProfile || hasSeg || data.status !== undefined || data.staffTier !== undefined || data.enrollmentStatus !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_patch" });
    }
  });

export type AdminAccountUserPatchBody = z.infer<typeof adminAccountUserPatchBodySchema>;
