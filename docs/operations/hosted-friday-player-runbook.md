# Hosted Friday Player Runbook

This runbook covers replacing rehearsal player records with the real Friday table accounts and
level-5 character shells. It is an operator-only hosted procedure; run it after a backup and keep
the input file outside git.

## Account Preparation

1. Sign in as an active admin.
2. Open `/admin`.
3. Create invite links for the real players and share them privately.
4. Ask each player to accept the invite and set a password.
5. Confirm `/admin` shows each real player as active before running the player import.

The player import does not create user accounts. It expects accepted invite users to exist first, so
password setup stays in the audited admin flow.

## Backup

Create a hosted backup before changing player or character data:

```bash
bun run hosted:data -- backup
```

Record the manifest path if available. Production `/data` imports are refused unless
`HOSTED_PLAYERS_BACKUP_CONFIRMED=1` or `HOSTED_PLAYERS_BACKUP_REFERENCE` is set.

## Input File

Create `/data/private-rules/friday-players.yml` in the hosted shell or upload it to the Railway
volume. Minimum character fields are `name`, `species`, `background`, `className`, `level`, and
`hitPointMax`.

```yaml
campaignId: campaign_rovnost_shadows
disableUserEmails:
  - mira@example.local
removeCharacterSlugs:
  - mira-voss
players:
  - email: player.one@example.com
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
```

The script ensures each listed user is a Rovnost player, disables listed rehearsal accounts, removes
listed rehearsal characters, creates or updates each character by slug, and replaces optional detail
collections when they are present in the YAML.

## Apply

Run the import from the hosted shell:

```bash
HOSTED_PLAYERS_BACKUP_CONFIRMED=1 bun run hosted:players
```

Or include the backup manifest:

```bash
HOSTED_PLAYERS_BACKUP_REFERENCE=/data/backups/character-sheet-2026-05-29.manifest.json \
  bun run hosted:players
```

For a local dry run, point at a local database and source file:

```bash
DB_PATH=/tmp/friday.sqlite3 HOSTED_PLAYERS_SOURCE=./friday-players.yml bun run hosted:players
```

## Verify

After applying:

1. Sign in as Game Master and open `/campaigns/rovnost-shadows/characters`.
2. Confirm Mira is gone from the roster if `removeCharacterSlugs` included `mira-voss`.
3. Confirm each real player has one level-5 character.
4. Open each sheet and spot-check HP, AC, abilities, skills, equipment, resources, and notes.
5. Ask each player to sign in and open their own sheet before the session starts.

Run the private-rules coverage check separately if rule links matter for the session:

```bash
bun run rules:coverage:rovnost -- /data/private-rules
```
