import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEmailProvider, resetEmailProvider } from "../index";
import { MockEmailProvider } from "../mock-email-provider";
import { ResendEmailProvider } from "../resend-email-provider";

describe("getEmailProvider — selection by env presence", () => {
  const originalKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    resetEmailProvider();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
    resetEmailProvider();
  });

  it("returns ResendEmailProvider when RESEND_API_KEY is present", () => {
    process.env.RESEND_API_KEY = "re_test_key";
    expect(getEmailProvider()).toBeInstanceOf(ResendEmailProvider);
  });

  it("falls back to MockEmailProvider when RESEND_API_KEY is absent", () => {
    delete process.env.RESEND_API_KEY;
    expect(getEmailProvider()).toBeInstanceOf(MockEmailProvider);
  });

  it("treats empty/whitespace RESEND_API_KEY as absent (mock fallback)", () => {
    process.env.RESEND_API_KEY = "   ";
    expect(getEmailProvider()).toBeInstanceOf(MockEmailProvider);
  });
});
