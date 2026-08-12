# BM Food Updated Preview

## Preview URL

[Open the BM Food preview](https://3000-i9idh7dduywboew59nlx4-f3f3a7a6.us2.manus.computer)

## Verified live state

The preview title is **BM Food — Delivered Beautifully**. The local server was restarted on port 3000 and its `/api/health` endpoint returned HTTP 200. After the homepage’s asynchronous Firestore requests settled, the preview rendered live production-like content from project `bm-food-d04b1`: published banners, Today's Collection cards, categories, featured restaurants, and the full available-food menu.

The verified homepage displayed **80 live dishes**, active restaurant and category sections, the 15-food Today's Collection, offer banners, ratings, prices in Bangladeshi taka, and the editorial premium hero. No demo catalog is hard-coded into the customer UI; the empty and unavailable states are shown only while live reads are loading or when published data is absent.

> If the first page capture shows an empty state, wait for the Firestore requests to complete and refresh once. The subsequent verified page view populated the full catalog without a code or rules change.

## Live data evidence

The exact public homepage queries returned HTTP 200 from the live Firestore project:

| Query or document | Verified result |
| --- | --- |
| Active restaurants | 12 documents |
| Active categories | 12 documents |
| Available foods | 80 documents |
| Active banners | 3 documents |
| Visible reviews, homepage limit | 3 documents |
| `settings/general` | HTTP 200 |
| `homepageCollections/todays` | HTTP 200, active, 15 food IDs |

The repeatable check is included at `scripts/verify-public-homepage-queries.sh`.

## Visual and route checks

The browser preview rendered the responsive header, editorial hero, cursor-responsive food showcase, search, offer cards, Today's Collection, category explorer, featured restaurants, menu grid, customer notes, verified reviews, final CTA, footer, theme toggle, and cart affordance. The visible data uses the live Firestore documents rather than placeholder rows.

The project also includes protected direct routes for `/admin`, `/admin/analytics`, `/vendor`, `/rider`, `/checkout`, restaurants, order tracking, profile, and order history. The admin route remains protected until the signed-in account has both Firebase Authentication and an active `users/{uid}` profile.

## Validation completed

Strict TypeScript compilation, five order-math regression tests, the Vite production build, and the server bundle all passed. The PWA manifest, icon, and service-worker assets are included in the project. The live Firestore rules deny anonymous writes, and all five required composite indexes are Enabled in Firebase Console.

## Testing access

For administration, sign in with the bootstrapped Firebase Authentication account **`bornilmahmud56@gmail.com`**, then reload the page so the refreshed ID token can resolve its active admin profile. Use a separate customer account to test signup, cart, checkout, order history, and tracking. Restaurant and rider portals require profiles with the matching role and ownership fields; no role-switch shortcut or demo credential is provided.

## Environment notes

The preview host is temporary and depends on the sandbox server remaining active. For a durable public deployment, build the project and deploy `dist` through the Firebase Hosting commands documented in `FIREBASE-DEPLOYMENT.md`. Online gateway endpoints remain explicitly not configured until a real provider, webhook signature secret, and server-side credentials are supplied.
