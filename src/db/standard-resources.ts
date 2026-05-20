export type StandardCharacterResourceType =
  | "hit_dice"
  | "hit_points"
  | "inspiration"
  | "temporary_hit_points";

export interface StandardCharacterResourceTemplate {
  current: number;
  key: string;
  label: string;
  max: number | null;
  sortOrder: number;
  type: StandardCharacterResourceType;
}

export const standardCharacterResourceKeys = [
  "hit_points",
  "temporary_hit_points",
  "inspiration",
  "hit_dice_d8",
] as const;

export function standardCharacterResourceTemplates({
  hitDiceCurrent,
  hitDiceMax = hitDiceCurrent,
  hitPointCurrent,
  hitPointMax,
}: {
  hitDiceCurrent: number;
  hitDiceMax?: number;
  hitPointCurrent?: number;
  hitPointMax: number;
}): StandardCharacterResourceTemplate[] {
  const currentHitPoints = hitPointCurrent ?? hitPointMax;

  return [
    {
      current: currentHitPoints,
      key: "hit_points",
      label: "Hit points",
      max: hitPointMax,
      sortOrder: 10,
      type: "hit_points",
    },
    {
      current: 0,
      key: "temporary_hit_points",
      label: "Temporary hit points",
      max: null,
      sortOrder: 20,
      type: "temporary_hit_points",
    },
    {
      current: 0,
      key: "inspiration",
      label: "Inspiration",
      max: 1,
      sortOrder: 25,
      type: "inspiration",
    },
    {
      current: hitDiceCurrent,
      key: "hit_dice_d8",
      label: "Hit dice d8",
      max: hitDiceMax,
      sortOrder: 30,
      type: "hit_dice",
    },
  ];
}
