interface LabelledOutputProps {
  label: string;
  value: string;
}

export const LabelledOutput = ({ label, value }: LabelledOutputProps) => {
  return (
    <div class="labelled-output">
      <span class="labelled-output-label">{label}</span>
      <strong class="labelled-output-value">{value}</strong>
    </div>
  );
};
