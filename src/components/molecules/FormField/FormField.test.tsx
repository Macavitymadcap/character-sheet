import { describe, expect, test } from "bun:test";
import { FormField } from "./FormField";

const render = (node: unknown): string => String(node);

describe("FormField", () => {
  test("renders a labelled input", () => {
    const html = render(
      <FormField
        autocomplete="email"
        id="email"
        label="Email"
        name="email"
        required
        type="email"
      />,
    );

    expect(html).toContain('<label class="form-field" for="email">');
    expect(html).toContain("<span>Email</span>");
    expect(html).toContain(
      '<input id="email" name="email" type="email" autocomplete="email" required=""/>',
    );
  });

  test("renders custom controls", () => {
    const html = render(
      <FormField id="role" label="Role">
        <select id="role" name="role">
          <option value="player">Player</option>
        </select>
      </FormField>,
    );

    expect(html).toContain('<label class="form-field" for="role">');
    expect(html).toContain("<span>Role</span>");
    expect(html).toContain('<select id="role" name="role">');
  });
});
