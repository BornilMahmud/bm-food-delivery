# BM Food — Minimum-Order Policy Update

## Policy change

The checkout flow no longer rejects an order because the restaurant or general settings contain a `minimumOrder` value. Customers may place an order for any non-empty cart total that the checkout summary displays.

The payable amount remains calculated from the visible subtotal, any valid discount, tax, and configured delivery fee. The existing zero-subtotal guard remains in place because an empty cart cannot be ordered. Authentication, delivery details, payment-method validation, live food revalidation, duplicate-submit protection, and Firestore ownership rules remain unchanged.

Coupon thresholds are now explicitly non-blocking. If a coupon is below its optional eligibility amount, BM Food leaves the order placeable without consuming the coupon; the message says the coupon is unavailable for that basket but the order can still be placed without the discount.

## Validation

A focused regression test now covers a ৳45 basket with a ৳60 delivery fee and confirms the exact payable total is ৳105. The complete test suite passes with 6 tests, strict TypeScript passes, the Vite production build passes, and the server bundle passes. The live preview remains available at `https://3000-i9idh7dduywboew59nlx4-f3f3a7a6.us2.manus.computer/` with the redesigned dark storefront and live Firestore catalog visible.
