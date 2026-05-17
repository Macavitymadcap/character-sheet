interface SwitchProps {
  checked?: boolean;
  dataThemeToggle?: boolean;
  id: string;
  label: string;
}

export const Switch = ({ checked = false, dataThemeToggle = false, id, label }: SwitchProps) => (
  <label class="switch" for={id}>
    <span class="switch-label">{label}</span>
    <input
      id={id}
      class="switch-input"
      type="checkbox"
      role="switch"
      aria-label={label}
      aria-checked={String(checked)}
      checked={checked}
      data-theme-toggle={dataThemeToggle ? "" : undefined}
    />
    <span class="switch-track" aria-hidden="true">
      <span class="material-symbols-outlined switch-icon switch-icon-light">light_mode</span>
      <span class="material-symbols-outlined switch-icon switch-icon-dark">dark_mode</span>
      <span class="switch-thumb"></span>
    </span>
  </label>
);
