import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Food, PaymentMethodConfig, PaymentStatus } from '../types';
import { calculateOptionDelta, normalizeSelectedOptions } from '../lib/orderMath';
import { MapPin, CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderPlaced: (orderId: string, estimatedDeliveryMinutes?: number) => void;
  onOpenAuthModal: () => void;
}

const normalizeTransactionId = (value: string) => value.trim().toUpperCase();

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToCart,
  onOrderPlaced,
  onOpenAuthModal,
}) => {
  const {
    items,
    restaurantId,
    restaurantName,
    subtotal,
    discount,
    tax,
    deliveryFee,
    total,
    clearCart,
    coupon,
    taxPercentage,
  } = useCart();
  const { currentUser, userProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.addresses?.[0]?.address || '');
  const [city, setCity] = useState(userProfile?.addresses?.[0]?.city || 'Dhaka');
  const [area, setArea] = useState(userProfile?.addresses?.[0]?.area || '');
  const [notes, setNotes] = useState('');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [loading, setLoading] = useState(false);
  const submitLock = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadPaymentMethods = async () => {
      setPaymentMethodsLoading(true);
      try {
        const snapshot = await getDocs(query(collection(db, 'paymentMethods'), where('isEnabled', '==', true)));
        if (!active) return;
        const methods = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() } as PaymentMethodConfig))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setPaymentMethods(methods);
        setSelectedMethodId((previous) => methods.some((method) => method.id === previous)
          ? previous
          : methods[0]?.id || '');
        setPaymentMethodsError(methods.length ? null : 'No payment methods are currently available.');
      } catch (loadError) {
        console.error('Unable to load payment methods:', loadError);
        if (active) {
          setPaymentMethods([]);
          setPaymentMethodsError('Payment methods are temporarily unavailable. Please try again later.');
        }
      } finally {
        if (active) setPaymentMethodsLoading(false);
      }
    };
    loadPaymentMethods();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const defaultAddress = userProfile.addresses?.find((item) => item.isDefault) || userProfile.addresses?.[0];
    setName((previous) => previous || userProfile.name);
    setPhone((previous) => previous || userProfile.phone);
    if (defaultAddress) {
      setAddress((previous) => previous || defaultAddress.address);
      setCity((previous) => previous || defaultAddress.city);
      setArea((previous) => previous || defaultAddress.area);
    }
  }, [userProfile]);

  const selectedPM = paymentMethods.find((method) => method.id === selectedMethodId);

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Please sign in before placing an order.');
      onOpenAuthModal();
      return;
    }
    if (!restaurantId || items.length === 0) {
      setError('Your cart is empty or no restaurant is selected.');
      return;
    }
    if (!selectedPM) {
      setError('Please select an available payment method.');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !area.trim()) {
      setError('Please complete the recipient name, phone, full address, city, and area.');
      return;
    }
    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (selectedPM.type === 'manual' && !/^[A-Z0-9-]{6,32}$/.test(normalizeTransactionId(transactionId))) {
      setError(`Please enter a valid transaction ID for ${selectedPM.name}.`);
      return;
    }
    if (selectedPM.type === 'gateway') {
      setError('Online gateway checkout is not configured yet. Please choose Cash on Delivery or a verified manual method.');
      return;
    }

    if (submitLock.current) return;
    submitLock.current = true;
    setLoading(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      const paymentRef = doc(collection(db, 'payments'));
      const normalizedItems = items.map((item) => ({
        ...item,
        foodId: item.foodId,
        quantity: Number(item.quantity),
      }));
      let estimatedDeliveryMinutes = 35;

      await runTransaction(db, async (transaction) => {
        const settingsRef = doc(db, 'settings', 'general');
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        const paymentMethodRef = doc(db, 'paymentMethods', selectedPM.id);
        const settingsSnap = await transaction.get(settingsRef);
        const restaurantSnap = await transaction.get(restaurantRef);
        const paymentMethodSnap = await transaction.get(paymentMethodRef);
        const foodSnaps = [];
        for (const item of normalizedItems) {
          foodSnaps.push(await transaction.get(doc(db, 'foods', item.foodId)));
        }

        if (!restaurantSnap.exists()) throw new Error('The selected restaurant is no longer available.');
        const restaurant = restaurantSnap.data() as Record<string, unknown>;
        if (restaurant.status !== 'active' || restaurant.isOpen === false) {
          throw new Error('The selected restaurant is currently closed.');
        }
        if (!paymentMethodSnap.exists()) throw new Error('The selected payment method is no longer available.');
        const currentPaymentMethod = paymentMethodSnap.data() as PaymentMethodConfig;
        if (!currentPaymentMethod.isEnabled || currentPaymentMethod.type !== selectedPM.type) {
          throw new Error('The selected payment method was disabled. Please choose another method.');
        }

        const settings = settingsSnap.exists() ? settingsSnap.data() as Record<string, unknown> : {};
        const foodById = new Map<string, Record<string, unknown>>();
        foodSnaps.forEach((snapshot) => {
          if (snapshot.exists()) foodById.set(snapshot.id, snapshot.data() as Record<string, unknown>);
        });
        const seenIds = new Set<string>();
        const verifiedItems = normalizedItems.map((item) => {
          if (seenIds.has(item.foodId)) throw new Error('Duplicate items were found in the cart. Please refresh and try again.');
          seenIds.add(item.foodId);
          if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
            throw new Error('One or more item quantities are invalid.');
          }
          const food = foodById.get(item.foodId);
          if (!food || food.restaurantId !== restaurantId || food.isAvailable === false) {
            throw new Error('One or more selected dishes are no longer available.');
          }
          const foodModel = { id: item.foodId, ...food } as unknown as Food;
          const normalizedOptions = normalizeSelectedOptions(foodModel, item.selectedOptions || []);
          if (normalizedOptions === null) throw new Error(`The customization for ${String(food.name || item.foodName)} is no longer valid.`);
          const optionDelta = calculateOptionDelta(foodModel, normalizedOptions) || 0;
          const price = Number(food.discountPrice ?? food.price) + optionDelta;
          if (!Number.isFinite(price) || price < 0) throw new Error('A dish has an invalid price.');
          return {
            foodId: item.foodId,
            foodName: String(food.name || item.foodName),
            price,
            quantity: item.quantity,
            imageUrl: String(food.imageUrl || item.imageUrl || ''),
            ...(normalizedOptions.length ? { selectedOptions: normalizedOptions } : {}),
            ...(item.notes ? { notes: item.notes } : {}),
          };
        });

        const verifiedSubtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let verifiedDiscount = 0;
        if (coupon) {
          const couponRef = doc(db, 'coupons', coupon.id);
          const couponSnap = await transaction.get(couponRef);
          if (!couponSnap.exists()) throw new Error('The selected coupon is no longer available.');
          const currentCoupon = couponSnap.data() as Record<string, unknown>;
          const now = new Date();
          const starts = currentCoupon.startDate ? new Date(String(currentCoupon.startDate)) : null;
          const ends = currentCoupon.endDate ? new Date(`${String(currentCoupon.endDate)}T23:59:59`) : null;
          const usedCount = Number(currentCoupon.usedCount || 0);
          const usageLimit = currentCoupon.usageLimit == null ? null : Number(currentCoupon.usageLimit);
          if (currentCoupon.isActive !== true || (starts && !Number.isNaN(starts.getTime()) && now < starts)
            || (ends && !Number.isNaN(ends.getTime()) && now > ends)
            || (usageLimit != null && usedCount >= usageLimit)
            || String(currentCoupon.code).toUpperCase() !== coupon.code.toUpperCase()) {
            throw new Error('The selected coupon is invalid, expired, or exhausted.');
          }
          const minimumOrder = Math.max(0, Number(currentCoupon.minimumOrder || 0));
          if (verifiedSubtotal >= minimumOrder) {
            if (currentCoupon.discountType === 'fixed') {
              verifiedDiscount = Math.min(verifiedSubtotal, Math.max(0, Number(currentCoupon.discountValue || 0)));
            } else {
              verifiedDiscount = Math.min(verifiedSubtotal, verifiedSubtotal * Math.max(0, Number(currentCoupon.discountValue || 0)) / 100);
              if (currentCoupon.maximumDiscount != null) verifiedDiscount = Math.min(verifiedDiscount, Math.max(0, Number(currentCoupon.maximumDiscount)));
            }
            transaction.update(couponRef, { usedCount: usedCount + 1, updatedAt: serverTimestamp() });
          }
        }

        const verifiedTaxPercentage = Math.max(0, Number(settings.taxPercentage ?? taxPercentage));
        const verifiedTax = Math.round(Math.max(0, verifiedSubtotal - verifiedDiscount) * verifiedTaxPercentage / 100);
        const verifiedDeliveryFee = Math.max(0, Number(restaurant.deliveryFee ?? settings.defaultDeliveryFee ?? deliveryFee));
        const verifiedTotal = Math.max(0, verifiedSubtotal - verifiedDiscount + verifiedTax + verifiedDeliveryFee);
        estimatedDeliveryMinutes = Math.max(5, Number(restaurant.estimatedDeliveryTime ?? settings.defaultEstimatedDeliveryMinutes ?? 35));
        const paymentStatus: PaymentStatus = currentPaymentMethod.type === 'manual' ? 'manual_pending' : 'pending';
        const verifiedTransactionId = currentPaymentMethod.type === 'manual' ? normalizeTransactionId(transactionId) : undefined;
        const orderData = {
          userId: currentUser.uid,
          userName: name.trim(),
          userEmail: currentUser.email || '',
          userPhone: phone.trim(),
          restaurantId,
          restaurantName: String(restaurant.name || restaurantName || 'BM Food Partner Kitchen'),
          items: verifiedItems,
          subtotal: verifiedSubtotal,
          deliveryFee: verifiedDeliveryFee,
          discount: verifiedDiscount,
          tax: verifiedTax,
          total: verifiedTotal,
          estimatedDeliveryMinutes,
          deliveryAddress: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            area: area.trim(),
          },
          paymentMethod: String(currentPaymentMethod.name || selectedPM.name),
          paymentId: paymentRef.id,
          paymentStatus,
          orderStatus: 'pending',
          riderId: null,
          ...(verifiedTransactionId ? { transactionId: verifiedTransactionId } : {}),
          notes: notes.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const paymentData = {
          orderId: orderRef.id,
          userId: currentUser.uid,
          amount: verifiedTotal,
          methodId: selectedPM.id,
          methodName: String(currentPaymentMethod.name || selectedPM.name),
          status: paymentStatus,
          ...(verifiedTransactionId ? { transactionId: verifiedTransactionId } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        transaction.set(orderRef, orderData);
        transaction.set(paymentRef, paymentData);
      });

      clearCart();
      onOrderPlaced(orderRef.id, estimatedDeliveryMinutes);
    } catch (orderError: any) {
      console.error('Order creation error:', orderError);
      setError(orderError?.message || 'Failed to create the order. Please try again.');
    } finally {
      submitLock.current = false;
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-neutral-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-800">Your Basket is Empty</h2>
        <p className="text-xs text-neutral-500">Add dishes to your cart before proceeding to checkout.</p>
        <button onClick={onBackToCart} className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-xs">
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="bm-shell min-h-[calc(100vh-72px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBackToCart} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full" aria-label="Back to cart">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">Checkout Order</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Ordering from: <strong className="text-orange-600">{restaurantName || 'Selected restaurant'}</strong></p>
        </div>
      </div>

      {!currentUser && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-600" /><span>Sign in is required before an order can be placed.</span></div>
          <button onClick={onOpenAuthModal} className="px-4 py-1.5 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700">Log In / Sign Up</button>
        </div>
      )}
      {error && <div role="alert" aria-live="polite" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2 font-bold"><AlertCircle className="w-5 h-5" /><span>{error}</span></div>}

      <form noValidate onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-orange-600" />1. Delivery Location & Recipient</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="block font-bold text-neutral-700">Recipient Name *<input type="text" required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
              <label className="block font-bold text-neutral-700">Phone Number *<input type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
              <label className="sm:col-span-2 block font-bold text-neutral-700">Full Street Address *<input type="text" required value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
              <label className="block font-bold text-neutral-700">City *<input type="text" required value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
              <label className="block font-bold text-neutral-700">Area / Suburb *<input type="text" required value={area} onChange={(event) => setArea(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
              <label className="sm:col-span-2 block font-bold text-neutral-700">Special Delivery Instructions<input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden" /></label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-600" />2. Choose Payment Method</h2>
            {paymentMethodsLoading ? <p className="text-xs text-neutral-500">Loading payment methods...</p> : null}
            {paymentMethodsError ? <p className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">{paymentMethodsError}</p> : null}
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                return (
                  <div key={method.id} onClick={() => setSelectedMethodId(method.id)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${isSelected ? 'border-[var(--bm-ember)] bg-[var(--bm-ember)]/10' : 'border-[var(--bm-line)] hover:border-[var(--bm-ember)]/50 bg-[var(--bm-paper-strong)]'}`}>
                    <input type="radio" name="payment" checked={isSelected} onChange={() => setSelectedMethodId(method.id)} className="mt-1 text-orange-600 focus:ring-orange-500" />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2"><span className="font-bold text-neutral-900 text-sm">{method.name}</span><span className="bg-neutral-100 text-neutral-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{method.type === 'manual' ? 'Manual Verification' : method.type === 'cod' ? 'Cash On Delivery' : 'Gateway'}</span></div>
                      <p className="text-neutral-500 mt-1">{method.instructions}</p>
                      {isSelected && method.type === 'manual' && <div className="mt-3 p-3 bg-white border border-orange-200 rounded-xl space-y-2"><p className="text-orange-900 font-bold">Send ৳{total} to Account: <span className="text-red-600 font-black">{method.accountNumber || 'Configured account'}</span></p><label className="block text-[11px] font-bold text-neutral-700">Transaction ID *<input type="text" required value={transactionId} onChange={(event) => setTransactionId(event.target.value.toUpperCase())} className="mt-1 w-full p-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg uppercase font-bold text-neutral-900" /></label></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4 sticky top-24">
            <h2 className="text-base font-bold text-neutral-900">Order Items Summary</h2>
            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1 space-y-2">{items.map((item) => <div key={item.foodId} className="pt-2 flex items-center justify-between text-xs"><div><p className="font-bold text-neutral-900">{item.foodName}</p><p className="text-neutral-400">Qty: {item.quantity} × ৳{item.price}</p></div><p className="font-black text-neutral-900">৳{item.price * item.quantity}</p></div>)}</div>
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-600"><div className="flex justify-between"><span>Items Subtotal</span><span>৳{subtotal}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Coupon Discount ({coupon?.code})</span><span>-৳{discount}</span></div>}<div className="flex justify-between"><span>VAT ({taxPercentage}%)</span><span>৳{tax}</span></div><div className="flex justify-between"><span>Delivery Charge</span><span>৳{deliveryFee}</span></div><div className="pt-2 border-t border-neutral-200 flex justify-between text-lg font-black text-neutral-900"><span>Total Payable</span><span className="text-orange-600">৳{total}</span></div></div>
            <button type="submit" disabled={loading || paymentMethodsLoading || !selectedPM} className="w-full py-4 bg-[var(--bm-ember)] hover:bg-[var(--bm-ember-deep)] disabled:opacity-50 text-[var(--bm-ink-deep)] font-black rounded-2xl shadow-[0_12px_32px_rgba(255,90,31,.24)] text-sm flex items-center justify-center gap-2 transition-all">{loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck className="w-5 h-5" /><span>Confirm & Place Order (৳{total})</span></>}</button>
          </div>
        </div>
      </form>
    </div>
  );
};
