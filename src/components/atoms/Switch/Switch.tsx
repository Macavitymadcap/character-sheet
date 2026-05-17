import { Icon } from "../Icon";

interface SwitchProps {
  checked?: boolean;
  dataThemeToggle?: boolean;
  hxPatch?: string;
  hxSwap?: string;
  hxTarget?: string;
  hxTrigger?: string;
  hxVals?: string;
  id: string;
  label: string;
  offIcon?: string;
  onIcon?: string;
  thumbGradient?: string;
  trackGradient?: string;
  trackOverlay?: string;
  variant?: "inspiration" | "theme";
}

export const Switch = ({
  checked = false,
  dataThemeToggle = false,
  hxPatch,
  hxSwap,
  hxTarget,
  hxTrigger,
  hxVals,
  id,
  label,
  offIcon = "sun",
  onIcon = "moon",
  thumbGradient,
  trackGradient,
  trackOverlay,
  variant = "theme",
}: SwitchProps) => {
  const style = formatSwitchStyle({ thumbGradient, trackGradient, trackOverlay });

  return (
    <label class="switch" data-variant={variant} for={id} style={style}>
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
        hx-patch={hxPatch}
        hx-swap={hxSwap}
        hx-target={hxTarget}
        hx-trigger={hxTrigger}
        hx-vals={hxVals}
      />
      <span class="switch-track" aria-hidden="true">
        <span class="switch-icon switch-icon-off">
          <Icon name={offIcon} />
        </span>
        <span class="switch-icon switch-icon-on">
          <Icon name={onIcon} />
        </span>
        <span class="switch-thumb"></span>
      </span>
    </label>
  );
};

function formatSwitchStyle({
  thumbGradient,
  trackGradient,
  trackOverlay,
}: Pick<SwitchProps, "thumbGradient" | "trackGradient" | "trackOverlay">) {
  const declarations = [
    trackGradient ? `--switch-track-gradient: ${trackGradient}` : null,
    trackOverlay ? `--switch-track-overlay: ${trackOverlay}` : null,
    thumbGradient ? `--switch-thumb-gradient: ${thumbGradient}` : null,
  ].filter(Boolean);

  return declarations.length > 0 ? `${declarations.join("; ")};` : undefined;
}
