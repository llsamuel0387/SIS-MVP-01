import { NextResponse } from "next/server";

export const ERROR_CODES = {
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
  AUTH_INVALID_PAYLOAD: "AUTH_INVALID_PAYLOAD",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_ACCOUNT_NOT_FOUND: "AUTH_ACCOUNT_NOT_FOUND",
  AUTH_ACCOUNT_INACTIVE: "AUTH_ACCOUNT_INACTIVE",
  AUTH_ACCOUNT_DEACTIVATED: "AUTH_ACCOUNT_DEACTIVATED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_INVALID_CSRF: "AUTH_INVALID_CSRF",
  AUTH_SESSION_MISSING: "AUTH_SESSION_MISSING",
  AUTH_SESSION_INVALID: "AUTH_SESSION_INVALID",
  AUTH_SESSION_REFRESH_INVALID: "AUTH_SESSION_REFRESH_INVALID",
  ACCOUNT_ALREADY_EXISTS: "ACCOUNT_ALREADY_EXISTS",
  ACCOUNT_ROLE_NOT_CONFIGURED: "ACCOUNT_ROLE_NOT_CONFIGURED",
  ACCOUNT_SELF_ACTION_BLOCKED: "ACCOUNT_SELF_ACTION_BLOCKED",
  ACCOUNT_INVALID_STATUS: "ACCOUNT_INVALID_STATUS",
  SSO_PROVIDER_INVALID: "SSO_PROVIDER_INVALID",
  SSO_PROVIDER_NOT_CONFIGURED: "SSO_PROVIDER_NOT_CONFIGURED",
  SSO_PROVIDER_DISABLED: "SSO_PROVIDER_DISABLED",
  RESOURCE_STUDENT_NOT_FOUND: "RESOURCE_STUDENT_NOT_FOUND",
  RESOURCE_STAFF_NOT_FOUND: "RESOURCE_STAFF_NOT_FOUND",
  RESOURCE_USER_NOT_FOUND: "RESOURCE_USER_NOT_FOUND",
  RESOURCE_INFORMATION_CHANGE_REQUEST_NOT_FOUND: "RESOURCE_INFORMATION_CHANGE_REQUEST_NOT_FOUND",
  VALIDATION_INVALID_PAYLOAD: "VALIDATION_INVALID_PAYLOAD",
  VALIDATION_SEGMENTATION_IN_USE: "VALIDATION_SEGMENTATION_IN_USE"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const ERROR_MESSAGES: Record<ErrorCode, { status: number; message: string }> = {
  AUTH_UNAUTHORIZED: { status: 401, message: "Authentication is required." },
  AUTH_FORBIDDEN: { status: 403, message: "Access denied." },
  AUTH_INVALID_PAYLOAD: { status: 400, message: "Invalid request payload." },
  AUTH_RATE_LIMITED: { status: 429, message: "Too many requests. Please try again shortly." },
  AUTH_ACCOUNT_NOT_FOUND: { status: 401, message: "Invalid login ID or password." },
  AUTH_ACCOUNT_INACTIVE: { status: 401, message: "Invalid login ID or password." },
  AUTH_ACCOUNT_DEACTIVATED: {
    status: 401,
    message: "This account has been deactivated. Please contact an administrator."
  },
  AUTH_INVALID_CREDENTIALS: { status: 401, message: "Invalid login ID or password." },
  AUTH_INVALID_CSRF: { status: 403, message: "Invalid request token." },
  AUTH_SESSION_MISSING: { status: 401, message: "Session not found." },
  AUTH_SESSION_INVALID: { status: 401, message: "Session is invalid." },
  AUTH_SESSION_REFRESH_INVALID: { status: 401, message: "Session refresh failed." },
  ACCOUNT_ALREADY_EXISTS: { status: 409, message: "This login ID already exists." },
  ACCOUNT_ROLE_NOT_CONFIGURED: { status: 500, message: "Role configuration is missing." },
  ACCOUNT_SELF_ACTION_BLOCKED: { status: 400, message: "This action cannot be performed on your own account." },
  ACCOUNT_INVALID_STATUS: { status: 400, message: "Unsupported status value." },
  SSO_PROVIDER_INVALID: { status: 400, message: "Unsupported SSO provider." },
  SSO_PROVIDER_NOT_CONFIGURED: { status: 400, message: "SSO provider is not fully configured." },
  SSO_PROVIDER_DISABLED: { status: 403, message: "SSO provider is disabled." },
  RESOURCE_STUDENT_NOT_FOUND: { status: 404, message: "Student record not found." },
  RESOURCE_STAFF_NOT_FOUND: { status: 404, message: "Staff record not found." },
  RESOURCE_USER_NOT_FOUND: { status: 404, message: "User record not found." },
  RESOURCE_INFORMATION_CHANGE_REQUEST_NOT_FOUND: { status: 404, message: "Information change request not found." },
  VALIDATION_INVALID_PAYLOAD: { status: 400, message: "Input validation failed." },
  VALIDATION_SEGMENTATION_IN_USE: { status: 409, message: "Department/Pathway cannot be removed while assigned to students." }
};

export function errorResponse(code: ErrorCode, details?: Record<string, unknown>) {
  const config = ERROR_MESSAGES[code];
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message: config.message
      },
      details
    },
    { status: config.status }
  );
}
