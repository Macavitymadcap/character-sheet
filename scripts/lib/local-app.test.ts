import { describe, expect, test } from "bun:test";
import { getCandidatePorts } from "./local-app";

describe("local app server helpers", () => {
  test("skips Chromium-blocked ports when choosing browser test ports", () => {
    expect(getCandidatePorts(3650)).not.toContain(3659);
    expect(getCandidatePorts(4040)).not.toContain(4045);
  });
});
