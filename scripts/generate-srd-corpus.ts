const sourcePath = process.argv[2] ?? "/tmp/srd5.1-tabyltop.json";
const outputDirectory = "docs/rules/srd-5.1";
const source = JSON.parse(await Bun.file(sourcePath).text()) as SrdItem[];

await Bun.$`mkdir -p ${outputDirectory}`;

interface SrdItem {
  page?: number;
  rows?: Array<Array<{ subelements?: SrdSubelement[] }>>;
  subelements?: SrdSubelement[];
  type: string;
}

interface SrdSubelement {
  text?: string;
}

interface Heading {
  h1: string;
  h2: string;
  h3: string;
  index: number;
  level: number;
  page: number | undefined;
  title: string;
}

const classNames = new Set([
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
]);
const subclassSectionTitles = new Set([
  "Martial Archetypes",
  "Monastic Traditions",
  "Sacred Oaths",
  "Ranger Archetypes",
  "Roguish Archetypes",
  "Sorcerous Origins",
  "Otherworldly Patrons",
  "Arcane Traditions",
]);
const actionNames = new Set([
  "Attack",
  "Cast a Spell",
  "Dash",
  "Disengage",
  "Dodge",
  "Help",
  "Hide",
  "Ready",
  "Search",
  "Use an Object",
]);
const conditionNames = new Set([
  "Blinded",
  "Charmed",
  "Deafened",
  "Exhaustion",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
]);

const sourceMeta = {
  abbreviation: "SRD 5.1",
  contentCategory: "srd",
  id: "rules_source_srd_5_1",
  name: "Systems Reference Document 5.1",
  precedence: 15,
  slug: "srd-5-1",
};

const headings = collectHeadings(source);
const seen = new Map<string, number>();
const entities = [];

for (let index = 0; index < headings.length; index += 1) {
  const heading = headings[index]!;
  if (heading.title === "Class Features" || heading.title === "Spell Descriptions") continue;

  const description = blockFor(heading, nextSameOrHigher(index, heading.level));
  if (!description || description.length < 20) continue;

  const entityType = entityTypeFor(heading);
  const baseSlug = slugify(heading.title);
  const naturalKey = `${entityType}:${baseSlug}`;
  const duplicateCount = seen.get(naturalKey) ?? 0;
  seen.set(naturalKey, duplicateCount + 1);
  const slug = duplicateCount === 0 ? baseSlug : `${baseSlug}-${slugify(heading.h1 || String(heading.page))}`;

  entities.push({
    entityType,
    mechanics: [
      {
        data: {
          description,
          page: heading.page,
          searchableText: `${heading.title}\n${description}`,
          section: heading.h1,
          subsection: heading.h2,
          tags: tagsFor(entityType, heading),
        },
        mechanicType: entityType,
      },
    ],
    name: heading.title,
    slug,
    source: sourceMeta,
  });
}

await Bun.write(
  `${outputDirectory}/srd-5.1-corpus.json`,
  JSON.stringify(
    {
      attribution:
        "This work includes material taken from the System Reference Document 5.1 (SRD 5.1) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode. Conversion of this document from the original PDF to JSON was performed by the team at Tabyltop (https://www.tabyltop.com).",
      entities,
    },
    null,
    2,
  ),
);

await Bun.write(
  `${outputDirectory}/ATTRIBUTION.txt`,
  `SRD 5.1 Local Corpus

This directory contains the local SRD 5.1 corpus used by \`bun run import:rules -- docs/rules/srd-5.1\`.
Runtime imports must read this local directory rather than fetching external rules content.

Attribution: This work includes material taken from the System Reference Document 5.1 (SRD 5.1) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode. Conversion of this document from the original PDF to JSON was performed by the team at Tabyltop (https://www.tabyltop.com).
`,
);

const counts = entities.reduce<Record<string, number>>((accumulator, entity) => {
  accumulator[entity.entityType] = (accumulator[entity.entityType] ?? 0) + 1;

  return accumulator;
}, {});

console.log(`Generated ${entities.length} SRD entities in ${outputDirectory}`);
console.log(JSON.stringify(counts, null, 2));

function collectHeadings(items: SrdItem[]): Heading[] {
  let h1 = "";
  let h2 = "";
  let h3 = "";
  const headings: Heading[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    if (!["h1", "h2", "h3", "h4"].includes(item.type)) continue;

    const title = cleanTitle(textOf(item));
    if (!title) continue;

    const level = levelOf(item.type);
    if (level === 1) h1 = title;
    if (level === 2) h2 = title;
    if (level === 3) h3 = title;
    headings.push({ h1, h2, h3, index, level, page: item.page, title });
  }

  return headings;
}

function blockFor(heading: Heading, next: Heading | undefined) {
  const lines: string[] = [];
  const stopIndex = next?.index ?? source.length;

  for (let index = heading.index + 1; index < stopIndex; index += 1) {
    const item = source[index]!;
    if (["h1", "h2", "h3", "h4"].includes(item.type)) {
      if (levelOf(item.type) <= heading.level) break;
      lines.push(`${"#".repeat(levelOf(item.type) - heading.level + 1)} ${cleanTitle(textOf(item))}`);
      continue;
    }
    if (item.type === "paragraph") {
      const text = textOf(item);
      if (text) lines.push(text);
    }
    if (item.type === "table") {
      const text = tableText(item);
      if (text) lines.push(text);
    }
  }

  return lines.join("\n\n").trim();
}

function nextSameOrHigher(position: number, level: number) {
  return headings.slice(position + 1).find((candidate) => candidate.level <= level);
}

function entityTypeFor(heading: Heading) {
  if (conditionNames.has(heading.title) || heading.h1.includes("Conditions")) return "condition";
  if (heading.h1 === "Races" && heading.level === 2) return "species";
  if (heading.h1 === "Races" && heading.title.endsWith("Traits")) return "species_trait";
  if (classNames.has(heading.title) && heading.level === 1) return "class";
  if (classNames.has(heading.h1) && subclassSectionTitles.has(heading.h2) && heading.level >= 3) return "subclass";
  if (classNames.has(heading.h1) && heading.level >= 3) return "class_feature";
  if (heading.title === "Acolyte") return "background";
  if (heading.h1 === "Feats") return "feat";
  if (heading.h1 === "Equipment" && heading.level >= 2) return "equipment";
  if (actionNames.has(heading.title) && heading.h2 === "Actions in Combat") return "action";
  if (heading.h2 === "Spell Descriptions" && heading.level >= 3) return "spell";
  if (heading.title.includes("Proficienc")) return "proficiency";
  if (heading.title.includes("Vision") || heading.title === "Senses") return "sense";

  return "core_rule";
}

function tagsFor(entityType: string, heading: Heading) {
  const tags = new Set([entityType, slugify(heading.h1)]);
  if (heading.h2) tags.add(slugify(heading.h2));
  if (heading.h3 && heading.h3 !== heading.title) tags.add(slugify(heading.h3));
  if (entityType === "spell") tags.add("spells");
  if (entityType === "equipment") tags.add("equipment");

  return [...tags].filter(Boolean).sort();
}

function textOf(item: Pick<SrdItem, "subelements">) {
  return (item.subelements ?? [])
    .map((subelement) => subelement.text ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function tableText(item: SrdItem) {
  return (item.rows ?? [])
    .map((row) => row.map((cell) => textOf(cell)).join(" | "))
    .join("\n");
}

function levelOf(type: string) {
  if (type === "h1") return 1;
  if (type === "h2") return 2;
  if (type === "h3") return 3;
  if (type === "h4") return 4;

  return 99;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "rule";
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/A ttack/g, "Attack")
    .replace(/T ime/g, "Time")
    .replace(/Di smounting/g, "Dismounting")
    .replace(/Disease s/g, "Diseases")
    .replace(/Demon s/g, "Demons")
    .replace(/Devil s/g, "Devils")
    .replace(/Dinosaur s/g, "Dinosaurs")
    .replace(/Genie s/g, "Genies")
    .replace(/Giant s/g, "Giants")
    .replace(/Naga s/g, "Nagas")
    .replace(/Ooze s/g, "Oozes")
    .replace(/PH -/g, "PH-")
    .replace(/MM -/g, "MM-")
    .trim();
}
