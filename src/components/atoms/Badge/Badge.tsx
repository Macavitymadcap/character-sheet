interface BadgeProps {
  children: unknown;
  tone?: "accent" | "neutral" | "warning";
}

export const Badge = ({ children, tone = "neutral" }: BadgeProps) => {
  return (
    <span class="badge" data-tone={tone}>
      {children}
    </span>
  );
};
