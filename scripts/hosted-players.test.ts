import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";
import { createSqliteDatabase } from "../src/db";
import { applyHostedPlayers } from "./hosted-players";

describe("hosted players operator import", () => {
  test("disables rehearsal users, removes rehearsal characters, and upserts Friday player sheets", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "campaign-ledger-hosted-players-"));
    const databasePath = join(tempDir, "players.sqlite3");
    const sourcePath = join(tempDir, "friday-players.yml");
    const runtime = createSqliteDatabase({ path: databasePath });
    try {
      runtime.database.run(
        `insert into users (id, email, display_name, role, password_hash)
         values ('user_new_player', 'new-player', 'New Player', 'player', 'hash')`,
      );
    } finally {
      runtime.close();
    }
    await writeFile(
      sourcePath,
      `
campaignId: campaign_rovnost_shadows
disableUsers:
  - mira@example.local
removeCharacterSlugs:
  - mira-voss
players:
  - username: new-player
    character:
      name: Vessa Rook
      slug: vessa-rook
      species: Human
      background: Spy
      className: Rogue
      subclassName: Thief
      level: 5
      hitPointMax: 38
      hitPointCurrent: 31
      abilities:
        strength: 8
        dexterity: 18
        constitution: 14
        intelligence: 12
        wisdom: 10
        charisma: 13
      saveProficiencies:
        dexterity: true
        intelligence: true
      skills:
        stealth: 2
        perception: 1
      armourClassSources:
        - label: Studded leather
          value: 12
        - label: Dexterity
          value: 4
      equipment:
        - name: Rapier
          category: weapon
          quantity: 1
          equipped: true
      resources:
        sneak_attack:
          type: feature_use
          label: Sneak Attack
          current: 1
          max: 1
      backgroundEntries:
        - category: backstory
          title: Table notes
          body: Ready for Friday.
      faction: discontents
`,
    );

    const result = await applyHostedPlayers({ databasePath, sourcePath });
    const check = createSqliteDatabase({ path: databasePath, seed: false });
    try {
      const user = check.repositories.authRepository.findUserByEmail("mira@example.local");
      const created = check.repositories.characterRepository.getSheetBySlug("vessa-rook");
      const mira = check.repositories.characterRepository.getSheetBySlug("mira-voss");
      const membership = check.repositories.campaignRepository
        .listMembers("campaign_rovnost_shadows")
        .find((member) => member.userId === "user_new_player");

      expect(result.usersDisabled).toEqual(["mira@example.local"]);
      expect(result.charactersRemoved).toEqual(["mira-voss"]);
      expect(result.membershipsEnsured).toEqual(["new-player"]);
      expect(result.charactersUpserted).toEqual(["vessa-rook"]);
      expect(user?.status).toBe("disabled");
      expect(mira).toBeNull();
      expect(membership?.role).toBe("player");
      expect(created).toMatchObject({
        armourClass: 16,
        background: "Spy",
        hitPoints: { current: 31, max: 38 },
        level: 5,
        name: "Vessa Rook",
        species: "Human",
      });
      expect(created?.abilities).toContainEqual(
        expect.objectContaining({ ability: "dexterity", saveProficient: true, score: 18 }),
      );
      expect(check.repositories.characterRepository.listEquipment(created!.id)).toContainEqual(
        expect.objectContaining({ equipped: true, name: "Rapier" }),
      );
      expect(created?.skills).toContainEqual(
        expect.objectContaining({ modifier: 10, proficiencyLevel: 2, skill: "stealth" }),
      );
      expect(created?.skills).toContainEqual(
        expect.objectContaining({ modifier: 4, proficiencyLevel: 0, skill: "acrobatics" }),
      );
    } finally {
      check.close();
    }
  });

  test("requires existing invited users before applying player sheets", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "campaign-ledger-hosted-players-missing-"));
    const databasePath = join(tempDir, "players.sqlite3");
    const sourcePath = join(tempDir, "friday-players.yml");
    createSqliteDatabase({ path: databasePath }).close();
    await writeFile(
      sourcePath,
      `
players:
  - username: missing-player
    character:
      name: Missing Hero
      species: Human
      background: Soldier
      className: Fighter
      level: 5
      hitPointMax: 44
`,
    );

    await expect(applyHostedPlayers({ databasePath, sourcePath })).rejects.toThrow(
      "Create/accept the invite first",
    );
  });
});
