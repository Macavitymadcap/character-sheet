interface ButtonProps {
  children: unknown;
  type?: "button" | "submit";
  variant?: "ghost" | "primary";
}

export const Button = ({ children, type = "button", variant = "primary" }: ButtonProps) => {
  return (
    <button class="button" data-variant={variant} type={type}>
      {children}
    </button>
  );
};
