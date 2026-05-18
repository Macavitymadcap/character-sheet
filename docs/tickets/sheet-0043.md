# Ticket sheet-0043: Shared HTTP Helpers

## Summary

Adopt Hyper-Dank HTTP helpers for generic form parsing, validation, redirects, and fragment
responses where behaviour stays equivalent.

## Implementation

- Replace local route helper code only where Hyper-Dank provides a stable public helper.
- Preserve route paths, HTMX fragment contracts, status codes, redirects, and validation messages.
- Keep auth, sessions, guards, and campaign permissions owned by Character Sheet.

## Tests First

- Add route tests around form failures, redirects, HTMX fragment responses, and forbidden requests
  before migrating helpers.

## Acceptance Criteria

- Shared HTTP helpers reduce local boilerplate without changing user-visible route behaviour.
