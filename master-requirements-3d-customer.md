# 32. BUILD THE 3D LANDING PAGE

The new homepage MUST start with a premium:

# TODAY'S COLLECTION — 3D FOOD SHOWCASE

This is the signature feature of the website.

Use:

* Three.js
* React Three Fiber
* Drei
* Motion
* CSS 3D

Use real food data from Firestore.

---

# 33. 3D HERO CONCEPT

The hero should feel like a high-end food advertising campaign.

Example layout:

```text
TODAY'S COLLECTION

        [REALISTIC 3D FOOD]

   SPECIAL BURGER COLLECTION

     Double Cheese Smash

         ৳390

       4.9 ★

      ORDER NOW
```

Include:

* floating food elements
* ingredient particles
* subtle depth
* dynamic lighting
* soft shadows
* camera movement
* mouse interaction
* scroll motion

Do not make it chaotic.

---

# 34. 3D FOOD INTERACTION

Mouse:

* subtle rotation
* parallax
* depth movement

Scroll:

* camera movement
* food transition
* section reveal

Hover:

* subtle elevation
* light response
* product details

Respect:

`prefers-reduced-motion`

---

# 35. TODAY'S COLLECTION CAROUSEL

Under the hero:

Show real Today's Collection foods.

Each card:

* image
* title
* restaurant
* rating
* price
* discount
* CTA

Clicking an item must navigate to the actual food detail page.

---

# 36. LANDING PAGE STRUCTURE

Use:

```text
Navbar
↓
3D Today's Collection Hero
↓
Today's Special
↓
Trending Foods
↓
Explore Categories
↓
Featured Restaurants
↓
Best Sellers
↓
Offers
↓
How BM Food Works
↓
Reviews
↓
Final CTA
↓
Footer
```

Every item must be dynamic.

---

# 37. UI REPAIR

Audit all current UI.

Fix:

* hover bugs
* button animation bugs
* incorrect transforms
* broken z-index
* overflow
* image scaling
* card shifting
* inconsistent spacing
* typography
* broken responsive grids
* modal positioning
* dropdown positioning
* mobile navigation
* sticky headers
* loading states
* empty states

Hover animations must not cause layout shifts.

---

# 38. DESIGN SYSTEM

Create a consistent BM Food design system.

Use:

### Colors

* warm cream
* soft white
* charcoal
* deep black
* subtle green
* warm food-orange accents

### Typography

Modern, premium, readable.

### Components

* buttons
* inputs
* food cards
* restaurant cards
* badges
* modal
* drawer
* tabs
* tables
* status indicators

Use consistent spacing and behavior.

---

# 39. CUSTOMER EXPERIENCE

Fully test:

```text
Register
↓
Login
↓
Browse
↓
Restaurant
↓
Food
↓
Customize
↓
Cart
↓
Coupon
↓
Checkout
↓
Payment
↓
Order
↓
Tracking
↓
History
```

Every step must work with Firestore.

---

# 40. CHECKOUT

Do not trust client totals.

Recalculate:

* food price
* quantity
* customization
* discount
* coupon
* delivery fee
* tax
* final total

Prevent duplicate orders.

Clear the cart only after successful order creation.

---

# 41. ORDER TRACKING

Use real Firestore data.

Timeline:

```text
Order Placed
↓
Confirmed
↓
Preparing
↓
Ready
↓
Picked Up
↓
Delivering
↓
Delivered
```

Display rider information when applicable.

---

# 42. RESTAURANT DASHBOARD

Create a proper restaurant portal.

Show:

* overview
* live orders
* menu
* categories
* sales
* restaurant profile
* operating hours

Restaurant users can manage only their own data.

---

# 43. KITCHEN DISPLAY SYSTEM

Add:

# Kitchen Display

Columns:

```text
NEW
PREPARING
READY
COMPLETED
```

