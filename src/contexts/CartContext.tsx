import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Food, OrderItem, Coupon, Restaurant, SystemSettings } from '../types';
import { db } from '../lib/firebase';
import { calculateOptionDelta, calculateOrderTotals, clampQuantity, isCouponUsable, normalizeSelectedOptions, SelectedFoodOption } from '../lib/orderMath';

interface CartContextType {
  items: OrderItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  coupon: Coupon | null;
  couponCodeInput: string;
  couponError: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  taxPercentage: number;
  total: number;
  addItem: (food: Food, restaurantName?: string, notes?: string, selectedOptions?: SelectedFoodOption[]) => boolean;
  removeItem: (foodId: string, selectedOptions?: SelectedFoodOption[]) => void;
  updateQuantity: (foodId: string, delta: number, selectedOptions?: SelectedFoodOption[]) => void;
  clearCart: () => void;
  applyCoupon: (code: string, availableCoupons: Coupon[]) => boolean;
  removeCoupon: () => void;
  setCouponCodeInput: (code: string) => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'bm_food_cart_v1';
const DEFAULT_TAX_PERCENTAGE = 5;
const DEFAULT_DELIVERY_FEE = 50;

interface PersistedCart {
  items?: OrderItem[];
  restaurantId?: string | null;
  restaurantName?: string | null;
}

const readPersistedCart = (): PersistedCart => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) as PersistedCart : {};
  } catch {
    return {};
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = readPersistedCart();
  const [items, setItems] = useState<OrderItem[]>(() => Array.isArray(persisted.items) ? persisted.items : []);
  const [restaurantId, setRestaurantId] = useState<string | null>(() => persisted.restaurantId || null);
  const [restaurantName, setRestaurantName] = useState<string | null>(() => persisted.restaurantName || null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [taxPercentage, setTaxPercentage] = useState(DEFAULT_TAX_PERCENTAGE);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ items, restaurantId, restaurantName }),
      );
    } catch (error) {
      console.error('Failed to persist cart:', error);
    }
  }, [items, restaurantId, restaurantName]);

  useEffect(() => {
    let active = true;
    const loadPricing = async () => {
      if (!restaurantId) {
        setRestaurant(null);
        return;
      }
      try {
        const [settingsSnap, restaurantSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'restaurants', restaurantId)),
        ]);
        if (!active) return;
        const settings = settingsSnap.exists() ? settingsSnap.data() as Partial<SystemSettings> : {};
        setTaxPercentage(Number.isFinite(Number(settings.taxPercentage)) ? Math.max(0, Number(settings.taxPercentage)) : DEFAULT_TAX_PERCENTAGE);
        setDefaultDeliveryFee(Number.isFinite(Number(settings.defaultDeliveryFee)) ? Math.max(0, Number(settings.defaultDeliveryFee)) : DEFAULT_DELIVERY_FEE);
        setRestaurant(restaurantSnap.exists() ? restaurantSnap.data() as Restaurant : null);
      } catch (error) {
        console.error('Unable to load current cart pricing:', error);
        if (active) {
          setRestaurant(null);
          setTaxPercentage(DEFAULT_TAX_PERCENTAGE);
          setDefaultDeliveryFee(DEFAULT_DELIVERY_FEE);
        }
      }
    };
    loadPricing();
    return () => { active = false; };
  }, [restaurantId]);

  const addItem = (food: Food, restName?: string, notes?: string, selectedOptions: SelectedFoodOption[] = []): boolean => {
    if (!food.isAvailable) {
      window.alert('Sorry, this dish is currently out of stock.');
      return false;
    }

    if (restaurantId && restaurantId !== food.restaurantId) {
      const confirmChange = window.confirm(
        `Your cart contains items from another restaurant. Would you like to clear your cart and start a new order from ${restName || 'this restaurant'}?`,
      );
      if (!confirmChange) return false;
      setItems([]);
      setCoupon(null);
      setCouponCodeInput('');
      setCouponError(null);
    }

    setRestaurantId(food.restaurantId);
    if (restName) setRestaurantName(restName);

    const normalizedOptions = normalizeSelectedOptions(food, selectedOptions);
    if (normalizedOptions === null) {
      window.alert('Please complete the required food options before adding this dish.');
      return false;
    }
    const optionDelta = calculateOptionDelta(food, normalizedOptions) || 0;
    const effectivePrice = Math.max(0, Number(food.discountPrice ?? food.price)) + optionDelta;
    setItems((previous) => {
      const existing = previous.find((item) => item.foodId === food.id && JSON.stringify(item.selectedOptions || []) === JSON.stringify(normalizedOptions));
      if (existing) {
        return previous.map((item) => item.foodId === food.id && JSON.stringify(item.selectedOptions || []) === JSON.stringify(normalizedOptions)
          ? {
              ...item,
              quantity: clampQuantity(item.quantity + 1),
              ...(notes?.trim() ? { notes: notes.trim() } : {}),
            }
          : item);
      }
      return [...previous, {
        foodId: food.id,
        foodName: food.name,
        price: effectivePrice,
        quantity: 1,
        imageUrl: food.imageUrl,
        ...(normalizedOptions.length ? { selectedOptions: normalizedOptions } : {}),
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
      }];
    });
    return true;
  };

  const removeItem = (foodId: string, selectedOptions?: SelectedFoodOption[]) => {
    const optionKey = JSON.stringify(selectedOptions || []);
    setItems((previous) => {
      const next = previous.filter((item) => !(item.foodId === foodId && JSON.stringify(item.selectedOptions || []) === optionKey));
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
        setCoupon(null);
        setCouponCodeInput('');
      }
      return next;
    });
  };

  const updateQuantity = (foodId: string, delta: number, selectedOptions?: SelectedFoodOption[]) => {
    if (!Number.isInteger(delta) || delta === 0) return;
    const optionKey = JSON.stringify(selectedOptions || []);
    setItems((previous) => {
      const next = previous
        .map((item) => {
          if (item.foodId !== foodId || JSON.stringify(item.selectedOptions || []) !== optionKey) return item;
          const quantity = clampQuantity(item.quantity + delta);
          return quantity > 0 ? { ...item, quantity } : null;
        })
        .filter((item): item is OrderItem => item !== null);

      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
        setCoupon(null);
        setCouponCodeInput('');
      }
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    setCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const subtotal = Math.max(0, items.reduce((sum, item) => sum + Math.max(0, item.price) * clampQuantity(item.quantity), 0));
  const calculated = calculateOrderTotals({
    subtotal,
    coupon,
    taxPercentage,
    deliveryFee: items.length > 0 ? Math.max(0, Number(restaurant?.deliveryFee ?? defaultDeliveryFee)) : 0,
  });
  const discount = calculated.discount;
  const tax = calculated.tax;
  const deliveryFee = calculated.deliveryFee;
  const total = calculated.total;

  const applyCoupon = (code: string, availableCoupons: Coupon[]): boolean => {
    setCouponError(null);
    const normalized = code.trim().toUpperCase();
    const found = availableCoupons.find((candidate) => candidate.code.trim().toUpperCase() === normalized && isCouponUsable(candidate));

    if (!found) {
      setCouponError('Invalid, expired, or exhausted coupon code.');
      return false;
    }
    if (subtotal < found.minimumOrder) {
      setCouponError(`Coupon ${found.code} applies from ৳${found.minimumOrder}, but you can still place this order without the discount.`);
      return false;
    }
    setCoupon(found);
    setCouponCodeInput(found.code);
    return true;
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      restaurantId,
      restaurantName,
      coupon,
      couponCodeInput,
      couponError,
      subtotal,
      discount,
      tax,
      deliveryFee,
      taxPercentage,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
      setCouponCodeInput,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
