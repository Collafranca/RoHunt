import { describe, expect, it } from "vitest";
import {
  assertHasRole,
  hasMinimumRole,
  normalizePayment,
  parseNotificationFilter,
  parseReviewSections,
} from "../src/index";

describe("@rohunt/domain rules", () => {
  describe("payment normalization", () => {
    it("normalizes currency, cadence aliases, and amount precision", () => {
      const payment = normalizePayment({
        amount: 99.999,
        currency: " usd ",
        cadence: "hourly",
      });

      expect(payment).toEqual({
        amount: 100,
        currency: "USD",
        cadence: "hour",
      });
    });

    it("rejects non-positive amounts", () => {
      expect(() =>
        normalizePayment({
          amount: 0,
          currency: "USD",
          cadence: "fixed",
        }),
      ).toThrow();
    });
  });

  describe("notification filter validity", () => {
    it("accepts a valid filter", () => {
      const filter = parseNotificationFilter({
        jobTypes: ["contract", "full_time"],
        minPayment: 50,
        maxPayment: 200,
        includeKeywords: ["scripting", "ui"],
        remoteOnly: true,
      });

      expect(filter).toEqual({
        jobTypes: ["contract", "full_time"],
        minPayment: 50,
        maxPayment: 200,
        includeKeywords: ["scripting", "ui"],
        remoteOnly: true,
      });
    });

    it("rejects empty filters", () => {
      expect(() => parseNotificationFilter({})).toThrow();
    });

    it("rejects minPayment greater than maxPayment", () => {
      expect(() =>
        parseNotificationFilter({
          minPayment: 500,
          maxPayment: 100,
        }),
      ).toThrow();
    });
  });

  describe("review section shape", () => {
    it("accepts well-formed review sections", () => {
      const sections = parseReviewSections([
        {
          section: "communication",
          score: 4,
          summary: "Strong communication and follow-up.",
          evidence: ["Clear status updates", "Responded quickly to feedback"],
        },
      ]);

      expect(sections).toHaveLength(1);
      expect(sections[0]?.section).toBe("communication");
    });

    it("rejects malformed review sections", () => {
      expect(() =>
        parseReviewSections([
          {
            section: "",
            score: 9,
            summary: "",
            evidence: [],
          },
        ]),
      ).toThrow();
    });
  });

  describe("auth role guards", () => {
    it("treats admin as higher than moderator", () => {
      expect(hasMinimumRole("admin", "moderator")).toBe(true);
      expect(hasMinimumRole("user", "moderator")).toBe(false);
    });

    it("throws when current role is outside allowed roles", () => {
      expect(() => assertHasRole("user", ["admin", "moderator"])).toThrow();
    });

    it("does not throw when current role is allowed", () => {
      expect(() => assertHasRole("moderator", ["admin", "moderator"])).not.toThrow();
    });
  });
});
