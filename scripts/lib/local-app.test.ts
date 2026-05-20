import { describe, expect, test } from "bun:test";
import { getCandidatePorts } from "./local-app";

describe("local app server helpers", () => {
  test("chooses a broad high-port range for browser-driven checks", () => {
    const ports = getCandidatePorts(49152);

    expect(ports).toHaveLength(100);
    expect(ports[0]).toBe(49152);
    expect(ports.at(-1)).toBe(49251);
  });

  test("skips Chromium-blocked ports when choosing browser test ports", () => {
    expect(getCandidatePorts(3650)).not.toContain(3659);
    expect(getCandidatePorts(4040)).not.toContain(4045);
  });

});
