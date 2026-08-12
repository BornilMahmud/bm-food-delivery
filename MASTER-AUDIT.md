# BM Food Master-Prompt Audit

## Current source status

The existing project is a React 19 + TypeScript + Vite app with a lightweight Express development server and Firebase client SDK. It already contains customer, checkout, order tracking, admin, restaurant, rider, coupon, review, banner, notification, and settings surfaces. The prior repair pass removed client-side role switching, hardened Firestore rules, made checkout transaction-based, removed demo credentials, and added a premium customer homepage shell.

## Confirmed gaps against the new master prompt

| Requirement | Current state | Required action |
| --- | --- | --- |
| Live Firestore data | Client queries are present, but the sandbox receives `Missing or insufficient permissions`; deployed rules/data are not confirmed. | Normalize collections/rules, add deterministic seed script, add exact deployment instructions, and test client behavior separately from external deployment. |
| Admin identity | Firestore role is the real authorization source, but the specified administrator email is not provisioned by source code. | Add safe bootstrap instructions/script that resolves the Firebase Auth UID and upserts `users/{uid}` as active admin without storing a password. |
| Admin routes | The app uses an internal view switch and has one admin surface; `/admin` URL routing and requested subroutes are missing. | Add history-based protected route mapping and admin section paths/query state while preserving existing components. |
| Admin CRUD | Existing tabs cover many collections, but foods/restaurants/categories/payment methods/settings need a more complete and consistent CRUD contract. | Extend operations UI and shared audit logging for sensitive mutations. |
| Data model | Existing types lack today’s collection fields, food options, payout/reward/audit/favorite/address/analytics structures, and several required payment/status variants. | Extend types and rules conservatively; add only data structures backed by UI or seed workflows. |
| Seed data | Seed constants exist in client code and use `deliveryRiders`; no deterministic `scripts/seed-firestore.ts` command exists. | Move population into a Node seed script with deterministic IDs and an explicit `npm run seed`/`pnpm seed` command. |
| Customer personalization | Favorites are local-only in the redesigned card; recommendation/personalized sections are not yet real. | Add Firestore-backed favorite toggle and behavior-based recommendations using authenticated order history where available. |
| Checkout customization | Notes are supported, but configurable food options are not in the cart/order model. | Add selection-aware option pricing and persist selected options in cart, checkout, and order items. |
| Tracking | Real-time order status exists; live map/GPS is not implemented and cannot be claimed without location data/provider integration. | Keep the timeline real, add ETA/status timestamps, and label map/GPS as unavailable until a real provider/data source exists. |
| Operations | Admin, restaurant, and rider dashboards exist but do not fully cover KDS, payout, audit, advanced analytics, or incident health. | Add real-data KPI/operations views where collections exist; expose unavailable integrations honestly. |
| PWA/testing | PWA manifest and automated test scripts are missing. | Add installability metadata and deterministic calculation tests; run available TypeScript/build/browser checks. |

## External dependency boundary

The Firebase project ID and web configuration are already present in the source. The sandbox has not been granted Firebase Admin credentials or deployment access, so no source change can truthfully claim that production Firestore rules, indexes, seed data, or the requested administrator profile have been deployed. The final deliverable must include exact commands and Firebase Console steps for those actions, plus a clear distinction between source fixes and deployment prerequisites.

## Design reference

The visual direction was reconciled against the referenced UI/UX design intelligence repository: [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). The implementation applies its hierarchy, spacing, responsive, accessibility, interaction, and component-consistency principles without copying external code.
