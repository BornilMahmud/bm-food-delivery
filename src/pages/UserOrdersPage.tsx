import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { Clock, Eye, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';

interface UserOrdersPageProps {
  onSelectTrackOrder: (orderId: string) => void;
  onOpenAuth: () => void;
}

export const UserOrdersPage: React.FC<UserOrdersPageProps> = ({ onSelectTrackOrder, onOpenAuth }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toMillis = (value: any) => typeof value?.toMillis === 'function'
        ? value.toMillis()
        : value?.seconds
          ? value.seconds * 1000
          : typeof value === 'string' ? Date.parse(value) : 0;
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Order));
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setOrders(list);
      setLoading(false);
    }, (loadError) => {
      console.error('Failed to load user orders:', loadError);
      setError('Unable to load your order history.');
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-neutral-100 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-orange-500 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-800">Please Log In</h2>
        <p className="text-xs text-neutral-500">Sign in to view your order history and track active deliveries.</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-xs"
        >
          Log In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Order History</h1>
        <p className="text-xs text-neutral-500 mt-1">Track active food orders or view past delivery receipts</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-neutral-500 font-bold">Loading your orders...</div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 text-red-700 rounded-3xl border border-red-200 font-bold text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-100 space-y-3">
          <p className="font-bold text-neutral-700">You haven't placed any orders yet.</p>
          <p className="text-xs text-neutral-400">Delicious Biryani, Burgers, and Pizza are waiting for you!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-neutral-900 text-sm">Order #{order.id.slice(0, 8)}</span>
                  <span className="bg-orange-100 text-orange-800 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                    {order.orderStatus}
                  </span>
                  <span className="bg-neutral-100 text-neutral-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                    Payment: {order.paymentStatus}
                  </span>
                </div>

                <p className="text-xs font-bold text-orange-600">{order.restaurantName || 'BM Partner Kitchen'}</p>
                <p className="text-xs text-neutral-500">
                  {order.items.map((i) => `${i.foodName} (${i.quantity})`).join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-base font-black text-neutral-900">৳{order.total}</p>
                  <p className="text-[10px] text-neutral-400">{order.paymentMethod}</p>
                </div>

                <button
                  onClick={() => onSelectTrackOrder(order.id)}
                  className="px-4 py-2 bg-orange-50 hover:bg-[var(--bm-ember)] hover:text-[var(--bm-ink-deep)] text-[var(--bm-ember)] font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Track Live</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
