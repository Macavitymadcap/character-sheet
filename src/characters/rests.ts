import type { CharacterResource } from "../db";

export type RestType = "long" | "short";

export interface RestResourceUpdate {
  current: number;
  resourceId: string;
}

interface PlanRestResourceUpdatesInput {
  resources: CharacterResource[];
  restType: RestType;
}

export function isRestType(value: string): value is RestType {
  return value === "long" || value === "short";
}

export function planRestResourceUpdates({
  resources,
  restType,
}: PlanRestResourceUpdatesInput): RestResourceUpdate[] {
  if (restType === "short") return [];

  return resources.flatMap((resource) => {
    const nextCurrent = nextLongRestCurrent(resource);
    if (nextCurrent === null || nextCurrent === resource.current) return [];

    return [{ current: nextCurrent, resourceId: resource.id }];
  });
}

function nextLongRestCurrent(resource: CharacterResource) {
  if (resource.type === "hit_points" && resource.max !== null) return resource.max;
  if (resource.type === "temporary_hit_points") return 0;
  if (resource.type === "spell_slot" && resource.max !== null) return resource.max;
  if (resource.type === "feature_use" && resource.max !== null) return resource.max;
  if (resource.type === "hit_dice" && resource.max !== null) {
    const recoveredDice = Math.max(1, Math.floor(resource.max / 2));

    return Math.min(resource.max, resource.current + recoveredDice);
  }

  return null;
}
