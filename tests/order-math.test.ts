import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount, calculateOptionDelta, calculateOrderTotals, clampQuantity, isCouponUsable, isCashOrder, isRevenueRecognized, recognizedRevenue } from '../src/lib/orderMath';
import { Coupon } from '../src/types';

const validCoupon: Coupon = {
  id: 'test',
  code: 'SAVE10',
  discountType: 'percentage',
  discountValue: 10,
  minimumOrder: 100,
  maximumDiscount: 50,
  usageLimit: 10,
  usedCount: 2,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  isActive: true,
};

test('clampQuantity prevents invalid and excessive quantities', () => {
  assert.equal(clampQuantity(-4), 0);
  assert.equal(clampQuantity(2.9), 2);
  assert.equal(clampQuantity(1000), 99);
});

test('coupon validity rejects inactive and exhausted coupons', () => {
  assert.equal(isCouponUsable(validCoupon, new Date('2026-08-12')), true);
  assert.equal(isCouponUsable({ ...validCoupon, isActive: false }, new Date('2026-08-12')), false);
  assert.equal(isCouponUsable({ ...validCoupon, usedCount: 10 }, new Date('2026-08-12')), false);
  assert.equal(isCouponUsable({ ...validCoupon, endDate: '2026-08-01' }, new Date('2026-08-12')), false);
});

test('percentage discount respects maximum discount and minimum order', () => {
  assert.equal(calculateDiscount(400, validCoupon), 40);
  assert.equal(calculateDiscount(1000, validCoupon), 50);
  assert.equal(calculateDiscount(99, validCoupon), 0);
});

test('food option pricing accepts only choices defined by the live food record', () => {
  const food = {
    id: 'pizza', name: 'Pizza', slug: 'pizza', description: '', price: 300, discountPrice: null, imageUrl: '', categoryId: 'cat', restaurantId: 'rest', rating: 5, reviewCount: 0, preparationTime: 15, isAvailable: true, isFeatured: false, tags: [],
    options: [{ id: 'size', name: 'Size', type: 'single' as const, required: true, choices: [{ id: 'regular', label: 'Regular', priceDelta: 0 }, { id: 'large', label: 'Large', priceDelta: 50 }] }],
  };
  assert.equal(calculateOptionDelta(food, [{ groupId: 'size', groupName: 'Size', choiceId: 'large', choiceLabel: 'Large', priceDelta: 50 }]), 50);
  assert.equal(calculateOptionDelta(food, []), null);
  assert.equal(calculateOptionDelta(food, [{ groupId: 'size', groupName: 'Size', choiceId: 'unknown', choiceLabel: 'Unknown', priceDelta: 999 }]), null);
});

test('order totals never go negative and include tax and delivery fee', () => {
  assert.deepEqual(calculateOrderTotals({ subtotal: 400, coupon: validCoupon, taxPercentage: 5, deliveryFee: 60 }), {
    subtotal: 400,
    discount: 40,
    tax: 18,
    deliveryFee: 60,
    total: 438,
  });
  assert.equal(calculateOrderTotals({ subtotal: 0, coupon: null, taxPercentage: 5, deliveryFee: 60 }).total, 0);
});

test('low-value baskets remain orderable at the displayed payable total', () => {
  assert.deepEqual(calculateOrderTotals({ subtotal: 45, coupon: null, taxPercentage: 0, deliveryFee: 60 }), {
    subtotal: 45,
    discount: 0,
    tax: 0,
    deliveryFee: 60,
    total: 105,
  });
});

test('delivered cash orders are recognized as collected overview revenue', () => {
  const deliveredCod = { paymentMethod: 'Cash on Delivery', paymentStatus: 'pending' as const, orderStatus: 'delivered' as const, total: 501 };
  const pendingCod = { paymentMethod: 'COD', paymentStatus: 'pending' as const, orderStatus: 'pending' as const, total: 240 };
  const rejectedDigital = { paymentMethod: 'bKash Manual', paymentStatus: 'rejected' as const, orderStatus: 'delivered' as const, total: 320 };
  assert.equal(isCashOrder(deliveredCod), true);
  assert.equal(isRevenueRecognized(deliveredCod), true);
  assert.equal(isRevenueRecognized(pendingCod), false);
  assert.equal(isRevenueRecognized(rejectedDigital), false);
  assert.equal(recognizedRevenue([deliveredCod, pendingCod, rejectedDigital]), 501);
});
