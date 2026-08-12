# BM Food — Dhaka Fireline Interface System

## Direction

**Personality:** Dark editorial food-tech with premium hospitality cues.

**Foundation:** Graphite / near-black with warm cream content surfaces and a single ember-orange action color.

**Depth:** Layered surfaces plus a restrained brand-tinted shadow. Cards use quiet graphite elevation; floating UI uses warm specular borders and blur.

## Intent

BM Food serves someone deciding what to eat in Dhaka while moving between work, home, and the city’s kitchens. The interface should feel like a late-evening food hall: confident, tactile, fast, and considered. The user’s primary task is to discover a dish, trust the kitchen, and place an order without friction.

## Domain exploration

The product world is built from **night-market graphite**, **tandoor ember**, **saffron oil**, **rice-paper cream**, **delivery-bag black**, and **fresh herb green**. These colors come from food, streets, kitchens, and the delivery ritual rather than a generic software palette.

## Signature

The signature element is the **Fireline**: a thin ember-orange rule that appears beneath active navigation, across featured card edges, and beside live order status. It makes action and progress feel physically connected across discovery, checkout, and tracking.

## Defaults rejected

The old beige editorial surface is replaced by a graphite canvas with warm cream contrast. Generic white dashboard cards are replaced by layered charcoal panels with a cream reading surface only where long-form content or forms need comfort. Decorative multi-color accents are replaced by one action color—ember orange—with saffron and basil reserved for semantic emphasis.

## Tokens

### Color primitives

- Night canvas: `#0B0E11`
- Graphite panel: `#14181D`
- Raised graphite: `#1B2026`
- Overlay graphite: `#232A31`
- Cream text: `#F7EFE6`
- Soft text: `#B7ADA4`
- Paper panel: `#F5EEE6`
- Paper text: `#1A1512`
- Ember orange: `#FF5A1F`
- Ember deep: `#D93D0B`
- Saffron: `#F3B562`
- Basil: `#8FA48C`
- Error: `#FF765E`

### Semantic tokens

- Primary action: ember orange with cream foreground.
- Current state: ember orange plus Fireline.
- Success: basil with a cream or graphite label.
- Warning/manual review: saffron with graphite text.
- Error: ember coral with cream text.
- Borders: white-based at 6–12% on graphite, black-based at 8–12% on paper.

### Typography

- Display: `DM Serif Display` for food, story, and hero moments.
- UI/body: `Manrope` for navigation, forms, metadata, and controls.
- Data: `ui-monospace` with tabular numbers for prices, IDs, and metrics.
- Major Third scale: 12 / 14 / 16 / 20 / 25 / 31 / 39px, with `clamp()` for display headings.

### Spacing and shape

- Base unit: 4px; common rhythm 8 / 12 / 16 / 24 / 32 / 48 / 64px.
- Cards: 20–28px radius; compact controls: 12–16px radius; pills only for status and compact actions.
- Touch targets: minimum 44px.
- Primary CTA: 44–48px with a right-arrow icon and ember brand shadow.

### Depth

Use layered shadows sparingly on featured content and overlays. The main canvas and panels are differentiated primarily by small lightness shifts and low-opacity borders. Never use pure black or bright white as a large surface.

## Component patterns

The public storefront uses a floating frosted header, numbered editorial sections, an asymmetric bento hero, and a featured product card with a Fireline edge. Checkout uses a two-column form/summary layout with an explicit step rail. Order tracking uses a Fireline timeline and a live countdown panel. Admin uses a persistent graphite command rail with compact metrics and ember-selected tabs.

## Motion

Use 150ms hover/press feedback, 200–250ms modal entry, 300ms page transitions, and staggered reveal only for hero/section entrances. Animate transform and opacity only. Respect `prefers-reduced-motion`.

## Accessibility

Keep body text at or above WCAG AA contrast, provide visible focus rings, retain keyboard access to all actions, and never rely on orange/green alone for status. Pair color with text and icons.
