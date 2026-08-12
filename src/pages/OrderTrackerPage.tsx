import React, { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { CheckCircle2, Clock, ChefHat, Bike, PackageCheck, AlertCircle, Phone, MapPin, Star, ArrowLeft } from 'lucide-react';

interface OrderTrackerPageProps {
  orderId: string;
  onBackToHome: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: any; desc: string }[] = [
  { key: 'pending', label: 'Order Received', icon: Clock, desc: 'Awaiting restaurant confirmation' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, desc: 'Kitchen accepted your order' },
  { key: 'preparing', label: 'Preparing Food', icon: ChefHat, desc: 'Chef is cooking your fresh meal' },
  { key: 'ready', label: 'Food Ready', icon: PackageCheck, desc: 'Packed and waiting for rider' },
  { key: 'picked_up', label: 'Picked Up', icon: Bike, desc: 'Rider picked up hot parcel' },
  { key: 'delivering', label: 'Delivering', icon: Bike, desc: 'Rider is driving to your address' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Delivered hot to your door' },
];

const timestampMillis = (value: unknown) => {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(remaining).padStart(2, '0')}s` : `${minutes}m ${String(remaining).padStart(2, '0')}s`;
};

export const OrderTrackerPage: React.FC<OrderTrackerPageProps> = ({ orderId, onBackToHome }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!order || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      setRemainingSeconds(null);
      return;
    }
    const createdAt = timestampMillis(order.createdAt) ?? Date.now();
    const estimatedMinutes = Math.max(1, Number(order.estimatedDeliveryMinutes || 35));
    const deadline = createdAt + estimatedMinutes * 60 * 1000;
    const updateCountdown = () => setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [order?.id, order?.createdAt, order?.estimatedDeliveryMinutes, order?.orderStatus]);

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        } else {
          setError("Order not found.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        setError("Failed to load real-time order status.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [orderId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!comment.trim()) {
      setReviewError('Please add a short comment before submitting your review.');
      return;
    }
    setReviewError(null);
    try {
      const reviewRef = doc(db, 'reviews', `review-${order.id}`);
      const existingReview = await getDoc(reviewRef);
      if (existingReview.exists()) throw new Error('A review has already been submitted for this order.');
      await setDoc(reviewRef, {
        id: reviewRef.id,
        orderId: order.id,
        restaurantId: order.restaurantId,
        userId: order.userId,
        userName: order.userName || 'Customer',
        rating,
        foodRating: rating,
        packagingRating: rating,
        deliveryRating: rating,
        valueRating: rating,
        comment: comment.trim(),
        isVisible: true,
        createdAt: serverTimestamp(),
      });
      setReviewSubmitted(true);
      setShowReviewModal(false);
    } catch (reviewSubmitError) {
      console.error('Failed to submit review:', reviewSubmitError);
      setReviewError('Your review could not be submitted. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="font-bold text-neutral-600">Connecting to real-time order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-neutral-800">{error || "Order unavailable"}</h2>
        <button onClick={onBackToHome} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs">
          Return to Home
        </button>
      </div>
    );
  }

  // Calculate active step index
  const normalizedStatus: OrderStatus = order.orderStatus === 'on_the_way' ? 'delivering' : order.orderStatus;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === normalizedStatus);

  return (
    <div className="bm-shell min-h-[calc(100vh-72px)] max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-[#0b0e11] text-[var(--bm-cream)] p-6 sm:p-8 rounded-3xl border border-[var(--bm-line)] shadow-[var(--bm-shadow-deep)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToHome}
            className="text-xs font-bold text-[var(--bm-saffron)] hover:text-[var(--bm-ember)] flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
          <p className="text-xs font-bold uppercase text-[var(--bm-saffron)]">Live Order Tracker</p>
          <h1 className="text-2xl sm:text-3xl font-black">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-xs text-neutral-100 mt-1">From: {order.restaurantName || 'BM Partner Kitchen'}</p>
        </div>

        <div className="text-right bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
          <p className="text-[10px] text-[var(--bm-saffron)] uppercase font-black">Total Payable</p>
          <p className="text-2xl font-black text-white">৳{order.total}</p>
          <p className="text-[11px] text-[var(--bm-cream-soft)] font-semibold mt-1">
            Payment: <strong className="uppercase">{order.paymentStatus}</strong>
          </p>
        </div>
      </div>

      {/* ETA Banner */}
      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
        <div className="bg-[var(--bm-paper-strong)] p-6 rounded-3xl border border-[var(--bm-line)] shadow-[var(--bm-shadow)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#232a31] rounded-full flex items-center justify-center text-[var(--bm-ember)]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase">Estimated Delivery Time</p>
              <p className="text-2xl font-black text-neutral-900">
                {remainingSeconds !== null ? (remainingSeconds > 0 ? formatCountdown(remainingSeconds) : 'Arriving soon') : (order.orderStatus === 'pending' || order.orderStatus === 'confirmed' ? '25 - 30 mins' :
                 order.orderStatus === 'preparing' ? '15 - 20 mins' :
                 order.orderStatus === 'ready' || order.orderStatus === 'picked_up' ? '10 - 15 mins' :
                 '5 - 10 mins')}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-orange-600">{remainingSeconds !== null ? 'Live countdown' : 'Estimated arrival window'}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-neutral-500">Order ID: {order.id}</p>
          </div>
        </div>
      )}

      {/* Manual Payment Pending Alert */}
      {order.paymentStatus === 'manual_pending' && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Manual Payment Verification Pending (TxID: {order.transactionId || 'Submitted'})</p>
            <p className="text-neutral-600 mt-0.5">Admin is verifying your bKash/Nagad transaction. Kitchen is starting preparation.</p>
          </div>
        </div>
      )}

      {/* Real-time Order Progress Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-neutral-900">Live Delivery Progress</h2>

        <div className="space-y-6 relative pl-6 border-l-2 border-[var(--bm-ember)]/30">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Status Dot */}
                <div
                  className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                    isCurrent
                      ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] ring-4 ring-[var(--bm-ember)]/20 animate-pulse'
                      : isCompleted
                      ? 'bg-[var(--bm-basil)] text-[var(--bm-ink-deep)]'
                      : 'bg-[#232a31] text-neutral-400'
                  }`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {step.label}
                    </h3>
                    {isCurrent && (
                      <span className="bg-[var(--bm-ember)]/15 text-[var(--bm-ember)] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Current Status
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review CTA if Delivered */}
      {order.orderStatus === 'delivered' && !reviewSubmitted && (
        <div className="p-6 bg-[var(--bm-basil)] text-[var(--bm-ink-deep)] rounded-3xl flex items-center justify-between gap-4 shadow-lg">
          <div>
            <h3 className="font-bold text-lg">Food Delivered! Enjoy your meal!</h3>
            <p className="text-xs text-emerald-100 mt-0.5">Help others by sharing your review of this dish & restaurant.</p>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-5 py-2.5 bg-[#f5eee6] text-[#1a1512] font-bold rounded-xl text-xs hover:bg-emerald-50 shadow-md"
          >
            Leave Review
          </button>
        </div>
      )}

      {/* Order Details & Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-neutral-900">Delivery Address</h3>
          <p className="font-bold text-neutral-800">{order.deliveryAddress.name}</p>
          <p className="text-neutral-600">{order.deliveryAddress.phone}</p>
          <p className="text-neutral-600">{order.deliveryAddress.address}, {order.deliveryAddress.area}, {order.deliveryAddress.city}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-neutral-900">Items Ordered</h3>
          <div className="divide-y divide-neutral-100">
            {order.items.map((i, idx) => (
              <div key={idx} className="py-1.5 flex justify-between">
                <span>{i.foodName} × {i.quantity}</span>
                <span className="font-bold">৳{i.price * i.quantity}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Leave Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowReviewModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full z-10 space-y-4">
            <h2 className="text-lg font-bold text-neutral-900">Rate Your Order</h2>

            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Your Comment</label>
              <textarea
                rows={3}
                placeholder="How was the food quality, taste, and delivery speed?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-neutral-200 rounded-xl text-xs focus:outline-hidden"
              />
            </div>

            {reviewError && <p className="text-xs text-red-600 font-bold">{reviewError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
