interface IconProps {
  label?: string;
  name: string;
  tone?: "muted" | "neutral" | "success" | "warning";
}

export const Icon = ({ label, name, tone = "neutral" }: IconProps) => {
  const icon = getIcon(name);

  return (
    <span
      class={`icon icon-${tone}`}
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      data-icon={icon.id}
      role={label ? "img" : undefined}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        {icon.paths}
      </svg>
    </span>
  );
};

function getIcon(name: string) {
  const iconName = aliases[name] ?? name;

  return {
    id: iconName,
    paths: icons[iconName] ?? icons.circle,
  };
}

const aliases: Record<string, string> = {
  auto_awesome: "sparkles",
  check: "check-circle",
  check_circle: "check-circle",
  dark_mode: "moon",
  light_mode: "sun",
  radio_button_unchecked: "circle",
  workspace_premium: "star",
};

const icons: Record<string, unknown> = {
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" stroke-width="2.25" />
      <path
        d="M8.25 12.15l2.25 2.25 5.25-5.4"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.25"
      />
    </>
  ),
  circle: <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" stroke-width="2.5" />,
  menu: (
    <>
      <path d="M4.5 7h15" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
      <path d="M4.5 12h15" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
      <path d="M4.5 17h15" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
    </>
  ),
  moon: (
    <path
      d="M20.4 14.7A8.8 8.8 0 019.3 3.6 8.8 8.8 0 1012 21.1a8.8 8.8 0 008.4-6.4z"
      fill="currentColor"
    />
  ),
  sparkles: (
    <>
      <path d="M10.9 3.7l1.8 4.1 4.1 1.8-4.1 1.8-1.8 4.1-1.8-4.1L5 9.6l4.1-1.8 1.8-4.1z" fill="currentColor" />
      <path d="M17.6 12.6l0.9 2 2 0.9-2 0.9-0.9 2-0.9-2-2-0.9 2-0.9 0.9-2z" fill="currentColor" />
      <path d="M5.9 14.4l0.7 1.5 1.5 0.7-1.5 0.7-0.7 1.5-0.7-1.5-1.5-0.7 1.5-0.7 0.7-1.5z" fill="currentColor" />
    </>
  ),
  star: (
    <path
      d="M12 3.1l2.45 5.2 5.55 0.85-4.05 4.05 0.95 5.7L12 16.15 7.1 18.9l0.95-5.7L4 9.15l5.55-0.85L12 3.1z"
      fill="currentColor"
    />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.35" fill="currentColor" />
      <path
        d="M12 1.8a1 1 0 011 1v1.1a1 1 0 11-2 0V2.8a1 1 0 011-1zM12 19.1a1 1 0 011 1v1.1a1 1 0 11-2 0v-1.1a1 1 0 011-1zM4.8 3.95a1 1 0 011.42 0L7 4.74a1 1 0 01-1.42 1.42l-.78-.79a1 1 0 010-1.42zM17 17a1 1 0 011.42 0l.78.79a1 1 0 01-1.42 1.42L17 18.42A1 1 0 0117 17zM1.8 12a1 1 0 011-1h1.1a1 1 0 110 2H2.8a1 1 0 01-1-1zM19.1 12a1 1 0 011-1h1.1a1 1 0 110 2h-1.1a1 1 0 01-1-1zM4.8 20.05a1 1 0 010-1.42l.78-.79A1 1 0 117 19.26l-.78.79a1 1 0 01-1.42 0zM17 7a1 1 0 010-1.42l.78-.79a1 1 0 011.42 1.42l-.78.79A1 1 0 0117 7z"
        fill="currentColor"
      />
    </>
  ),
};
