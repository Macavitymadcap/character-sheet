export interface AccordionItem {
  body: unknown;
  controls?: unknown;
  id: string;
  meta?: string;
  title: unknown;
}

interface AccordionProps {
  items: AccordionItem[];
  name: string;
}

export const Accordion = ({ items, name }: AccordionProps) => (
  <div class="accordion">
    {items.map((item) => (
      <details class="accordion-item" name={name}>
        <summary>
          <span>
            <strong>{item.title}</strong>
            {item.meta ? <small>{item.meta}</small> : null}
          </span>
        </summary>
        <div class="accordion-body" id={item.id}>
          {item.body}
          {item.controls ? <div class="accordion-controls">{item.controls}</div> : null}
        </div>
      </details>
    ))}
  </div>
);
