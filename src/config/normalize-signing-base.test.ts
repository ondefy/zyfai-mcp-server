import { describe, expect, it } from "vitest";
import { normalizeZyfaiWebSigningBase } from "./normalize-signing-base.js";

describe("normalizeZyfaiWebSigningBase", () => {
  it("defaults to production zyf.ai", () => {
    expect(normalizeZyfaiWebSigningBase()).toBe("https://zyf.ai");
    expect(normalizeZyfaiWebSigningBase("")).toBe("https://zyf.ai");
  });

  it("upgrades loopback http to https for local Vite (mkcert)", () => {
    expect(normalizeZyfaiWebSigningBase("http://localhost:4004")).toBe(
      "https://localhost:4004",
    );
    expect(normalizeZyfaiWebSigningBase("http://127.0.0.1:4004/")).toBe(
      "https://127.0.0.1:4004",
    );
  });

  it("keeps explicit https and production hosts", () => {
    expect(normalizeZyfaiWebSigningBase("https://zyf.ai")).toBe(
      "https://zyf.ai",
    );
    expect(normalizeZyfaiWebSigningBase("https://localhost:4004")).toBe(
      "https://localhost:4004",
    );
  });
});
