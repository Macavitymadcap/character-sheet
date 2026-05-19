import type { AuthUser, RuleDetail, RuleEntityType, RuleEntityTypeCount, RuleSearchFilters, RuleSummary } from "../../../db";
import { Badge } from "../../atoms/Badge";
import { Panel } from "../../atoms/Panel";
import { SiteHeader } from "../../molecules/SiteHeader";
import { Layout } from "../../templates/Layout";

interface RulesPageProps {
  appName: string;
  counts: RuleEntityTypeCount[];
  filters: RuleSearchFilters;
  rules: RuleSummary[];
  user: Pick<AuthUser, "displayName" | "role">;
}

interface RulesDetailPageProps {
  appName: string;
  counts: RuleEntityTypeCount[];
  filters: RuleSearchFilters;
  rule: RuleDetail;
  user: Pick<AuthUser, "displayName" | "role">;
}

export const RulesPage = ({ appName, counts, filters, rules, user }: RulesPageProps) => (
  <Layout title={`Rules - ${appName}`}>
    <div class="shell rules-shell">
      <SiteHeader appName={appName} currentSection="rules" user={user} />
      <main class="rules-main" aria-labelledby="rules-heading">
        <Panel labelledBy="rules-heading">
          <div class="rules-heading">
            <p class="rules-kicker">SRD 5.1</p>
            <h1 id="rules-heading" class="panel-heading">Rules</h1>
          </div>
          <RulesFilterForm counts={counts} filters={filters} />
        </Panel>
        <Panel labelledBy="rules-results-heading">
          <div class="rules-results-heading">
            <h2 id="rules-results-heading" class="panel-heading">Results</h2>
            <p>{rules.length} rule{rules.length === 1 ? "" : "s"}</p>
          </div>
          {rules.length > 0 ? (
            <div class="rules-result-list">
              {rules.map((rule) => (
                <article class="rules-result-card">
                  <div class="rules-result-title">
                    <h3>
                      <a href={`/rules/${rule.entityType}/${rule.slug}`}>{rule.name}</a>
                    </h3>
                    <Badge>{formatRuleType(rule.entityType)}</Badge>
                  </div>
                  <p>{summarise(rule.description)}</p>
                  <div class="rules-tag-list" aria-label={`${rule.name} metadata`}>
                    <span>{formatContentCategory(rule.contentCategory)}</span>
                    <span>{rule.sourceAbbreviation}</span>
                    {rule.tags.slice(0, 4).map((tag) => <span>{formatWords(tag)}</span>)}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p class="rules-empty-state">No rules match those filters.</p>
          )}
        </Panel>
      </main>
    </div>
  </Layout>
);

export const RulesDetailPage = ({ appName, counts, filters, rule, user }: RulesDetailPageProps) => (
  <Layout title={`${rule.name} - Rules - ${appName}`}>
    <div class="shell rules-shell">
      <SiteHeader appName={appName} currentSection="rules" user={user} />
      <main class="rules-main" aria-labelledby="rule-detail-heading">
        <Panel labelledBy="rules-filter-heading">
          <div class="rules-heading">
            <p class="rules-kicker">SRD 5.1</p>
            <h1 id="rules-filter-heading" class="panel-heading">Rules</h1>
          </div>
          <RulesFilterForm counts={counts} filters={{ ...filters, entityType: filters.entityType ?? rule.entityType }} />
        </Panel>
        <Panel labelledBy="rule-detail-heading">
          <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <a href={`/rules?type=${rule.entityType}`}>Rules</a>
            <span aria-hidden="true">/</span>
            <span>{rule.name}</span>
          </nav>
          <p class="rules-kicker">{rule.sourceName}</p>
          <h1 id="rule-detail-heading" class="panel-heading">{rule.name}</h1>
          <div class="rules-tag-list">
            <Badge>{formatRuleType(rule.entityType)}</Badge>
            <span>{formatContentCategory(rule.contentCategory)}</span>
            {rule.tags.map((tag) => <span>{formatWords(tag)}</span>)}
          </div>
          {rule.mechanics.map((mechanic) => (
            <section class="rule-mechanic" aria-label={formatWords(mechanic.mechanicType)}>
              {renderMechanicData(mechanic.data)}
            </section>
          ))}
          {rule.provenance?.originalPath ? (
            <p class="rules-provenance">
              Source: {rule.sourceAbbreviation}
              {rule.provenance.srdVersion ? ` ${rule.provenance.srdVersion}` : ""} · {rule.provenance.originalPath}
            </p>
          ) : null}
        </Panel>
      </main>
    </div>
  </Layout>
);

const RulesFilterForm = ({ counts, filters }: { counts: RuleEntityTypeCount[]; filters: RuleSearchFilters }) => (
  <form class="rules-filter-form" action="/rules" method="get">
    <label>
      Search
      <input name="q" type="search" value={filters.query ?? ""} />
    </label>
    <label>
      Type
      <select name="type">
        <option value="">All</option>
        {counts.map((count) => (
          <option value={count.entityType} selected={filters.entityType === count.entityType}>
            {formatRuleType(count.entityType)} ({count.count})
          </option>
        ))}
      </select>
    </label>
    <label>
      Spell level
      <select name="level">
        <option value="">Any</option>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
          <option value={String(level)} selected={filters.spellLevel === level}>
            {level === 0 ? "Cantrip" : String(level)}
          </option>
        ))}
      </select>
    </label>
    <label>
      Equipment
      <select name="equipment">
        <option value="">Any</option>
        {["armour", "weapon", "adventuring gear", "equipment"].map((category) => (
          <option value={category} selected={filters.equipmentCategory === category}>
            {formatWords(category)}
          </option>
        ))}
      </select>
    </label>
    <button type="submit">Filter</button>
    <a class="rules-reset-link" href="/rules">Reset</a>
  </form>
);

function renderMechanicData(data: Record<string, unknown>) {
  const entries = Object.entries(data).filter(([key]) => !["provenance", "searchableText", "tags"].includes(key));
  const description = typeof data.description === "string" ? data.description : "";

  return (
    <div class="rule-mechanic-body">
      {description ? <p>{description}</p> : null}
      <dl>
        {entries
          .filter(([key, value]) => key !== "description" && value !== "" && value !== null && value !== undefined)
          .map(([key, value]) => (
            <div>
              <dt>{formatWords(key)}</dt>
              <dd>{formatMechanicValue(value)}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function formatMechanicValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

function summarise(value: string) {
  const oneLine = value.replace(/\s+/g, " ").trim();

  return oneLine.length > 180 ? `${oneLine.slice(0, 177)}...` : oneLine;
}

function formatRuleType(value: RuleEntityType | string) {
  return formatWords(value.replace(/_/g, " "));
}

function formatContentCategory(value: string) {
  if (value === "srd") return "SRD";
  if (value === "local") return "Local";

  return "Non-SRD";
}

function formatWords(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
