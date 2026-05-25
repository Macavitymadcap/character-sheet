export const breadcrumbsStyles = /* css */ `
.breadcrumbs ol {
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumbs ol {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.breadcrumbs li + li::before {
  content: "/";
  margin-right: 0.5rem;
}

.breadcrumbs a {
  color: inherit;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
}
`;
