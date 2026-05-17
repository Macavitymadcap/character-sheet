interface IconProps {
  label?: string;
  name: string;
  tone?: "muted" | "neutral" | "success" | "warning";
}

export const Icon = ({ label, name, tone = "neutral" }: IconProps) => (
  <span
    class={`icon icon-${tone}`}
    aria-hidden={label ? undefined : "true"}
    aria-label={label}
    data-icon={name}
    role={label ? "img" : undefined}
  >
    {formatIcon(name)}
  </span>
);

function formatIcon(name: string) {
  const icons: Record<string, string> = {
    check: "✓",
    check_circle: "✓",
    radio_button_unchecked: "○",
    workspace_premium: "★",
  };

  return icons[name] ?? name;
}
