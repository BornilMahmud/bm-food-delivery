# BM Food — Reconciled Product and Engineering Instructions

## Product goal

BM Food is a production-minded food marketplace that connects customers, restaurants, riders, operations, and payments. The immediate release goal is a **premium, functional food-ordering experience** with trustworthy Firebase-backed workflows. The longer-term roadmap extends into recommendations, location discovery, dynamic ETA, kitchen operations, payouts, wallet, rewards, referrals, intelligent notifications, AI-assisted search, scheduled orders, corporate accounts, reservations, fraud detection, live operations, PWA, analytics, and automated testing.

## Non-negotiable engineering rules

The application must be improved in place. Do not rebuild working flows unnecessarily, create fake/demo behavior, or optimize only for a screenshot. All customer, admin, restaurant, rider, cart, checkout, payment, order, tracking, coupon, review, notification, settings, and role functionality must remain connected to real data and must expose loading, empty, error, and success states honestly.

Firebase and Firestore remain the source of truth. Prices, availability, restaurant ownership, payment configuration, discounts, and order totals must be revalidated server-side or inside trusted Firestore transactions. Client-side route hiding is not authorization. Firestore rules must scope customers to their own data, restaurants to assigned restaurant IDs, riders to assigned orders, and administrators to explicitly authorized accounts.

## Visual direction

Use a **Swiss editorial + 3D product showcase** system: warm ivory surfaces, ink-black typography, terracotta as the primary action color, muted sage as the operational accent, and restrained brass highlights. Use `DM Serif Display` for editorial headlines and `Manrope` for interface text. Use premium whitespace, controlled corner radii, soft shadows, subtle grain, real food photography, and motion that communicates depth rather than decoration.

Avoid generic SaaS styling, cheap multi-color gradients, excessive glassmorphism, neon, clutter, oversized marketing copy, random animation, and rounded containers on every element. Use glass only for selected overlays. Keep all motion under approximately 300ms for UI interactions, respect `prefers-reduced-motion`, use visible focus rings, and keep touch targets accessible at mobile widths.

## Homepage requirements

The landing page should lead with the product rather than a wall of text. The hero should communicate: “GOOD FOOD. DELIVERED BEAUTIFULLY.” and “Your next favorite meal is closer than you think.” It should include Explore Food and View Restaurants actions, a premium interactive food composition, subtle pointer response, floating depth layers, a soft ambient background, and a mobile-safe fallback that remains useful without heavy 3D dependencies.

After the hero, show live Trending Now foods, live Explore Categories, live Featured Restaurants, an editorial Signature Food section, live Offers, a three-step Choose → Order → Enjoy explanation, live reviews where available, and a final ordering CTA. Existing Firebase data and existing cart/detail interactions must be reused.

## Marketplace experience

Food cards must show real image, name, restaurant, rating, price hierarchy, discount, favorite affordance, and add-to-cart feedback. Restaurant pages must provide a premium header, category tabs, searchable menu, responsive food grid, and clear return paths. Cart and checkout must remain instant and trustworthy. Checkout should read as a four-step flow—Delivery, Payment, Review, Confirmation—even if the underlying application continues to use the existing functional submission path.

Manual payment must display only admin-configured provider name, account, instructions, transaction-ID field, and current status. Online gateway payment must not appear successful unless a real provider and signed webhook are configured.

## Operations roadmap

The next product increments should be prioritized as follows: (1) behavior-based recommendations and personalized home content, (2) restaurant location and distance-aware discovery, (3) dynamic ETA and real rider tracking, (4) restaurant operating dashboard with KDS columns and analytics, (5) payouts and platform commission, (6) customer wallet and rewards, (7) referrals and intelligent notifications, (8) AI assistant and natural-language search, (9) food customization and scheduled orders, (10) corporate ordering and reservations, (11) advanced review dimensions and fraud controls, (12) operations command center with live map, incident health, analytics, PWA, and automated tests.

Roadmap features must be implemented only when their data model, security rules, UI, and error states are present. Do not present placeholders as live capabilities; label future or unavailable capabilities honestly.

## Quality gate

Before delivery, run TypeScript, production build, browser smoke tests, responsive checks at 320–1920px, and critical customer/admin/restaurant/rider journeys. Record any environment-dependent blocker separately from source defects. A successful screenshot is not a substitute for working authentication, Firebase permissions, order creation, and tracking.

## Design reference

The visual system is informed by the public [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) guidance, especially its recommendations for industry-specific design systems, Swiss/editorial patterns, 3D product showcase, restrained motion, contrast, keyboard access, and responsive validation.
