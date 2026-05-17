interface PanelProps {
  children: unknown;
  labelledBy?: string;
  width?: "default" | "narrow";
}

export const Panel = ({ children, labelledBy, width = "default" }: PanelProps) => {
  return (
    <section class="panel" data-width={width} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
};
