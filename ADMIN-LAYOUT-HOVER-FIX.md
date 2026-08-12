# Admin Layout and Hover Fix

## Reproduced issue

The admin dashboard content was rendering, but wide tab content and the expandable rail did not explicitly constrain the flex and grid columns. This could make the workspace look overwritten or visually merged on narrower widths, especially around dense food cards and tables. Switching tabs could also leave the viewport at a misleading scroll position.

## Applied repair

The main app body now has `min-w-0` so wide admin content cannot force the page shell to overflow. The admin workspace grid now explicitly switches between `74px` and `240px` rail columns, while both the rail and content column use `min-w-0` and full-width constraints. Food grids and admin cards are also constrained so internal content cannot overwrite neighboring panels. Rail collapse and tab changes reset the admin viewport to the top using a shared handler.

The shared interaction tokens now define a softer light-orange hover (`--bm-ember-hover`, `--bm-ember-soft`, and `--bm-ember-wash`). Admin action buttons use dark ink text on ember surfaces, while neutral rows, settings toggles, edit actions, and the glass rail use a restrained orange wash rather than a bright white or saturated flash. Admin modals now use the shared backdrop/panel motion and layered graphite surfaces.

## Validation

The live authenticated preview rendered the Food menu with the navigation rail and three-column food grid aligned without overlap. The rail collapsed to icon-only mode and the content reflowed correctly. Hovering the Add Food Item action showed the revised lighter-orange state. TypeScript compilation, all 6 automated tests, the Vite build, and server bundling passed. The only build warning is the existing non-fatal LightningCSS native-module glob warning.

The final live check collapsed the rail and switched from Food menu to Orders. The Orders management header, filters, table, and icon-only navigation remained visible and aligned immediately after the action; the page settled at the top with only the sticky header offset.

The authenticated Rider route was then opened after the session settled. The three rider cards rendered as dark graphite panels with cream names, muted metadata, basil/saffron/error status chips, and compact approval actions. The rail stayed in the normal document flow instead of floating over the footer.

The authenticated Reviews route loaded all 12 live reviews after the initial request settled. Review rows now use compact graphite cards, cream reviewer names, saffron stars, muted two-line comments, ember-soft targets, and compact moderation buttons. The rail remains separate from the content card and no longer floats over the footer flow.

## BM Food Delivery branding and overview update

The supplied logo was installed as `public/bm-food-delivery-logo.png` and applied to the header, footer, favicon, PWA manifest, and service-worker shell cache. Visible product naming now uses **BM Food Delivery** with the tagline **Good food, fast delivery**.

The admin Overview now includes a seven-day Revenue pulse chart, a Status mix chart, and a Collected funds overview. Revenue recognition is centralized in `src/lib/orderMath.ts`: paid orders count as revenue, and cash-on-delivery orders count as collected revenue as soon as their order status becomes `delivered`. The admin status handler also marks a delivered COD order as paid and records a cash-collection audit action. A deterministic regression test covers delivered COD, pending COD, and rejected digital payment behavior.

The authenticated live Overview loaded the new BM Food Delivery logo and charts successfully. The current Firebase dataset showed 6 orders, 1 delivered order, 12 kitchens, and 3 riders; no delivered COD order was present in that snapshot, so delivered cash correctly displayed as ৳0 until a COD order is delivered.
