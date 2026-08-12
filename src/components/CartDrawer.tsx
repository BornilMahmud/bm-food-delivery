import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Utensils, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Coupon } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onProceedCheckout }) => {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponLoadError, setCouponLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDocs(query(collection(db, 'coupons'), where('isActive', '==', true)))
      .then((snapshot) => {
        if (!active) return;
        setAvailableCoupons(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Coupon)));
        setCouponLoadError(null);
      })
      .catch((error) => {
        console.error('Unable to load coupons:', error);
        if (active) setCouponLoadError('Promotional codes are temporarily unavailable.');
      });
    return () => { active = false; };
  }, []);

  const {
    items,
    restaurantName,
    coupon,
    couponCodeInput,
    couponError,
    subtotal,
    discount,
    tax,
    deliveryFee,
    total,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setCouponCodeInput,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-l border-neutral-100 dark:border-neutral-800">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-orange-50/50 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">Your Food Basket</h2>
                {restaurantName && (
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 truncate max-w-[200px]">
                    From: {restaurantName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clear Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-400 flex items-center justify-center">
                  <Utensils className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-lg">Your cart is empty</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
                    Explore top restaurants and add delicious Biryani, Burgers, or Pizza to your order!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-full font-bold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-700 transition-colors cursor-pointer"
                >
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <>
                {/* List of items */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {items.map((item) => (
                    <div key={`${item.foodId}-${JSON.stringify(item.selectedOptions || [])}`} className="py-3 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.foodName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-xs leading-tight truncate">
                          {item.foodName}
                        </h4>
                        {item.selectedOptions?.length ? <p className="mt-1 line-clamp-2 text-[10px] text-neutral-500">{item.selectedOptions.map((option) => option.choiceLabel).join(' · ')}</p> : null}
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-extrabold mt-1">
                          ৳{item.price * item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-full p-0.5 bg-neutral-50 dark:bg-neutral-800">
                        <button
                          onClick={() => updateQuantity(item.foodId, -1, item.selectedOptions)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.foodId, 1, item.selectedOptions)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.foodId, item.selectedOptions)}
                        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Box */}
                <div className="bg-orange-50/60 dark:bg-orange-950/30 rounded-2xl p-3.5 border border-orange-100 dark:border-orange-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      Have a Promo Code?
                    </span>
                    {coupon && (
                      <button
                        onClick={removeCoupon}
                        className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
                      >
                        Remove ({coupon.code})
                      </button>
                    )}
                  </div>

                  {!coupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME50, BMFEST20"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 dark:text-white border border-orange-200 dark:border-neutral-700 rounded-lg focus:outline-hidden uppercase font-semibold"
                      />
                      <button
                        onClick={() => applyCoupon(couponCodeInput, availableCoupons)}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg font-bold text-xs hover:bg-orange-700 transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      Coupon <strong className="font-bold">{coupon.code}</strong> applied! Saved ৳{discount}.
                    </div>
                  )}

                  {(couponError || couponLoadError) && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {couponError || couponLoadError}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer calculation & checkout button */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">৳{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount</span>
                    <span>-৳{discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated VAT (5%)</span>
                  <span>৳{tax}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>৳{deliveryFee}</span>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between text-base font-black text-neutral-900 dark:text-neutral-100">
                  <span>Total Amount</span>
                  <span className="text-orange-600 dark:text-orange-400">৳{total}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onProceedCheckout();
                  onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
