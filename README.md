# BM Food — Delivered Beautifully

BM Food is a premium food-delivery platform for Bangladesh built with React 19, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Cloud Firestore, Express, Lucide React, and Motion. The customer experience uses a warm editorial food-tech design system with Bangladeshi taka pricing, live catalog reads, food customization, cart and coupon logic, checkout validation, manual-payment support, order tracking, and role-aware operational portals.

## Live project and preview

The Firebase project is **`bm-food-d04b1`**. The temporary verified preview is available at:

[https://3000-i9idh7dduywboew59nlx4-f3f3a7a6.us2.manus.computer](https://3000-i9idh7dduywboew59nlx4-f3f3a7a6.us2.manus.computer)

The live database has been populated with 12 restaurants, 12 categories, 80 foods, 10 coupons, 5 payment methods, 12 reviews, 3 riders, 1 notification, and an active Today's Collection containing 15 food IDs. The bootstrapped administrator is `bornilmahmud56@gmail.com`.

## Local development

Use Node.js 20 or newer and a trusted package-manager environment:

```bash
pnpm install
pnpm dev
```

The Express/Vite server listens on port 3000. For a production build and local server bundle:

```bash
pnpm typecheck
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

The sandbox used the already-installed project binaries for the final type-check, test, Vite build, and server-bundle validation because its package policy blocked unapproved dependency build scripts during an automatic install. All four checks passed.

## Firebase operations

The canonical deployment and operations instructions are in [`FIREBASE-DEPLOYMENT.md`](FIREBASE-DEPLOYMENT.md). That guide covers Firebase CLI authentication, rules and index deployment, Hosting deployment, UID-based admin bootstrap, deterministic seeding, live query verification, and troubleshooting.

The production security rules are in [`firestore.rules`](firestore.rules), and the five canonical composite indexes are in [`firestore.indexes.json`](firestore.indexes.json). The public homepage query verifier is [`scripts/verify-public-homepage-queries.sh`](scripts/verify-public-homepage-queries.sh).

## Validation and audit

Read [`FINAL-AUDIT.md`](FINAL-AUDIT.md) for the master-requirements coverage and live acceptance record. [`UPDATED-PREVIEW.md`](UPDATED-PREVIEW.md) documents the verified preview behavior. [`REAL-FIREBASE-ACCESS.md`](REAL-FIREBASE-ACCESS.md) records the live Firestore, rules, index, and public-query verification history.

The automated test suite currently covers quantity clamping, coupon validity, percentage discounts, food-option validation, and order totals:

```bash
pnpm test
```

## Security boundary

Never commit Firebase Admin SDK keys, passwords, webhook secrets, or provider credentials. The browser uses only the Firebase client configuration in `src/lib/firebase.ts`. Admin access requires Firebase Authentication plus an active Firestore `users/{uid}` profile; an email address alone is never treated as authorization. Online gateway endpoints remain explicitly unavailable until a real provider and server-side webhook verification are configured.

## Archive contents

`bm-food-updated.zip` is the final source archive. It includes application source, Firebase metadata, production rules, indexes, seed/bootstrap scripts, public query verification, PWA assets, automated tests, and handoff documentation. It excludes `node_modules`, generated `dist`, and private credentials.
