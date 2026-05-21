# Versioning

This project uses `MAJOR.MINOR.PATCH`.

Version sources must match:

- `package.json` at the root
- any app-specific manifests if present
- deployment config version fields if introduced

## Bump rules

- **PATCH** — bug fixes, small UI polish, documentation corrections that affect usage, dependency compatibility fixes, refactors with no intended behaviour change.
- **MINOR** — new features, meaningful UX changes, new settings, new screens, new integrations, new deployment capability, additive domain behaviour.
- **MAJOR** — breaking persistence/schema changes, incompatible public API changes, removed capabilities, or production release line reset.

Pre-1.0:

- use `MINOR` for meaningful feature milestones
- use `PATCH` for fixes and smaller refinements

## Process

Before every commit, decide whether the work changes:

- app behaviour
- user-visible UX
- deployment behaviour
- dependencies
- persistence schema
- public APIs
- usage documentation
- print/PDF output
- access-control behaviour
- answer visibility behaviour

If yes, bump the version and update `docs/CHANGELOG.md` in the same commit.

If no, note in the commit message that the change is version-neutral.

Do not commit feature or fix work without either a version bump or an explicit version-neutral note.

## Schema and persistence changes

Database changes require extra care.

- Add a Drizzle migration.
- Document significant schema decisions in `docs/DECISIONS.md`.
- Add or update tests for affected domain/repository behaviour.
- Increment `MAJOR` only if old data cannot be migrated safely.
- Update `docs/ARCHITECTURE.md` if boundaries or persistence shape change.

## Documentation-only changes

Documentation-only changes can still require a version bump if they affect usage, setup, deployment, or agent behaviour.

Purely internal notes, typo fixes, or planning drafts may be version-neutral if they do not affect project behaviour or usage.
