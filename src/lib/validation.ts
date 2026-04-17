import { z } from "zod";
import { AUTH_POLICY } from "@/lib/auth-policy";
import { STAFF_TIERS } from "@/lib/permissions";

export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

/** Sign-in: do not enforce stored-password policy length here — short wrong passwords must reach verify and return invalid credentials, not payload errors. */
export const loginSchema = z.object({
  loginId: z.string().min(3).max(64).transform(sanitizeText),
  password: z.string().min(1).max(AUTH_POLICY.password.maxLength)
});

/**
 * Optional `x-role-filter` on `GET /api/users` (picker: student/staff only).
 * In-repo callers do not set this header to other values; invalid values return validation error.
 */
export const usersPickerRoleHeaderSchema = z.enum(["STUDENT", "STAFF"]);

export const certificateIssueSchema = z.object({
  studentId: z.string().min(1).max(64).transform(sanitizeText),
  certificateType: z.string().min(1).max(64).transform(sanitizeText).optional(),
  purpose: z.string().min(3).max(200).transform(sanitizeText).optional()
});

export const statusChangeSchema = z.object({
  newStatus: z.enum(["ENROLLED", "LEAVE_OF_ABSENCE", "WITHDRAWN", "GRADUATED"]),
  reason: z.string().min(3).max(200).transform(sanitizeText)
});

export const userCreateSchema = z.object({
  loginId: z.string().min(3).max(64).transform(sanitizeText),
  password: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength),
  role: z.enum(["STUDENT", "STAFF", "ADMIN"])
});

const personNameRegex = /^[\p{L}][\p{L}\p{M}\s'-]{0,63}$/u;
const emptyToUndefined = <T>(value: T) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

const englishLegalNameSchema = z.object({
  firstName: z.string().min(1).max(64).regex(personNameRegex).transform(sanitizeText),
  middleName: z.preprocess(emptyToUndefined, z.string().max(64).regex(personNameRegex).transform(sanitizeText).optional()),
  lastName: z.string().min(1).max(64).regex(personNameRegex).transform(sanitizeText)
});

const koreanLegalNameSchema = z.object({
  firstNameKo: z.string().min(1).max(64).regex(personNameRegex).transform(sanitizeText),
  lastNameKo: z.string().min(1).max(64).regex(personNameRegex).transform(sanitizeText)
});

const baseIdentityProfileSchema = z
  .object({
    photoPngBase64: z.preprocess(emptyToUndefined, z.string().min(32).max(20_000_000).optional()),
    nationality: z.string().min(2).max(64).transform(sanitizeText),
    dateOfBirth: z.string().date(),
    email: z.string().email().max(255).transform((value) => value.trim().toLowerCase())
  })
  .merge(englishLegalNameSchema)
  .merge(koreanLegalNameSchema);

const studentAddressSchema = z.object({
  country: z.string().min(2).max(64).transform(sanitizeText),
  addressLine1: z.string().min(3).max(160).transform(sanitizeText),
  addressLine2: z.string().max(160).transform(sanitizeText).optional(),
  postCode: z.string().min(2).max(20).transform(sanitizeText)
});

const editableIdentityProfileSchema = z
  .object({
    nationality: z.string().min(2).max(64).transform(sanitizeText),
    dateOfBirth: z.string().date(),
    email: z.string().email().max(255).transform((value) => value.trim().toLowerCase())
  })
  .merge(englishLegalNameSchema)
  .merge(koreanLegalNameSchema);

export const adminStudentProfileUpdateSchema = editableIdentityProfileSchema.extend({
  termTimeAddress: studentAddressSchema,
  homeAddress: studentAddressSchema
});

export const adminStaffProfileUpdateSchema = editableIdentityProfileSchema;

const studentSegmentationSchema = z.object({
  department: z.preprocess(emptyToUndefined, z.string().max(80).transform(sanitizeText).optional()),
  pathway: z.preprocess(emptyToUndefined, z.string().max(80).transform(sanitizeText).optional()),
  classes: z
    .array(z.string().max(80).transform(sanitizeText))
    .max(50)
    .optional()
    .transform((values) => (values ?? []).map((value) => value.trim()).filter(Boolean))
});

export const studentSegmentationPatchSchema = z.object({
  department: z.preprocess(emptyToUndefined, z.string().max(80).transform(sanitizeText).optional()),
  pathway: z.preprocess(emptyToUndefined, z.string().max(80).transform(sanitizeText).optional())
});

export const studentSegmentationConfigSchema = z.object({
  departments: z
    .array(
      z.object({
        department: z.string().min(1).max(80).transform(sanitizeText),
        pathways: z.array(z.string().min(1).max(80).transform(sanitizeText)).max(200).default([])
      })
    )
    .max(200)
    .default([])
});

export const studentCreateProfileSchema = baseIdentityProfileSchema.extend({
  termTimeAddress: studentAddressSchema,
  homeAddress: studentAddressSchema,
  segmentation: studentSegmentationSchema
});

export const staffCreateProfileSchema = baseIdentityProfileSchema.extend({
  staffTier: z.enum([
    STAFF_TIERS.staff,
    STAFF_TIERS.higherStaff,
    STAFF_TIERS.viceHeadmaster,
    STAFF_TIERS.headmaster
  ])
});

export const userCreateWithProfileSchema = z.discriminatedUnion("role", [
  z.object({
    loginId: z.string().min(3).max(64).transform(sanitizeText),
    password: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength),
    role: z.literal("STUDENT"),
    profile: studentCreateProfileSchema
  }),
  z.object({
    loginId: z.string().min(3).max(64).transform(sanitizeText),
    password: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength),
    role: z.literal("STAFF"),
    profile: staffCreateProfileSchema
  }),
  z.object({
    loginId: z.string().min(3).max(64).transform(sanitizeText),
    password: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength),
    role: z.literal("ADMIN")
  })
]);

export const passwordResetSchema = z.object({
  targetUserId: z.string().min(3).max(128).transform(sanitizeText),
  newPassword: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength),
  currentPassword: z.preprocess(
    emptyToUndefined,
    z.string().min(1).max(AUTH_POLICY.password.maxLength).optional()
  )
});

export const passwordResetRequestSchema = z.object({
  loginId: z.string().min(3).max(64).transform(sanitizeText)
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10).max(512).transform((value) => value.trim()),
  newPassword: z.string().min(AUTH_POLICY.password.minLength).max(AUTH_POLICY.password.maxLength)
});

export const ssoStartSchema = z.object({
  provider: z.enum(["MICROSOFT", "ONELOGIN"])
});

export const ssoProviderConfigSchema = z.object({
  enabled: z.boolean().optional(),
  clientId: z.string().min(1).max(255).transform(sanitizeText).optional(),
  clientSecret: z.string().min(1).max(1024).optional(),
  issuerUrl: z.string().url().max(500).optional(),
  authorizationUrl: z.string().url().max(500).optional(),
  tokenUrl: z.string().url().max(500).optional(),
  userInfoUrl: z.string().url().max(500).optional(),
  redirectUri: z.string().url().max(500).optional(),
  scope: z.string().min(1).max(500).optional()
});

const informationChangeAddressSchema = z.object({
  country: z.preprocess(emptyToUndefined, z.string().max(64).transform(sanitizeText).optional()),
  addressLine1: z.preprocess(emptyToUndefined, z.string().max(160).transform(sanitizeText).optional()),
  addressLine2: z.preprocess(emptyToUndefined, z.string().max(160).transform(sanitizeText).optional()),
  postCode: z.preprocess(emptyToUndefined, z.string().max(20).transform(sanitizeText).optional())
});

export const informationChangeRequestCreateSchema = z.object({
  email: z.preprocess(emptyToUndefined, z.string().email().max(255).transform((value) => value.trim().toLowerCase()).optional()),
  termTimeAddress: z.preprocess(emptyToUndefined, informationChangeAddressSchema.optional()),
  homeAddress: z.preprocess(emptyToUndefined, informationChangeAddressSchema.optional()),
  requesterNote: z.preprocess(emptyToUndefined, z.string().max(500).transform(sanitizeText).optional())
});

export const informationChangeRequestDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewerNote: z.preprocess(emptyToUndefined, z.string().max(500).transform(sanitizeText).optional())
});
