Orders move between states in real time.

Optimize the UI for restaurant staff.

---

# 44. RIDER DASHBOARD

Show:

* assigned delivery
* pickup
* destination
* customer details
* order items
* status
* history
* earnings

Only assigned orders should be accessible.

---

# 45. RESPONSIVE

Test:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

No:

* horizontal overflow
* broken cards
* overlapping UI
* inaccessible buttons
* oversized modals
* broken 3D hero

The mobile interface must be intentionally designed.

---

# 46. PERFORMANCE

Optimize:

* Three.js assets
* food images
* Firestore listeners
* React renders
* lazy loading
* code splitting

Reduce 3D complexity on mobile.

---

# 47. PWA

Make the website installable as a PWA where practical.

Include:

* manifest
* icons
* installability
* app shell
* responsive mobile UX

---

# 48. TESTING

Run:

```bash
npm install
npm run typecheck
npm run build
```

and all available tests.

Then actually open and test the website.

Check browser console.

Check Firebase network requests.

Check authentication.

Check Firestore reads/writes.

---

# 49. NO FAKE SUCCESS

Never display:

"Order placed successfully"

unless the order was actually created.

Never display:

"Payment successful"

unless the payment status is actually valid.

Never display:

"Database connected"

unless a Firestore request actually succeeds.

---

# 50. FIREBASE DEPLOYMENT LIMITATION

If you have Firebase deployment access, deploy the corrected:

```text
firestore.rules
```

and required indexes/configuration.

If you do NOT have deployment access:

Do not pretend deployment succeeded.

Instead provide:

1. final `firestore.rules`
2. final Firestore indexes
3. final seed script
4. exact Firebase Console instructions
5. exact commands

Tell me precisely where to place/copy everything.

---

# 51. ADMIN USER SETUP

For:

```text
bornilmahmud56@gmail.com
```

do the following:

If the user exists:

```text
Authentication user
↓
Get UID
↓
users/{uid}
↓
role = admin
↓
isActive = true
```

If the user doesn't exist:

Provide exact instructions to create the Firebase Authentication account securely.

Never put a password in the repository.

The admin email must not be editable by a normal user through the frontend.

---

# 52. ADMIN SECURITY

Do not use:

```ts
if (email === "bornilmahmud56@gmail.com")
```

as the only authorization mechanism.

The UI may use the email for initial bootstrapping only if absolutely necessary, but actual authorization must come from:

```text
Firebase Authentication
+
Firestore role
+
Firestore Security Rules
```

---

# 53. FINAL ACCEPTANCE CHECKLIST

Do not declare the project finished until all of these are true.

## FIREBASE

* [ ] Firebase initializes
* [ ] Firestore connection works
* [ ] Data loads
* [ ] Data writes work
* [ ] Rules work
* [ ] Required indexes work
* [ ] No permission errors for valid users

## DATABASE

* [ ] Restaurants seeded
* [ ] Categories seeded
* [ ] Foods seeded
* [ ] Today's Collection seeded
* [ ] Coupons seeded
* [ ] Payment methods seeded
* [ ] Settings seeded

## ADMIN

* [ ] `/admin` exists
* [ ] Admin login works
* [ ] Bornil admin account works
* [ ] Dashboard statistics are real
* [ ] Food CRUD works
* [ ] Restaurant CRUD works
* [ ] Category CRUD works
* [ ] User management works
* [ ] Rider management works
* [ ] Order management works
* [ ] Payment verification works
* [ ] Coupon management works
* [ ] Review moderation works
* [ ] Banner management works
* [ ] Today's Collection management works
* [ ] Settings work
* [ ] Analytics work
* [ ] Audit logs work

## CUSTOMER

* [ ] Real foods load
* [ ] Real restaurants load
* [ ] Search works
* [ ] Cart works
* [ ] Checkout works
* [ ] Payment works
* [ ] Order creation works
* [ ] Tracking works
* [ ] Order history works

## 3D UI

* [ ] 3D landing hero works
* [ ] Today's Collection is dynamic
* [ ] Food showcase is interactive
* [ ] Animations are smooth
* [ ] Hover effects work
* [ ] Reduced motion works
* [ ] Mobile fallback works

## QUALITY

* [ ] TypeScript passes
* [ ] Production build passes
* [ ] No critical console errors
* [ ] No critical UI bugs
* [ ] No broken routes
* [ ] No permanent mock data
* [ ] No fake success messages
* [ ] Responsive across all target sizes

---

# FINAL OBJECTIVE

Transform BM Food into:

**A real, production-style food marketplace with:**

```text
Premium 3D Customer Experience
+
Real Firebase Firestore Database
+
Complete Admin Control Center
+
Restaurant Management
+
Kitchen Display
+
Rider Operations
+
Real Checkout
+
Manual Payment Management
+
Order Tracking
+
Analytics
+
Security
+
Responsive UI
```

The final result must feel like a **real startup product**, not a demo, static frontend, or university CRUD application.

MOST IMPORTANTLY:

When I open BM Food, I must immediately see **real food and restaurant data loaded from Firestore**.

When I log in using:

`bornilmahmud56@gmail.com`

I must be able to access:

`/admin`

and manage the complete BM Food platform.

When I add a food from Admin → Foods, it must appear on the customer website.

When I change a price in Admin, the customer website must show the updated price.

When I create a Today's Special item, it must appear in the 3D Today's Collection.

When a customer places an order, the order must appear in Admin and the relevant Restaurant/Rider dashboard.

Everything must be connected through the real application data flow.
