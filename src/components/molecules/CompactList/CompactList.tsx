export interface CompactListItem {
  label: string;
  meta?: string;
  value: string;
}

interface CompactListProps {
  items: CompactListItem[];
}

export const CompactList = ({ items }: CompactListProps) => {
  return (
    <dl class="compact-list">
      {items.map((item) => (
        <div class="compact-list-row">
          <dt>{item.label}</dt>
          <dd>
            <strong>{item.value}</strong>
            {item.meta ? <span>{item.meta}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
};
