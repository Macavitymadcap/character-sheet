import { describe, expect, test } from "bun:test";
import * as HyperDankUi from "@macavitymadcap/hyper-dank-ui";
import { Button, type HtmxProps } from "@macavitymadcap/hyper-dank-ui";
import {
  createProviderRegistry,
  planMigrations,
  type DatabaseLifecycle,
} from "@macavitymadcap/hyper-dank-data";
import { runWithProviderHarness } from "@macavitymadcap/hyper-dank-data/testing";
import { FormValues, isHtmxRequest } from "@macavitymadcap/hyper-dank-transport";
import { run, waitForHttp } from "@macavitymadcap/hyper-dank-automation";
import { renderMarkdown } from "@macavitymadcap/hyper-dank-automation/content";

const adoptedUiWrapperPaths = [
  "src/components/atoms/Badge/Badge.tsx",
  "src/components/atoms/Button/Button.tsx",
  "src/components/atoms/Panel/Panel.tsx",
  "src/components/molecules/CompactList/CompactList.tsx",
  "src/components/molecules/FormField/FormField.tsx",
  "src/components/molecules/LabelledOutput/LabelledOutput.tsx",
];

const appLocalComponentNames = [
  "Accordion",
  "Badge",
  "Button",
  "CompactList",
  "DiceRoller",
  "FormField",
  "Icon",
  "LabelledOutput",
  "Panel",
  "PasswordField",
  "PopoverMenu",
  "SiteHeader",
  "Switch",
];

const reviewedUiOverlaps = [
  ...adoptedUiWrapperPaths.map((path) => path.split("/").at(-2)),
  "Accordion",
  "Icon",
  "PopoverMenu",
  "Switch",
];

describe("Hyper-Dank package compatibility", () => {
  test("imports shared UI primitives through the public package path", () => {
    const htmxProps: HtmxProps = {
      "hx-get": "/rules",
      "hx-target": "#rules-results",
    };

    const html = String(<Button {...htmxProps}>Browse rules</Button>);

    expect(html).toContain('hx-get="/rules"');
    expect(html).toContain('hx-target="#rules-results"');
  });

  test("imports shared data primitives through public package paths", async () => {
    const migrations = [{ id: "001_create_campaigns", sql: "select 1" }];
    const plan = await planMigrations({ hasMigration: async () => false }, migrations);

    expect(plan.pending).toEqual(migrations);

    const provider: DatabaseLifecycle<"sqlite"> = {
      kind: "sqlite",
      close() {},
      migrate() {},
    };
    const registry = createProviderRegistry({ sqlite: async () => provider });

    expect(registry.has("sqlite")).toBe(true);

    await runWithProviderHarness(async () => ({ provider }), async (harnessProvider) => {
      expect(harnessProvider.kind).toBe("sqlite");
    });
  });

  test("imports shared transport helpers through the public package path", () => {
    const formValues = new FormValues({
      character: "Lynott",
    });

    expect(formValues.string("character")).toBe("Lynott");
    expect(isHtmxRequest({ get: (name) => (name === "HX-Request" ? "true" : null) })).toBe(true);
  });

  test("imports shared automation helpers through public package paths", () => {
    expect(typeof run).toBe("function");
    expect(typeof waitForHttp).toBe("function");
    expect(renderMarkdown("**Campaign Ledger**")).toContain("<strong>Campaign Ledger</strong>");
  });

  test("keeps adopted UI wrappers as Campaign Ledger compatibility shims", async () => {
    for (const path of adoptedUiWrapperPaths) {
      const source = await Bun.file(path).text();

      expect(source).toContain("@macavitymadcap/hyper-dank-ui");
      expect(source).not.toContain("return ");
      expect(source).not.toContain("<");
    }
  });

  test("flags newly available Hyper-Dank UI components that overlap local components", () => {
    const exportedUiNames = new Set(Object.keys(HyperDankUi));
    const unreviewedOverlaps = appLocalComponentNames
      .filter((componentName) => exportedUiNames.has(componentName))
      .filter((componentName) => !reviewedUiOverlaps.includes(componentName));

    expect(unreviewedOverlaps).toEqual([]);
  });
});
