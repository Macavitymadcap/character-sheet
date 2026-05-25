import type { AuthUser, CampaignMember, CampaignSummary, CharacterRosterItem } from "../../../db";
import { Button } from "../../atoms/Button";
import { Panel } from "../../atoms/Panel";
import { FormField } from "../../molecules/FormField";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface CharactersPageProps {
  appName: string;
  campaign?: CampaignSummary;
  characters: CharacterRosterItem[];
  showCreateForm?: boolean;
  members?: Array<CampaignMember & { displayName: string }>;
  mode: "game_master" | "player";
  user: Pick<AuthUser, "displayName" | "id" | "role">;
}

export const CharactersPage = ({
  appName,
  campaign,
  characters,
  showCreateForm = true,
  members = [],
  mode,
  user,
}: CharactersPageProps) => {
  const title = mode === "game_master" && campaign ? `${campaign.name} characters` : "Characters";
  const action = mode === "game_master" && campaign
    ? `/campaigns/${campaign.slug}/characters`
    : "/characters";
  const ownerChoices = members.filter((member) => member.role === "player");

  return (
    <Layout title={`${title} - ${appName}`}>
      <div class="shell characters-shell">
        <SiteHeader appName={appName} currentSection="characters" user={user} />
        <main class="characters-main" aria-labelledby="characters-heading">
          <Panel labelledBy="characters-heading">
            <div class="characters-heading">
              <div class="characters-heading-copy">
                <p class="characters-kicker">{mode === "game_master" ? "Campaign roster" : "Player roster"}</p>
                <h1 id="characters-heading" class="panel-heading">
                  {title}
                </h1>
              </div>
              {showCreateForm ? (
                <a
                  class="action-link action-link-secondary character-create-link"
                  href={mode === "game_master" && campaign ? `/campaigns/${campaign.slug}/characters` : "/characters"}
                >
                  Back to roster
                </a>
              ) : (
                <a
                  class="action-link character-create-link"
                  href={mode === "game_master" && campaign ? `/campaigns/${campaign.slug}/characters/new` : "/characters/new"}
                >
                  Create character
                </a>
              )}
            </div>

            <section aria-labelledby="roster-heading">
              <h2 id="roster-heading">Roster</h2>
              {characters.length === 0 ? (
                <p class="empty-state">No characters yet.</p>
              ) : (
                <>
                  <div class="character-roster-cards" aria-label="Compact roster">
                    {characters.map((character) => (
                      <article class="character-roster-card">
                        <div>
                          <h3>
                            <a class="character-roster-link" href={`/sheet/${character.slug}`}>{character.name}</a>
                          </h3>
                          <p>{character.classSummary}</p>
                        </div>
                        <dl>
                          <div><dt>Owner</dt><dd>{character.ownerDisplayName}</dd></div>
                          <div><dt>Level</dt><dd>{character.level}</dd></div>
                          <div><dt>Species</dt><dd>{character.species}</dd></div>
                          <div><dt>Background</dt><dd>{character.background}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                  <div class="table-scroll character-roster-table-wrap">
                    <table class="sheet-table characters-table">
                      <thead>
                        <tr>
                          <th scope="col">Name</th>
                          <th scope="col">Owner</th>
                          <th scope="col">Level</th>
                          <th scope="col">Class</th>
                          <th scope="col">Species</th>
                          <th scope="col">Background</th>
                        </tr>
                      </thead>
                      <tbody>
                        {characters.map((character) => (
                          <tr>
                            <td>
                              <a class="character-roster-link" href={`/sheet/${character.slug}`}>{character.name}</a>
                            </td>
                            <td>{character.ownerDisplayName}</td>
                            <td>{character.level}</td>
                            <td>{character.classSummary}</td>
                            <td>{character.species}</td>
                            <td>{character.background}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {showCreateForm ? (
            <section class="character-create-section" aria-labelledby="create-character-heading">
              <div class="character-create-heading">
                <h2 id="create-character-heading">Create character</h2>
              </div>
              <form class="form-grid" action={action} method="post">
                {mode === "game_master" ? (
                  <FormField id="character-owner" label="Owner">
                    <select id="character-owner" name="ownerUserId">
                      {ownerChoices.map((member) => (
                        <option value={member.userId}>{member.displayName}</option>
                      ))}
                    </select>
                  </FormField>
                ) : null}
                <FormField id="character-name" label="Name" name="name" required />
                <FormField id="character-species" label="Species" name="species" required />
                <FormField id="character-class" label="Class" name="className" required />
                <FormField id="character-subclass" label="Subclass" name="subclassName" />
                <FormField id="character-background" label="Background" name="background" required />
                <FormField id="character-level" label="Level" name="level" required type="number" />
                <FormField id="character-hit-points" label="Hit point max" name="hitPointMax" required type="number" />
                <div class="character-create-actions">
                  <Button type="submit" variant="ghost">Create character</Button>
                </div>
              </form>
            </section>
            ) : null}
          </Panel>
        </main>
      </div>
    </Layout>
  );
};
