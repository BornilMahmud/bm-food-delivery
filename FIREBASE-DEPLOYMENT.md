# BM Food Firebase Deployment and Operations Guide

This repository targets the live Firebase project **`bm-food-d04b1`** and the default Firestore database in `nam5`. The production Firestore rules, deterministic catalog seed, administrator profile, and five required composite indexes have already been applied and verified for that project. The guide remains useful for repeatable deployment from a trusted machine, staging refreshes, and future releases.

> **Security boundary:** The Firebase Admin SDK private key used for the one-time seed and administrator bootstrap was removed from the sandbox after use. Never commit a service-account key, put it in `public/`, or expose it to browser code.

## 1. Repository and Firebase target

The repository contains `.firebaserc`, which maps the project alias to `bm-food-d04b1`, and `firebase.json`, which maps Firestore rules, Firestore indexes, and the `dist` directory used by Firebase Hosting.

| Resource | Repository source | Production purpose |
| --- | --- | --- |
| Firestore rules | `firestore.rules` | Role-aware access for customers, admins, restaurants, riders, orders, payments, reviews, addresses, rewards, payouts, audits, and notifications |
| Firestore indexes | `firestore.indexes.json` | Compound queries used by menus, reviews, orders, payments, and operations |
| Hosting | `firebase.json` and `dist/` | SPA hosting with an `index.html` fallback |
| Catalog seed | `scripts/seed-firestore.ts` | Deterministic upsert of published catalog and operations data |
| Administrator bootstrap | `scripts/bootstrap-admin.ts` | UID-based admin role and custom-claim setup |

## 2. Repeatable deployment from a trusted machine

Install the Firebase CLI and authenticate with an account that has permission to deploy this project. Run all commands from the repository root, where `firebase.json` is located.

```bash
npm install -g firebase-tools
firebase login
firebase use bm-food-d04b1

pnpm install
pnpm typecheck
pnpm test
pnpm build

firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

If the project is opened for the first time on a new machine, confirm the active project before deployment:

```bash
firebase projects:list
firebase use bm-food-d04b1
firebase firestore:indexes
```

The build must complete before `firebase deploy --only hosting`, because Firebase Hosting serves the generated `dist` directory. The client configuration in `src/lib/firebase.ts` must continue to use project ID `bm-food-d04b1`; no admin credentials belong in that file.

## 3. Exact composite indexes

The canonical `firestore.indexes.json` declares the following five collection-scope indexes. They were created in the Firebase Console and verified as **Enabled** for the live project.

| Collection | Fields and direction | Scope | Live status |
| --- | --- | --- | --- |
| `foods` | `restaurantId ASC`, `isAvailable ASC` | Collection | Enabled |
| `reviews` | `restaurantId ASC`, `createdAt DESC` | Collection | Enabled |
| `orders` | `userId ASC`, `createdAt DESC` | Collection | Enabled |
| `orders` | `restaurantId ASC`, `orderStatus ASC`, `createdAt DESC` | Collection | Enabled |
| `payments` | `orderId ASC`, `status ASC` | Collection | Enabled |

A fresh deployment should use the repository declaration instead of manually recreating these indexes. Index construction can remain in `Building` state for several minutes; verify the Firebase Console shows `Enabled` before treating the release as complete.

## 4. Administrator bootstrap

The production administrator is the Firebase Authentication account **`bornilmahmud56@gmail.com`**. The bootstrap script resolves that account’s UID through the Admin SDK rather than trusting an email in frontend authorization logic. It sets the custom admin claim and upserts the corresponding Firestore profile with `role: "admin"`, `status: "active"`, and `isActive: true`.

Create or confirm the Authentication user in **Firebase Console → Authentication → Users**. Then use a service-account file stored outside the repository:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/secure/bm-food-d04b1-service-account.json"
export FIREBASE_PROJECT_ID="bm-food-d04b1"
export ADMIN_EMAIL="bornilmahmud56@gmail.com"
pnpm run bootstrap-admin
```

The script stops if the Authentication user does not exist. Do not place a password in source, scripts, environment files committed to Git, or delivery archives. After the command completes, sign out and back in to refresh the browser’s ID token before opening `/admin`.

## 5. Deterministic catalog seed

The seed is an idempotent upsert. It writes published records into `restaurants`, `categories`, `foods`, `banners`, `reviews`, `coupons`, `paymentMethods`, `riders`, `notifications`, and `settings/general`, and writes the live `homepageCollections/todays` document. Run it only with the service-account credential exported in the current shell:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/secure/bm-food-d04b1-service-account.json"
export FIREBASE_PROJECT_ID="bm-food-d04b1"
pnpm run seed
```

The verified production-like data set contains **12 restaurants, 12 categories, 80 foods, 10 coupons, 5 payment methods, 12 reviews, 3 riders, 1 notification, and 1 active Today's Collection with 15 food IDs**. The seed does not create passwords or weaken Firestore rules.

## 6. Live verification checklist

The application’s public homepage reads active restaurants, active categories, available foods, active banners, visible reviews, and `homepageCollections/todays`. The following REST checks can be performed without an admin key and should return HTTP 200 for a correctly deployed public catalog:

```bash
BASE='https://firestore.googleapis.com/v1/projects/bm-food-d04b1/databases/(default)/documents'
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/settings/general"
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE/homepageCollections/todays"
```

For the complete exact-query check, run `scripts/verify-public-homepage-queries.sh`. It verifies the public query contracts and reports the returned document counts. The live validation recorded 12 restaurants, 12 categories, 80 foods, 3 banners, and 3 visible reviews from those queries.

Then test the main journeys with a real customer account and the bootstrapped administrator:

```text
Homepage → Today's Collection → Food detail → Options → Cart → Coupon → Checkout → Payment → Order → Tracking → History
Admin → Foods → edit availability/price → customer homepage
Admin → Today's Collection → select food → customer homepage
Admin → Orders → manual payment review → assign rider
Restaurant portal → kitchen order lane → allowed status update
Rider portal → assigned order → pickup/delivery status update
```

COD and manual payment flows are intentionally explicit. The online gateway endpoints return a not-configured response until a real provider, webhook signature verification, and server-side credentials are installed. The application never displays a fabricated payment or order success state.

## 7. Security and incident checks

The deployed rules keep public reads limited to published catalog content and permit writes only through authenticated, role-appropriate paths. Admin access requires both Firebase Authentication and an active `users/{uid}` role profile; the administrator email is not a privilege shortcut. Restaurant and rider operations are scoped to the authenticated profile and assigned orders. Payments, audit logs, notifications, payouts, and user-management writes remain admin-controlled.

If the homepage is empty or shows a live-catalog error, check the following in order:

1. Confirm the browser configuration points to `bm-food-d04b1`.
2. Confirm `settings/general` and `homepageCollections/todays` return HTTP 200.
3. Run `scripts/verify-public-homepage-queries.sh` and inspect the counts.
4. Confirm the five indexes are `Enabled`, not `Building` or `Error`.
5. Confirm the seed completed and published records contain the expected fields: `status`, `isActive`, `isAvailable`, and `isVisible`.
6. Confirm an administrator has both a Firebase Authentication account and an active `users/{uid}` profile.
7. Unregister an expired service worker in browser DevTools and reload once if an older client bundle is cached.

The production rules should not be replaced with `allow read, write: if true`. If a maintenance operation is ever required, use a short, audited migration with the Admin SDK and restore the production rules immediately.

## 8. Official references

[1]: https://firebase.google.com/docs/cli Firebase CLI documentation.
[2]: https://firebase.google.com/docs/firestore/security/get-started Firestore Security Rules documentation.
[3]: https://firebase.google.com/docs/firestore/query-data/indexing Firestore index management documentation.
[4]: https://firebase.google.com/docs/hosting Firebase Hosting documentation.
