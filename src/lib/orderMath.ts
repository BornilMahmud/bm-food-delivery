import { Coupon, Food, FoodOptionGroup, Order, OrderItem } from '../types';

export type SelectedFoodOption = NonNullable<OrderItem['selectedOptions']>[number];

export const clampQuantity = (quantity: number) => Math.max(0, Math.min(99, Math.trunc(Number.isFinite(quantity) ? quantity : 0)));

export const isCouponUsable = (coupon: Coupon, now = new Date()) => {
  const starts = coupon.startDate ? new Date(coupon.startDate) : null;
  const ends = coupon.endDate ? new Date(`${coupon.endDate}T23:59:59`) : null;
  const withinDates = (!starts || Number.isNaN(starts.getTime()) || now >= starts)
    && (!ends || Number.isNaN(ends.getTime()) || now <= ends);
  const withinUsage = coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit;
  return coupon.isActive && withinDates && withinUsage;
};

export const calculateDiscount = (subtotal: number, coupon: Coupon | null) => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (!coupon || safeSubtotal < Math.max(0, coupon.minimumOrder || 0) || !isCouponUsable(coupon)) return 0;
  if (coupon.discountType === 'fixed') return Math.min(safeSubtotal, Math.max(0, coupon.discountValue || 0));
  const percentageDiscount = safeSubtotal * Math.max(0, coupon.discountValue || 0) / 100;
  return Math.min(safeSubtotal, Math.max(0, coupon.maximumDiscount == null ? percentageDiscount : Math.min(percentageDiscount, Math.max(0, coupon.maximumDiscount))));
};

export const normalizeSelectedOptions = (food: Food, selections: SelectedFoodOption[] = []) => {
  const groups = food.options || [];
  const normalized: SelectedFoodOption[] = [];
  for (const selection of selections) {
    const group = groups.find((candidate: FoodOptionGroup) => candidate.id === selection.groupId);
    const choice = group?.choices.find((candidate) => candidate.id === selection.choiceId);
    if (!group || !choice) return null;
    if (group.type === 'single' && normalized.some((item) => item.groupId === group.id)) return null;
    normalized.push({ groupId: group.id, groupName: group.name, choiceId: choice.id, choiceLabel: choice.label, priceDelta: Math.max(0, Number(choice.priceDelta) || 0) });
  }
  if (groups.some((group) => group.required && !normalized.some((item) => item.groupId === group.id))) return null;
  return normalized;
};

export const calculateOptionDelta = (food: Food, selections: SelectedFoodOption[] = []) => {
  const normalized = normalizeSelectedOptions(food, selections);
  return normalized ? normalized.reduce((sum, selection) => sum + selection.priceDelta, 0) : null;
};

export const calculateOrderTotals = ({ subtotal, coupon, taxPercentage, deliveryFee }: { subtotal: number; coupon: Coupon | null; taxPercentage: number; deliveryFee: number }) => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const discount = calculateDiscount(safeSubtotal, coupon);
  const tax = Math.round(Math.max(0, safeSubtotal - discount) * Math.max(0, Number(taxPercentage) || 0) / 100);
  const safeDeliveryFee = safeSubtotal > 0 ? Math.max(0, Number(deliveryFee) || 0) : 0;
  return { subtotal: safeSubtotal, discount, tax, deliveryFee: safeDeliveryFee, total: Math.max(0, safeSubtotal - discount + tax + safeDeliveryFee) };
};

export const isCashOrder = (order: Pick<Order, 'paymentMethod'>) => {
  const method = String(order.paymentMethod || '').toLowerCase();
  return method.includes('cod') || method.includes('cash');
};

export const isRevenueRecognized = (order: Pick<Order, 'paymentMethod' | 'paymentStatus' | 'orderStatus'>) => (
  order.paymentStatus === 'paid' || (order.orderStatus === 'delivered' && isCashOrder(order))
);

export const recognizedRevenue = (orders: Array<Pick<Order, 'paymentMethod' | 'paymentStatus' | 'orderStatus' | 'total'>>) => orders.reduce((sum, order) => sum + (isRevenueRecognized(order) ? Number(order.total || 0) : 0), 0);

