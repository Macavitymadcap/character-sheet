interface FormFieldProps {
  autocomplete?: string;
  children?: unknown;
  id: string;
  label: string;
  name?: string;
  required?: boolean;
  type?: "email" | "password" | "text";
}

export const FormField = ({
  autocomplete,
  children,
  id,
  label,
  name = id,
  required = false,
  type = "text",
}: FormFieldProps) => {
  return (
    <div class="form-field">
      <label for={id}>{label}</label>
      {children ?? (
        <input
          id={id}
          name={name}
          type={type}
          autocomplete={autocomplete}
          required={required}
        />
      )}
    </div>
  );
};
