import { describe, it, expect, vi, beforeEach } from "vitest";

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

import { notifySuccess, notifyInfo, notifyWarning, notifyError } from "../notify";

describe("notify helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notifySuccess", () => {
    it("invokes toast.success with translated text", () => {
      const t = vi.fn().mockReturnValue("Saved");
      notifySuccess(
        "common.feedback.saved_successfully" as never,
        t as never,
      );
      expect(t).toHaveBeenCalledWith(
        "common.feedback.saved_successfully",
        undefined,
      );
      expect(toastMock.success).toHaveBeenCalledWith("Saved");
    });

    it("passes params through", () => {
      const t = vi.fn().mockReturnValue("3 items uploaded");
      notifySuccess("common.feedback.bulk_done" as never, t as never, {
        count: 3,
      });
      expect(t).toHaveBeenCalledWith("common.feedback.bulk_done", {
        count: 3,
      });
    });
  });

  describe("notifyError with key", () => {
    it("treats string first arg as MessageKey", () => {
      const t = vi.fn().mockReturnValue("Upload failed");
      notifyError("error.knowledge.upload_failed", t as never);
      expect(t).toHaveBeenCalledWith(
        "error.knowledge.upload_failed",
        undefined,
      );
      expect(toastMock.error).toHaveBeenCalledWith("Upload failed");
    });
  });

  describe("notifyError with Error object", () => {
    it("uses translateErrorWithT for structured errors", () => {
      const t = vi.fn((k: string) => `[${k}]`);
      const err = {
        code: "ledger.account_not_found",
        message: "...",
        accountCode: "platform:revenue:brl",
      };
      notifyError(err, t as never);
      expect(toastMock.error).toHaveBeenCalled();
      // The translator was called with a composed key.
      expect(t).toHaveBeenCalledWith(
        "error.ledger.account_not_found",
        expect.any(Object),
      );
    });

    it("falls back to error.common.unknown for unstructured", () => {
      const t = vi.fn((k: string) => `[${k}]`);
      notifyError(new Error("oops"), t as never);
      expect(t).toHaveBeenCalledWith("error.common.unknown");
    });
  });

  describe("notifyInfo and notifyWarning", () => {
    it("dispatch to correct toast variant", () => {
      const t = vi.fn().mockReturnValue("Heads up");
      notifyInfo("common.feedback.info" as never, t as never);
      expect(toastMock.info).toHaveBeenCalled();

      notifyWarning("common.feedback.warning" as never, t as never);
      expect(toastMock.warning).toHaveBeenCalled();
    });
  });
});
