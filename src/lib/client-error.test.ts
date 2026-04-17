import { describe, expect, it } from "vitest";
import { formatCooldownMessage, getUiErrorResult } from "@/lib/client-error";

describe("getUiErrorResult", () => {
  it("maps rate limit payload to cooldown and submit blocking", () => {
    const r = getUiErrorResult(
      { error: { code: "AUTH_RATE_LIMITED" }, details: { retryAfterSeconds: 15 } },
      "fallback"
    );
    expect(r.cooldownSeconds).toBe(15);
    expect(r.shouldBlockSubmit).toBe(true);
    expect(r.message).toContain("Too many requests");
  });

  it("uses API message when no override exists", () => {
    const r = getUiErrorResult({ error: { code: "VALIDATION_INVALID_PAYLOAD", message: "Bad input" } }, "fallback");
    expect(r.message).toBe("Bad input");
    expect(r.shouldBlockSubmit).toBe(false);
  });

  it("appends remaining password attempts for invalid credentials", () => {
    const r = getUiErrorResult(
      {
        error: { code: "AUTH_INVALID_CREDENTIALS" },
        details: { remainingPasswordAttempts: 2 }
      },
      "fallback"
    );
    expect(r.message).toContain("2 password attempt");
  });
});

describe("formatCooldownMessage", () => {
  it("appends countdown when seconds are positive", () => {
    expect(formatCooldownMessage("Wait", 5)).toBe("Wait (try again in 5s)");
  });

  it("returns base message when no cooldown", () => {
    expect(formatCooldownMessage("Wait", 0)).toBe("Wait");
  });
});
