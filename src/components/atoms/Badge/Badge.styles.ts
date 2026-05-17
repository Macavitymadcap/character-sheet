export const badgeStyles = /* css */ `
.badge {
  align-items: center;
  background: var(--badge-background-colour);
  border: 1px solid var(--badge-border-colour);
  border-radius: 999px;
  color: var(--badge-text-colour);
  display: inline-flex;
  font-size: 0.8125rem;
  font-weight: 700;
  gap: 0.35rem;
  line-height: 1;
  min-height: 1.75rem;
  padding: 0.25rem 0.65rem;
  white-space: nowrap;
}

.badge[data-tone="accent"] {
  --badge-background-colour: #e9f7ef;
  --badge-border-colour: #a6d8b8;
  --badge-text-colour: #14532d;
}

.badge[data-tone="warning"] {
  --badge-background-colour: #fff1d6;
  --badge-border-colour: #f0bd62;
  --badge-text-colour: #6b3b00;
}

.badge[data-tone="neutral"] {
  --badge-background-colour: #eef2f7;
  --badge-border-colour: #c7d0dc;
  --badge-text-colour: #273449;
}
`;
