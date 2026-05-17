export const sheetTabs = [
  {
    description: "Abilities, saves, senses, speed, and defence.",
    id: "core",
    label: "Core",
  },
  {
    description: "Skills, proficiencies, languages, and tools.",
    id: "skills",
    label: "Skills",
  },
  {
    description: "Attacks, action options, reactions, and rest actions.",
    id: "actions",
    label: "Actions",
  },
  {
    description: "Prepared spells, spell slots, and spellcasting details.",
    id: "spellcasting",
    label: "Spellcasting",
  },
  {
    description: "Class features, species traits, infusions, and selected rules.",
    id: "features",
    label: "Features",
  },
  {
    description: "Equipment, carried items, armour, and weapons.",
    id: "equipment",
    label: "Equipment",
  },
  {
    description: "Background, backstory, allies, contacts, and identities.",
    id: "background",
    label: "Background",
  },
  {
    description: "Player notes, Game Master notes, and campaign records.",
    id: "notes",
    label: "Notes",
  },
] as const;

export type SheetTabId = (typeof sheetTabs)[number]["id"];

export function isSheetTabId(value: string): value is SheetTabId {
  return sheetTabs.some((tab) => tab.id === value);
}

export function getSheetTab(tabId: SheetTabId) {
  return sheetTabs.find((tab) => tab.id === tabId) ?? sheetTabs[0]!;
}
