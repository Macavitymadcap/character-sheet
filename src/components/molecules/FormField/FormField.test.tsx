import { describe, expect, test } from "bun:test";
import { FormField } from "./FormField";

const render = (node: unknown): string => String(node);

describe("FormField", () => {
  test("renders a labelled input", () => {
    const html = render(
      <FormField
        autocomplete="username"
        id="email"
        label="Email"
        name="email"
        required
        type="email"
      />,
    );

    expect(html).toContain('<label for="email">Email</label>');
    expect(html).toContain(
      '<input id="email" name="email" type="email" autocomplete="username" required=""/>',
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

    expect(html).toContain('<label for="role">Role</label>');
    expect(html).toContain('<select id="role" name="role">');
  });
});
