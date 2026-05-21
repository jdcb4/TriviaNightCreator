# Design Tokens

Visual style for TriviaNightCreator is defined as **tokens** — single, named values referenced everywhere they are used. Components compose these tokens; feature code does not embed raw values, raw colours, raw Tailwind palette classes, or one-off typography styling.

This is a hard rule, not a style preference. See `AGENTS.md`.

## Design intent

TriviaNightCreator should feel:

- clear enough for a busy event organiser
- polished enough for corporate and fundraiser use
- calm in the builder and scoring screens
- bold and legible in presentation mode
- reliable and print-conscious in print previews

Design tokens should support both:

- app UI screens
- audience-facing presentation screens
- print/PDF templates

## The three layers

```text
┌──────────────────────────────────────────────────────────────────┐
│ apps/web/src/app/*, src/features/*, feature components           │  ← semantic-token classes only
│   bg-surface-raised, text-text-secondary, text-h2, ...           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ components/ui/typography.tsx, components/ui/surface.tsx          │  ← reusable primitives
│   <Heading>, <Body>, <Subtle>, <Surface>, <Stack>, <Caption>     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ tailwind.config.ts                                               │  ← maps semantic names to CSS vars
│   colors: { surface: { base: 'hsl(var(--surface-base) / …)' } }  │
│   fontSize: { h2: ['var(--font-size-h2)', …] }                   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│ src/styles/tokens.css or apps/web/src/styles/tokens.css          │  ← source of truth
│   --surface-base, --text-secondary, --font-size-h2, …            │
└──────────────────────────────────────────────────────────────────┘
```

## When to use what

| Situation | Reach for |
| --- | --- |
| Heading or display text | `<Heading level={1..4}>` or `<Heading display>` |
| Body text | `<Body>` |
| Secondary / muted text | `<Subtle>` |
| Eyebrow / metadata | `<Caption>` |
| Inline code / monospace | `<Code>` |
| Panel / card background | `<Surface variant="raised">` or similar |
| Vertical or horizontal stack | `<Stack gap="default">` |
| App status/error/success | semantic accent tokens |
| Presentation slide title | presentation typography token or primitive |
| Print/PDF text style | print typography token or print primitive |
| One-off colour or text style | add a token first |

## Available semantic tokens

Exact names may evolve. Keep this section current with `tokens.css` and `tailwind.config.ts`.

### Surfaces

Use as `bg-surface-*`.

- `surface-base` — page background.
- `surface-raised` — cards, panels, work areas.
- `surface-overlay` — modals, popovers, command menus.
- `surface-sunken` — input fills, recessed areas.
- `surface-presentation` — audience-facing presentation background, if needed.
- `surface-print` — print/PDF page background, usually white.

### Text

Use as `text-text-*`.

- `text-text-primary` — primary copy.
- `text-text-secondary` — secondary copy.
- `text-text-subtle` — tertiary / placeholder.
- `text-text-on-accent` — text rendered on a strong accent fill.
- `text-text-presentation` — presentation-screen copy, if separate from primary.
- `text-text-print` — print/PDF copy.

### Accents

- `bg-accent-primary` / `text-accent-primary` — brand emphasis.
- `bg-accent-success` / `text-accent-success`
- `bg-accent-warning` / `text-accent-warning`
- `bg-accent-danger` / `text-accent-danger`
- `bg-accent-info` / `text-accent-info`

Use warning tokens for score override warnings and incomplete scoring states.

### Borders

- `border-border-default` — default rule.
- `border-border-subtle` — barely-there separator.
- `border-border-strong` — emphasised divider.
- `border-border-print` — print/PDF answer-line and box strokes.

### Typography sizes

- `text-display`
- `text-h1`
- `text-h2`
- `text-h3`
- `text-h4`
- `text-body`
- `text-body-sm`
- `text-caption`
- `text-presentation-title`
- `text-presentation-question`
- `text-print-title`
- `text-print-body`
- `text-print-answer-line`

Each should carry its own line-height and letter-spacing. Prefer primitives rather than direct class use.

### Layout sizing

Useful project-specific tokens may include:

- answer sheet page margins
- answer line height
- answer row gap
- print header height
- presentation safe-area padding
- builder sidebar width
- scoring grid row height

Document non-obvious layout tokens here when introduced.

## Print/PDF token rules

Print output is core product behaviour.

PDF templates must not use arbitrary visual values scattered through template code. Define print-specific tokens for:

- A4 page margins
- answer-line thickness
- score-box border
- marker-box border
- print title size
- print footer size
- decoration slot sizes
- portrait and landscape spacing

Decorative cartoons should be black-and-white assets. Do not tint them ad hoc in feature code.

## Adding or changing a token

1. Edit `tokens.css`. Add or change the CSS variable in `:root` and any theme variant.
2. If it is a new variable, expose it in `tailwind.config.ts` under the matching theme key.
3. If it is a new typography pattern, add or update a primitive rather than encouraging direct class use.
4. If it is a derived value, compute it in `tokens.css`. Do not compute hover/tint/variant values at the call site.
5. Document non-obvious tokens in this file.

## Theme switching

The project may support light/dark app themes later, but print/PDF output should remain print-appropriate unless a specific print theme is introduced.

To support additional themes, add a theme class such as `.theme-high-contrast` or `.theme-fundraiser` to `tokens.css` and toggle that class from the theme provider.

## What NOT to do

- `<h2 className="text-3xl font-semibold tracking-tight">` — write `<Heading level={2}>`.
- `<div className="bg-blue-500">` — use a semantic surface/accent token.
- `<p className="text-neutral-400">` — use `<Subtle>`.
- `bg-blue-500 hover:bg-blue-600` — define both states as tokens.
- Hex colours, raw rem values, raw Tailwind palette classes, or arbitrary values outside `tokens.css` and `tailwind.config.ts`.

## What is still fine inline

Layout-only utilities that do not encode visual style decisions:

- `flex`, `flex-col`, `items-center`, `justify-between`
- `min-h-dvh`, `w-full`, `max-w-prose`
- `px-6`, `py-2`, `gap-4`, `space-y-2`
- `grid`, `grid-cols-2`, responsive prefixes
- `hidden`, `sm:flex`

The line is: would changing the project design language affect this class? If yes, it is a token. If no, it is layout.
