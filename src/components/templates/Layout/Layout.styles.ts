export const layoutStyles = /* css */ `
:root {
  --action-background-colour: #23395b;
  --action-border-colour: #1c2f4d;
  --action-text-colour: #ffffff;
  --background-colour: #f4f7fb;
  --border-colour: #d7dee9;
  --focus-colour: #d24b3f;
  --heading-colour: #172033;
  --muted-text-colour: #536174;
  --nav-active-background-colour: #e6eefb;
  --nav-active-border-colour: #aac2ec;
  --nav-active-text-colour: #173b72;
  --page-gutter: 1rem;
  --row-background-colour: #ffffff;
  --shadow-colour: rgb(15 23 42 / 0.08);
  --stat-background-colour: #fbfcff;
  --surface-colour: #ffffff;
  --switch-icon-dark: #334155;
  --switch-icon-light: #f59e0b;
  --theme-duration: 220ms;
  --theme-easing: ease;
  --theme-transition: var(--theme-duration) var(--theme-easing);
  --theme-text-transition: 0ms linear;
  color-scheme: light;
  color: var(--heading-colour);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:root[data-theme="dark"] {
  --action-background-colour: #8fb4ff;
  --action-border-colour: #b7cdf8;
  --action-text-colour: #0e1726;
  --background-colour: #0f1726;
  --border-colour: #334155;
  --focus-colour: #f59e0b;
  --heading-colour: #eef4ff;
  --muted-text-colour: #b8c4d6;
  --nav-active-background-colour: #1f3151;
  --nav-active-border-colour: #5f83c2;
  --nav-active-text-colour: #d9e6ff;
  --row-background-colour: #111c2d;
  --shadow-colour: rgb(0 0 0 / 0.24);
  --stat-background-colour: #162238;
  --surface-colour: #121c2d;
  --switch-icon-dark: #f8fafc;
  --switch-icon-light: #fde68a;
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--background-colour);
  min-height: 100%;
  transition: background-color var(--theme-transition);
}

body {
  background: var(--background-colour);
  color: var(--heading-colour);
  margin: 0;
  min-height: 100%;
  transition:
    background-color var(--theme-transition),
    color var(--theme-text-transition);
}

button,
input,
select,
textarea {
  font: inherit;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--focus-colour);
  outline-offset: 3px;
}

.visually-hidden {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
`;
