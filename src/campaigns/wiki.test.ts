import { describe, expect, test } from "bun:test";
import { normaliseGoogleDocsMarkdown, renderCampaignMarkdown } from "./wiki";

const render = (node: unknown): string => String(node);

describe("campaign wiki Markdown", () => {
  test("normalises Google Docs export spacing", () => {
    expect(normaliseGoogleDocsMarkdown("# Rovnost\r\n\r\n\r\n**Factions**  \n")).toBe(
      "# Rovnost\n\n**Factions**",
    );
  });

  test("renders title lines, bold headings, italic quotes, lists, and scene breaks safely", () => {
    const html = render(
      renderCampaignMarkdown(`# Rovnost

**Opening move**

_The city looks up._

- Skywrights
- Ash Ledger

***

<script>alert("bad")</script>`),
    );

    expect(html).toContain("<h2>Rovnost</h2>");
    expect(html).toContain("<h3>Opening move</h3>");
    expect(html).toContain("<p><em>The city looks up.</em></p>");
    expect(html).toContain("<ul><li>Skywrights</li><li>Ash Ledger</li></ul>");
    expect(html).toContain("<hr />");
    expect(html).toContain("&lt;script&gt;alert(&quot;bad&quot;)&lt;/script&gt;");
  });
});
