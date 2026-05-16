export const layoutStyles = /* css */ `
:root {
  --action-background-colour: #23395b;
  --action-border-colour: #1c2f4d;
  --action-text-colour: #ffffff;
  --background-colour: #f4f7fb;
  --border-colour: #d7dee9;
  --heading-colour: #172033;
  --muted-text-colour: #536174;
  --nav-active-background-colour: #e6eefb;
  --nav-active-border-colour: #aac2ec;
  --nav-active-text-colour: #173b72;
  --page-gutter: 1rem;
  --row-background-colour: #ffffff;
  --stat-background-colour: #fbfcff;
  --surface-colour: #ffffff;
  color: var(--heading-colour);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--background-colour);
  min-height: 100%;
}

body {
  margin: 0;
  min-height: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid #d24b3f;
  outline-offset: 3px;
}
`;
