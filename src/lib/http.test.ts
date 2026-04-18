import { describe, expect, it } from "vitest";
import { parseCookies } from "@/lib/http";

describe("parseCookies", () => {
  it("parses valid cookies", () => {
    const request = new Request("https://example.test", {
      headers: {
        cookie: "session_token=abc123; csrf_token=hello%20world"
      }
    });

    expect(parseCookies(request)).toEqual({
      session_token: "abc123",
      csrf_token: "hello world"
    });
  });

  it("ignores malformed percent-encoding instead of throwing", () => {
    const request = new Request("https://example.test", {
      headers: {
        cookie: "session_token=%E0%A4%A; csrf_token=safe"
      }
    });

    expect(parseCookies(request)).toEqual({
      csrf_token: "safe"
    });
  });
});
