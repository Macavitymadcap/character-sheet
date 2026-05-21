interface PasswordFieldProps {
  autocomplete?: string;
  id: string;
  label: string;
  name?: string;
}

export const PasswordField = ({
  autocomplete,
  id,
  label,
  name = id,
}: PasswordFieldProps) => {
  return (
    <div class="form-field password-field">
      <label for={id}>{label}</label>
      <div class="password-field-control">
        <input
          id={id}
          name={name}
          type="password"
          autocomplete={autocomplete}
          required
          data-password-field
        />
        <button
          class="button"
          data-variant="ghost"
          type="button"
          aria-controls={id}
          aria-pressed="false"
          data-password-toggle
        >
          Show
        </button>
      </div>
    </div>
  );
};
