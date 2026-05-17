import { describe, expect, test } from "bun:test";
import type { CharacterResource } from "../db";
import { isRestType, planRestResourceUpdates } from "./rests";

const resource = (
  overrides: Partial<CharacterResource> & Pick<CharacterResource, "id" | "type">,
): CharacterResource => ({
  current: 0,
  key: overrides.id,
  label: overrides.id,
  max: null,
  ...overrides,
});

describe("character rests", () => {
  test("validates supported rest types", () => {
    expect(isRestType("short")).toBe(true);
    expect(isRestType("long")).toBe(true);
    expect(isRestType("watch")).toBe(false);
  });

  test("plans long-rest recovery for MVP resources", () => {
    const updates = planRestResourceUpdates({
      resources: [
        resource({ current: 9, id: "hp", max: 31, type: "hit_points" }),
        resource({ current: 4, id: "temp", type: "temporary_hit_points" }),
        resource({ current: 1, id: "dice", max: 4, type: "hit_dice" }),
        resource({ current: 0, id: "slots", max: 3, type: "spell_slot" }),
        resource({ current: 0, id: "fey", max: 2, type: "feature_use" }),
        resource({ current: 1, id: "inspiration", max: 1, type: "inspiration" }),
        resource({ current: 1, id: "poisoned", max: 1, type: "condition" }),
      ],
      restType: "long",
    });

    expect(updates).toEqual([
      { current: 31, resourceId: "hp" },
      { current: 0, resourceId: "temp" },
      { current: 3, resourceId: "dice" },
      { current: 3, resourceId: "slots" },
      { current: 2, resourceId: "fey" },
    ]);
  });

  test("keeps short rests explicit until a feature has a short-rest recovery rule", () => {
    expect(
      planRestResourceUpdates({
        resources: [resource({ current: 0, id: "dice", max: 4, type: "hit_dice" })],
        restType: "short",
      }),
    ).toEqual([]);
  });
});
