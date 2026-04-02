# FleetOS UI Implementation Notes

Keep these points in mind before changing routing or app bootstrap behavior.

## Routing Contract
- The public landing page must live in `index.html` at `/`.
- The React SPA is namespaced under `/app/*`.
- Internal routes currently used by the SPA:
  - `/app/dashboard`
  - `/app/boards`
  - `/app/automations`
  - `/app/settings`

## Bootstrap Behavior
- `src/main.jsx` only mounts React when `window.location.pathname` starts with `/app`.
- `#marketing-landing` is visible for non-`/app` routes.
- `#root` is hidden by default and shown only for `/app` routes.

## Navigation Consistency
- Sidebar links in `src/components/Sidebar.jsx` must stay aligned with `/app/*` routes.
- Wildcard route fallback in `src/App.jsx` should redirect to `/app/dashboard` unless product requirements change.

## Language Requirement
- User-facing copy should remain in English unless explicitly requested otherwise.
