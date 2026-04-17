const MAX_FAILED_LOGIN_BEFORE_LOCK = 8;
/** Same-IP burst must exceed lockout threshold so throttling does not hide lockout behaviour. */
const LOGIN_PER_IP_BURST = MAX_FAILED_LOGIN_BEFORE_LOCK + 16;

export const AUTH_POLICY = {
  password: {
    minLength: 10,
    maxLength: 128
  },
  loginRateLimit: {
    perIp: { limit: LOGIN_PER_IP_BURST, windowMs: 60_000 },
    /** Per login id; keep comfortably above failed-login lockout count. */
    perAccount: { limit: MAX_FAILED_LOGIN_BEFORE_LOCK + 8, windowMs: 15 * 60_000 }
  },
  passwordResetConfirmRateLimit: {
    perIp: { limit: 8, windowMs: 60_000 }
  },
  ssoStartRateLimit: {
    perIp: { limit: 30, windowMs: 60_000 }
  },
  /** POST /api/auth/refresh — IP당 1분 10회 */
  sessionRefreshRateLimit: {
    perIp: { limit: 10, windowMs: 60_000 }
  },
  /** Wrong-password attempts before the account is set to INACTIVE (admin must re-activate). */
  failedLoginLockout: {
    maxFailedAttempts: MAX_FAILED_LOGIN_BEFORE_LOCK,
    /** From this failure count onward, the login API includes `remainingPasswordAttempts` (5→1 before lockout). */
    minFailuresToShowRemaining: 4
  },
  tokenTtl: {
    accessSeconds: 15 * 60,
    refreshSeconds: 7 * 24 * 60 * 60
  }
} as const;
