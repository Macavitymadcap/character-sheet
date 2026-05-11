# D&D Character Sheet Web App - Architecture

## Project Overview

A static web application for displaying and managing D&D 5e character sheets, initially built for Lynott Magulbisson (Level 4 Artificer/Artillerist). The app will be hosted on GitHub Pages and use localStorage for persistent state management.

### Core Principles

- **Static hosting**: No backend required, everything runs client-side
- **Separation of concerns**: Mutable state (HP, spell slots) separate from immutable rules (class features, spells)
- **Markdown for content**: All rules and character data stored as readable markdown files
- **Scalable architecture**: Built for one character, designed to support multiple characters later

## Tech Stack

### Frontend
- **TypeScript** (transpiled via Bun)
- **HTML/CSS/JavaScript** (vanilla, no framework initially)
- **HTMX** for routing and simple interactivity
- **Marked.js** or **Markdown-it** for markdown parsing

### Build & Deploy
- **Bun** as runtime and build tool
- **GitHub Pages** for hosting
- **localStorage** for persistent mutable state

### Why No Framework?
A character sheet is relatively simple (5-10 "pages": stats, spells, equipment, backstory, rules). Vanilla JS + HTMX handles this without framework overhead. React remains an option if complexity grows (drag-and-drop spell prep, complex conditional rendering, etc.).

## Directory Structure

```
lynott-character-sheet/
├── src/                            # Application code
│   ├── main.ts                     # App entry point
│   ├── router.ts                   # HTMX routing logic
│   ├── state/
│   │   ├── character-state.ts      # localStorage wrapper for mutable state
│   │   └── character-loader.ts     # Loads character.json + markdown
│   ├── components/
│   │   ├── stat-block.ts           # Ability scores, saves, skills
│   │   ├── hp-tracker.ts           # HP/hit dice management
│   │   ├── spell-tracker.ts        # Spell slots + prepared spells
│   │   ├── infusion-display.ts     # Active infusions
│   │   └── markdown-renderer.ts    # Parses and renders markdown
│   └── types/
│       ├── character.ts            # Character interface
│       └── state.ts                # CharacterState interface
│
├── public/                         # Built output for GitHub Pages
│   ├── index.html
│   ├── styles.css
│   ├── bundle.js
│   └── markdown/                   # Copied from /markdown during build
│
├── markdown/
│   ├── characters/
│   │   └── lynott-magulbisson/
│   │       ├── character.json      # Character sheet data (immutable)
│   │       ├── profile.md          # Backstory, personality
│   │       ├── npcs.md             # Story NPCs
│   │       ├── identities.md       # False identities
│   │       └── notes.md            # Session notes
│   │
│   └── rules/                      # Shared rules library
│       ├── classes/
│       │   └── artificer/
│       │       ├── artificer.md    # Core class features
│       │       ├── subclasses/
│       │       │   ├── artillerist.md
│       │       │   ├── alchemist.md
│       │       │   └── armorer.md
│       │       └── infusions/
│       │           ├── _infusion-index.json
│       │           ├── enhanced-defense.md
│       │           └── repeating-shot.md
│       │
│       ├── species/
│       │   └── hobgoblin.md
│       │
│       ├── backgrounds/
│       │   ├── special-ops.md
│       │   └── acolyte.md
│       │
│       ├── spells/
│       │   ├── _spell-index.json
│       │   ├── level-0/
│       │   │   ├── mending.md
│       │   │   └── prestidigitation.md
│       │   ├── level-1/
│       │   │   ├── cure-wounds.md
│       │   │   └── shield.md
│       │   └── level-2/
│       │       ├── scorching-ray.md
│       │       └── shatter.md
│       │
│       └── equipment/
│           ├── armor/
│           └── weapons/
│
├── package.json
├── tsconfig.json
├── bunfig.toml
└── README.md
```

## Data Structures

### Character Definition (`character.json`)

Immutable character data that references rules content:

```json
{
  "id": "lynott-magulbisson",
  "name": "Lynott Magulbisson",
  "level": 4,
  "classes": [
    {
      "name": "artificer",
      "level": 4,
      "subclass": "artillerist",
      "hitDice": { "total": 4, "type": "d8" }
    }
  ],
  "species": "hobgoblin",
  "background": "special-ops",
  
  "abilityScores": {
    "str": 8, "dex": 16, "con": 13,
    "int": 18, "wis": 12, "cha": 10
  },
  
  "proficiencies": {
    "armor": ["light", "medium", "shields"],
    "weapons": ["simple", "firearms"],
    "tools": ["thieves-tools", "tinkers-tools", "smiths-tools", "woodcarvers-tools"],
    "saves": ["con", "int"],
    "skills": ["stealth", "deception", "investigation", "perception"]
  },
  
  "knownSpells": {
    "cantrips": ["mending", "prestidigitation"],
    "level1": ["cure-wounds", "shield", "thunderwave", "faerie-fire"],
    "level2": ["scorching-ray", "shatter"]
  },
  
  "knownInfusions": [
    "enhanced-defense",
    "repeating-shot",
    "bag-of-holding",
    "cap-of-water-breathing"
  ],
  
  "equipment": {
    "armor": {
      "worn": "breastplate",
      "infusion": "enhanced-defense"
    },
    "weapons": [
      {
        "name": "revolver",
        "infusion": "repeating-shot"
      }
    ]
  }
}
```

### Mutable State (localStorage)

Runtime state that changes during play:

```typescript
interface CharacterState {
  characterId: string;  // "lynott-magulbisson"
  
  // Combat stats
  hp: { current: 31, max: 31, temp: 0 },
  hitDice: { current: 4, max: 4 },
  
  // Spell slots
  spellSlots: {
    level1: { current: 4, max: 4 },
    level2: { current: 2, max: 2 }
  },
  
  // Prepared spells (subset of known)
  preparedSpells: [
    "cure-wounds",
    "shield", 
    "thunderwave",
    "scorching-ray",
    "shatter",
    "faerie-fire"
  ],
  
  // Active infusions (subset of known, max 2 at level 4)
  activeInfusions: [
    { infusion: "enhanced-defense", item: "breastplate" },
    { infusion: "repeating-shot", item: "revolver" }
  ],
  
  // Per-rest resources
  feyGift: { current: 2, max: 2 },
  fortuneFromMany: { current: 2, max: 2 },
  
  // Temporary conditions
  conditions: [],
  
  // Session notes
  notes: {
    session: "Just arrived in Rovnost...",
    combat: "Eldritch cannon placement ideas..."
  }
}
```

**Storage:** `localStorage.setItem("character-state:lynott-magulbisson", JSON.stringify(state))`

### Spell Index (`_spell-index.json`)

Metadata for filtering/searching without loading all markdown files:

```json
{
  "level-0": [
    {
      "id": "acid-splash",
      "name": "Acid Splash",
      "school": "conjuration",
      "level": 0,
      "classes": ["artificer", "sorcerer", "wizard"],
      "ritual": false,
      "concentration": false
    },
    {
      "id": "mending",
      "name": "Mending",
      "school": "transmutation",
      "level": 0,
      "classes": ["artificer", "bard", "cleric", "druid", "sorcerer", "wizard"],
      "ritual": false,
      "concentration": false
    }
  ],
  "level-1": [
    {
      "id": "cure-wounds",
      "name": "Cure Wounds",
      "school": "evocation",
      "level": 1,
      "classes": ["artificer", "bard", "cleric", "druid", "paladin", "ranger"],
      "ritual": false,
      "concentration": false
    }
  ]
}
```

### Infusion Index (`_infusion-index.json`)

Similar structure for infusions:

```json
{
  "infusions": [
    {
      "id": "enhanced-defense",
      "name": "Enhanced Defense",
      "item": "A suit of armor or a shield",
      "prerequisite": null,
      "requiresAttunement": false
    },
    {
      "id": "repeating-shot",
      "name": "Repeating Shot",
      "item": "A simple or martial weapon with the ammunition property",
      "prerequisite": null,
      "requiresAttunement": true
    },
    {
      "id": "arcane-propulsion-armor",
      "name": "Arcane Propulsion Armor",
      "item": "A suit of armor",
      "prerequisite": "Level 14+",
      "requiresAttunement": true
    }
  ]
}
```

## Markdown Structure Standards

### Header Hierarchy

**Consistent pattern across all rules documents:**

```markdown
# [Document Title]        ← H1: The thing itself (spell name, class name, etc.)

## [Major Section]        ← H2: Major divisions (Class Features, Racial Traits, etc.)

### [Feature/Ability]     ← H3: Individual mechanics/features

#### [Subsection/Table]   ← H4: Details, tables, special cases
```

### Class Files

**Example: `artificer.md`**

```markdown
# Artificer (TCE)

[Flavor text]

## The Artificer

| Level | Proficiency Bonus | Features | Infusions Known | ... |
|-------|-------------------|----------|-----------------|-----|
| 1st | +2 | [Magical Tinkering](#magical-tinkering), [Spellcasting](#spellcasting) | — | ... |

## Creating an Artificer

### Quick Build
### Hit Points
### Proficiencies
### Starting Equipment

## Class Features

### Magical Tinkering
*1st-level artificer feature*

You've learned how to invest...

### Spellcasting
*1st-level artificer feature*

You've studied the workings...

#### Preparing and Casting Spells
#### Spellcasting Ability
```

### Subclass Files

**Example: `artillerist.md`**

```markdown
# Artillerist

An Artillerist specializes in using magic...

## Artillerist Features

### Tool Proficiency
*3rd-level Artillerist feature*

When you adopt this specialization...

### Artillerist Spells
*3rd-level Artillerist feature*

Starting at 3rd level, you always have certain spells prepared...

#### Artillerist Spells Table
| Artificer Level | Spell |
|-----------------|-------|
| 3rd | *shield*, *thunderwave* |

### Eldritch Cannon
*3rd-level Artillerist feature*

At 3rd level, you learn how to create...

#### Eldritch Cannons
| Cannon | Activation |
|--------|------------|
| Flamethrower | The cannon exhales... |
```

### Species Files

**Example: `hobgoblin.md`**

```markdown
# Hobgoblin

**Ability Scores**: Choose one of: (a) Choose any +2; choose any other +1  
**Creature Type**: Humanoid  
**Size**: Medium  
**Speed**: 30 feet

## Racial Traits

### Creature Type
You are a Humanoid. You are also considered a goblinoid...

### Darkvision
You can see in dim light within 60 feet...

### Fey Ancestry
You have advantage on saving throws...

### Fey Gift
You can use this trait to take the Help action...

Starting at 3rd level, choose one of the options below:

- **Hospitality.** You and the creature you help each gain...
- **Passage.** You and the creature you help each increase...
- **Spite.** Until the start of your next turn...

### Fortune from the Many
If you miss with an attack roll...

### Languages
You can speak, read, and write Common...
```

### Background Files

**Example: `special-ops.md`**

```markdown
# Special Operations

**Skill Proficiencies:** Stealth, Deception  
**Tool Proficiencies:** One type of gaming set (Three Dragon Ante), vehicles (land)  
**Equipment:** An insignia of rank (kept hidden), a set of traveler's clothes...

## Background Features

### Special Ops
Your special forces training and knowledge...
```

*Note: Suggested Characteristics tables are optional per background*

### Spell Files

**Example: `cure-wounds.md`**

```markdown
# Cure Wounds

*1st-level evocation*

**Casting Time:** 1 action  
**Range:** Touch  
**Components:** V, S  
**Duration:** Instantaneous

A creature you touch regains hit points equal to 1d8 + your spellcasting modifier. This spell has no effect on undead or constructs.

## At Higher Levels

When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.
```

**Key points:**
- H1 for spell name (standalone document)
- Italicized level/school on second line
- Bold stats (Casting Time, Range, etc.)
- H2 for "At Higher Levels" (if applicable)
- No "Classes" field (that's in `_spell-index.json`)

### Infusion Files

**Example: `enhanced-defense.md`**

```markdown
# Enhanced Defense

*Item: A suit of armor or a shield*

A creature gains a +1 bonus to Armor Class while wearing (armor) or wielding (shield) the infused item.

The bonus increases to +2 when you reach 10th level in this class.
```

**For infusions with statblocks (e.g., `homunculus-servant.md`):**

```markdown
# Homunculus Servant

*Item: A gem or crystal worth at least 100 gp*

You learn intricate methods for magically creating a special homunculus...

[infusion description]

---

## Homunculus Servant Statblock

*Tiny Construct*

**AC** 13 (natural armor)  
**Hit Points** 1 + your Intelligence modifier + your artificer level

[full statblock]
```

## Linking Strategy

### Within-Document Links

Use standard markdown anchors:

```markdown
| 1st | +2 | [Magical Tinkering](#magical-tinkering), [Spellcasting](#spellcasting) |
```

Renders as:
```html
<a href="#magical-tinkering">Magical Tinkering</a>
<!-- Links to -->
<h3 id="magical-tinkering">Magical Tinkering</h3>
```

### Cross-Document Links in Rules Files

Use relative paths (works in GitHub preview):

```markdown
Choose the type of specialist you are:
- [Artillerist](subclasses/artillerist.md)
- [Alchemist](subclasses/alchemist.md)
```

### Character-Specific Links

Use custom anchor syntax that the app resolves:

```markdown
## Active Infusions
- [Enhanced Defense](#infusion:enhanced-defense)
- [Repeating Shot](#infusion:repeating-shot)

## Prepared Spells
- [Cure Wounds](#spell:cure-wounds)
- [Shield](#spell:shield)
```

**App intercepts and resolves:**

```typescript
renderer.link = (href, title, text) => {
  if (href.startsWith('#infusion:')) {
    const infusionId = href.replace('#infusion:', '');
    href = `/markdown/rules/classes/artificer/infusions/${infusionId}.md`;
  } else if (href.startsWith('#spell:')) {
    const spellId = href.replace('#spell:', '');
    const level = getSpellLevel(spellId); // From spell index
    href = `/markdown/rules/spells/level-${level}/${spellId}.md`;
  }
  
  // HTMX-ify for SPA navigation
  return `<a href="${href}" hx-get="${href}" hx-target="#content" hx-push-url="true">${text}</a>`;
};
```

## Content Loading Strategy

### Initial Load
1. Load `character.json` for immutable character data
2. Load `localStorage` for mutable state
3. Load character profile markdown (backstory, etc.)

### Dynamic Rule Loading
Load rules markdown on-demand based on character data:

```typescript
// Load class rules
const artificerCore = await loadMarkdown('/rules/classes/artificer/artificer.md');
const artillerist = await loadMarkdown('/rules/classes/artificer/subclasses/artillerist.md');

// Load species
const hobgoblin = await loadMarkdown('/rules/species/hobgoblin.md');

// Load only known spells
const spells = await Promise.all(
  character.knownSpells.level1.map(spellId => 
    loadMarkdown(`/rules/spells/level-1/${spellId}.md`)
  )
);

// Load only known infusions
const infusions = await Promise.all(
  character.knownInfusions.map(infusionId =>
    loadMarkdown(`/rules/classes/artificer/infusions/${infusionId}.md`)
  )
);
```

### Index Usage

Load indices for browsing/filtering:

```typescript
// Spell picker: "What 2nd-level spells can I learn?"
const spellIndex = await fetch('/markdown/rules/spells/_spell-index.json').then(r => r.json());
const level2Artificer = spellIndex['level-2'].filter(s => s.classes.includes('artificer'));

// Display list, load individual .md files on click
```

## Migration Path

### Phase 1: Single Character (Current)
- Hardcode Lynott's data in the app
- Focus on UI/UX and markdown rendering
- localStorage for mutable state
- Manual markdown file organization

### Phase 2: Character JSON (Before Character #2)
- Extract Lynott's data into `character.json`
- Refactor app to dynamically load rules based on JSON
- Test with Lynott, ensure feature parity

### Phase 3: Multi-Character Support (Future)
- Character selection UI
- Per-character localStorage keys
- Shared rules library across characters

### Phase 4: Character Builder (Optional)
- UI to create new characters
- Pick class/species/background
- Select spells/infusions from indices
- Generate `character.json` from form data

## Design Decisions Summary

### ✅ Decisions Made

1. **GitHub Pages + localStorage**: Valid for single-user character sheet, no backend needed
2. **Vanilla TS + HTMX**: Appropriate for this scope, React only if needed later
3. **Level-based spell directories**: `/level-0/`, `/level-1/`, etc.
4. **Class-scoped infusions**: `/classes/artificer/infusions/` (not root-level)
5. **H3 for features**: Consistent header hierarchy across all rule types
6. **Index files for metadata**: `_spell-index.json`, `_infusion-index.json` separate from markdown
7. **Embedded statblocks**: Keep Homunculus statblock in `homunculus-servant.md`
8. **Relative paths in rules**: Standard markdown links work in GitHub
9. **Custom anchors in character files**: `#spell:cure-wounds` resolved by app

### 🤔 Future Considerations

- **Cross-device sync**: Would require backend (Firebase, Supabase) if needed
- **Collaborative editing**: Not in scope for single-user sheet
- **PDF export**: Could add later with print CSS or PDF library
- **Dice rolling**: Could integrate dice notation parser + RNG

## Build Process

```bash
# Development
bun run dev        # Watch mode, live reload

# Production build
bun build src/main.ts --outdir public
cp -r markdown public/

# Deploy to GitHub Pages
git add public/
git commit -m "Deploy character sheet"
git push origin main
```

## Next Steps

1. **Set up project**: Initialize Bun project, TypeScript config
2. **Create type definitions**: `Character`, `CharacterState` interfaces
3. **Build markdown renderer**: Parse and display markdown with custom link resolution
4. **Implement state management**: localStorage wrapper with save/load
5. **Create UI components**: HP tracker, spell slots, infusion display
6. **Add HTMX routing**: Load different sections on-demand
7. **Style with CSS**: Design tokens, responsive layout
8. **Test with Lynott**: Verify all features work with real character data

---

*Last updated: 2025-05-10*