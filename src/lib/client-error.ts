import type { ErrorCode } from "@/lib/api-error";

type ApiErrorShape = {
  error?: {
    code?: string;
    message?: string;
  };
  details?: {
    retryAfterSeconds?: number;
    retryAfterMs?: number;
    remainingPasswordAttempts?: number;
    fields?: Array<{
      path?: string;
      message?: string;
    }>;
  };
};

const ERROR_CODE_OVERRIDES: Partial<Record<ErrorCode, string>> = {
  AUTH_ACCOUNT_NOT_FOUND: "Invalid login ID or password.",
  AUTH_INVALID_CREDENTIALS: "Invalid login ID or password.",
  AUTH_ACCOUNT_INACTIVE: "Invalid login ID or password.",
  AUTH_ACCOUNT_DEACTIVATED: "This account has been deactivated. Please contact an administrator.",
  AUTH_RATE_LIMITED: "Too many requests. Please try again shortly.",
  AUTH_FORBIDDEN: "You do not have permission to perform this action.",
  AUTH_UNAUTHORIZED: "Authentication is required.",
  ACCOUNT_ALREADY_EXISTS: "This login ID already exists.",
  ACCOUNT_SELF_ACTION_BLOCKED: "This action cannot be performed on your own account."
};

const FIELD_LABELS: Record<string, string> = {
  loginId: "Login ID",
  password: "Password",
  role: "Role",
  "profile.firstName": "First name (English)",
  "profile.middleName": "Middle name (English)",
  "profile.lastName": "Last name (English)",
  "profile.firstNameKo": "First name (Korean)",
  "profile.lastNameKo": "Last name (Korean)",
  "profile.nationality": "Nationality",
  "profile.dateOfBirth": "Date of birth",
  "profile.email": "Email",
  "profile.termTimeAddress.country": "Term-time country",
  "profile.termTimeAddress.addressLine1": "Term-time address line 1",
  "profile.termTimeAddress.addressLine2": "Term-time address line 2",
  "profile.termTimeAddress.postCode": "Term-time post code",
  "profile.homeAddress.country": "Home country",
  "profile.homeAddress.addressLine1": "Home address line 1",
  "profile.homeAddress.addressLine2": "Home address line 2",
  "profile.homeAddress.postCode": "Home post code",
  "profile.segmentation.department": "Department",
  "profile.segmentation.pathway": "Pathway"
};

function toFriendlyValidationMessage(path?: string, rawMessage?: string): string | undefined {
  if (!rawMessage) {
    return undefined;
  }
  const fieldLabel = (path && FIELD_LABELS[path]) || "This field";

  const minLength = rawMessage.match(/>=\s*(\d+)/);
  if (rawMessage.includes("Too small") && minLength) {
    return `${fieldLabel} is too short. Please enter at least ${minLength[1]} characters.`;
  }

  const maxLength = rawMessage.match(/<=\s*(\d+)/);
  if (rawMessage.includes("Too big") && maxLength) {
    return `${fieldLabel} is too long. Please keep it within ${maxLength[1]} characters.`;
  }

  if (rawMessage.toLowerCase().includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (rawMessage.toLowerCase().includes("invalid date")) {
    return `${fieldLabel} must be a valid date.`;
  }

  if (rawMessage.includes("must match pattern")) {
    return `${fieldLabel} contains unsupported characters.`;
  }

  return `${fieldLabel}: ${rawMessage}`;
}

export function getUiErrorMessage(payload: unknown, fallback: string): string {
  return getUiErrorResult(payload, fallback).message;
}

export function getUiErrorResult(payload: unknown, fallback: string): {
  code?: ErrorCode;
  message: string;
  cooldownSeconds: number;
  shouldBlockSubmit: boolean;
} {
  const data = payload as ApiErrorShape;
  const code = data?.error?.code as ErrorCode | undefined;
  const cooldownFromSeconds = data?.details?.retryAfterSeconds ?? 0;
  const cooldownFromMs = data?.details?.retryAfterMs ? Math.ceil(data.details.retryAfterMs / 1000) : 0;
  const cooldownSeconds = Math.max(cooldownFromSeconds, cooldownFromMs, 0);
  const baseMessage = code && ERROR_CODE_OVERRIDES[code] ? (ERROR_CODE_OVERRIDES[code] as string) : data?.error?.message ?? fallback;
  const firstFieldError = data?.details?.fields?.find((field) => field.message);
  const friendlyFieldMessage = toFriendlyValidationMessage(firstFieldError?.path, firstFieldError?.message);
  const remaining =
    typeof data?.details?.remainingPasswordAttempts === "number" ? data.details.remainingPasswordAttempts : undefined;

  let message =
    code === "VALIDATION_INVALID_PAYLOAD" && friendlyFieldMessage
      ? `${baseMessage} ${friendlyFieldMessage}`
      : baseMessage;

  if (code === "AUTH_INVALID_CREDENTIALS" && remaining !== undefined && remaining > 0) {
    message = `${message} You have ${remaining} password attempt(s) remaining before this account is locked.`;
  }

  return {
    code,
    message,
    cooldownSeconds,
    shouldBlockSubmit: code === "AUTH_RATE_LIMITED" && cooldownSeconds > 0
  };
}

export function formatCooldownMessage(message: string, cooldownSeconds: number): string {
  if (cooldownSeconds <= 0) {
    return message;
  }

  return `${message} (try again in ${cooldownSeconds}s)`;
}
