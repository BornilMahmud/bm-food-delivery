# BM Food Audit Findings

## Baseline

The extracted React/Vite application type-checks successfully with the locally installed TypeScript compiler, and `vite build` completes successfully. The production bundle emits a chunk-size warning because the main JavaScript chunk is larger than 500 kB.

## Browser smoke test

The local server starts and the home page renders successfully. Header navigation, hero content, loading state, empty catalog state, and footer are visible. Browser console output shows repeated Firebase `Missing or insufficient permissions` errors while loading coupons and the live home catalog. This indicates the local source rules have not been deployed to the configured Firebase project, or the deployed project rules differ from the checked-in rules. The UI now surfaces live-data unavailability instead of silently presenting the seeded demo catalog.

## Critical source findings addressed

The original code contained a broken order-history view identifier (`my-orders` vs `user-orders`), client-side role switching, unauthenticated admin bypass, email-based admin inference, demo data fallbacks, client-trusted checkout totals, fabricated online gateway success, unscoped restaurant/rider order queries, rider-side payment mutation, and a permissive Firestore ruleset. The working tree now contains fixes for these issues, including authenticated admin gating, ownership-aware vendor/rider queries, Firestore transaction-based checkout revalidation, live order-history listeners, dynamic cart pricing, and explicit gateway-not-configured responses.

## Deployment prerequisite

The revised `firestore.rules` file must be deployed to the `bm-food-d04b1` Firebase project using an authorized Firebase deployment workflow. Until deployed, browser requests will continue to follow the currently deployed rules rather than the checked-in rules.

## Navigation smoke test

After the latest build, the browser refreshed successfully and the `Restaurants` header button navigated to the restaurant listing view. The page rendered its live-data error and empty state without a runtime crash. This confirms the top-level view switching and the corrected order-history identifier pattern are functioning at the UI level; live catalog content still depends on deploying compatible Firestore rules and having data in the configured project.

## Customer access smoke test

The `My Orders` navigation now reaches the existing order-history page and correctly shows a sign-in requirement when no authenticated session is present. Its `Log In / Sign Up` action opens the authentication modal successfully. The modal still includes quick demo-fill buttons in the current working tree; these are UI conveniences only and do not grant roles after the authentication hardening, but they should be removed before a production launch if demo account credentials are not intended to be exposed.

## Authentication smoke test

The header `Sign Up` action now opens the registration form with full name, email, phone, address, password, and confirmation fields. The production modal no longer displays hardcoded demo account credentials. This also confirms that the header’s requested auth mode is now passed through to the modal correctly.
