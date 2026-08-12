import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DeliveryRider, Order, OrderStatus } from '../../types';
import { AlertCircle, Bike, CheckCircle2, Clock3, MapPin, PackageCheck, WalletCards } from 'lucide-react';

const RIDER_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'picked_up', label: 'Picked up' },
  { status: 'delivering', label: 'Delivering' },
  { status: 'delivered', label: 'Mark delivered' },
];

export const RiderDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rider, setRider] = useState<DeliveryRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentUser || isAdmin) {
        setLoading(false);
        setError('No rider assignment is available for this account.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [snapshot, riderSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('riderId', '==', currentUser.uid))),
          getDoc(doc(db, 'riders', currentUser.uid)),
        ]);
        if (active) {
          const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Order));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setOrders(list);
          setRider(riderSnapshot.exists() ? ({ id: riderSnapshot.id, ...riderSnapshot.data() } as DeliveryRider) : null);
        }
      } catch (loadError) {
        console.error('Unable to load rider assignments:', loadError);
        if (active) setError('Unable to load your assigned deliveries. Check the rider profile and Firestore rules.');
      } finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [currentUser, isAdmin]);

  const handleUpdateStatus = async (orderId: string, orderStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus, updatedAt: serverTimestamp() });
      setOrders((previous) => previous.map((order) => order.id === orderId ? { ...order, orderStatus } : order));
    } catch (updateError) {
      console.error('Unable to update delivery status:', updateError);
      setError('The delivery status could not be updated.');
    } finally { setUpdatingId(null); }
  };

  const activeOrders = useMemo(() => orders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)), [orders]);
  const history = useMemo(() => orders.filter((order) => ['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)), [orders]);
  const earnings = rider?.walletEarnings ?? deliveredTotal(orders);

  return <div className="bm-shell min-h-[calc(100vh-72px)] px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-8"><div className="rounded-[28px] bg-[#1f3124] p-6 text-white shadow-[var(--bm-shadow-deep)] sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#b4c8af]">BM Food / Delivery platform</p><h1 className="bm-display mt-3 text-5xl leading-none sm:text-6xl">Move good food forward.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#d5e0d0]">Only orders assigned to your authenticated rider account appear here. Update the delivery timeline as the meal moves from pickup to doorstep.</p></div><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4e0cf] text-[#1f3124]"><Bike className="h-8 w-8" /></div></div></div>{error && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Active jobs</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-terracotta)]">{activeOrders.length}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Completed</p><p className="mt-2 text-3xl font-extrabold text-[#507254]">{rider?.completedDeliveries ?? history.filter((order) => order.orderStatus === 'delivered').length}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Rating</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-ink)]">{rider?.rating?.toFixed(1) ?? '—'}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Earnings</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-ink)]">৳{earnings.toLocaleString()}</p></div></div><section className="bm-card p-5 sm:p-7"><div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[var(--bm-terracotta)]" /><div><h2 className="text-xl font-extrabold text-[var(--bm-ink)]">Assigned delivery jobs</h2><p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Pickup, destination, customer, items, status.</p></div></div>{loading ? <p className="p-10 text-center text-sm font-bold text-[var(--bm-ink-soft)]">Loading your assignments...</p> : activeOrders.length === 0 ? <p className="p-10 text-center text-sm font-bold text-[var(--bm-ink-soft)]">No active deliveries are assigned to you.</p> : <div className="mt-6 grid gap-4 lg:grid-cols-2">{activeOrders.map((order) => <div key={order.id} className="rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper)] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-[var(--bm-ink)]">Order #{order.id.slice(0, 8)}</p><p className="mt-1 text-[10px] text-[var(--bm-ink-soft)]">{order.restaurantName || order.restaurantId}</p></div><span className="rounded-full bg-[#e4ede2] px-2.5 py-1 text-[10px] font-extrabold capitalize text-[#507254]">{order.orderStatus.replaceAll('_', ' ')}</span></div><div className="mt-4 grid gap-3 text-xs"><p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bm-terracotta)]" /><span><b className="text-[var(--bm-ink)]">Deliver to:</b> {order.deliveryAddress.name} · {order.deliveryAddress.phone}<br /><span className="text-[var(--bm-ink-soft)]">{order.deliveryAddress.address}, {order.deliveryAddress.area}, {order.deliveryAddress.city}</span></span></p><p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bm-brass)]" /><span><b className="text-[var(--bm-ink)]">Items:</b> {order.items.map((item) => `${item.foodName} × ${item.quantity}`).join(', ')}</span></p></div><div className="mt-4 flex flex-wrap gap-2">{RIDER_STATUSES.map((action) => <button key={action.status} disabled={updatingId === order.id || order.orderStatus === action.status || (action.status === 'picked_up' && order.orderStatus !== 'ready' && order.orderStatus !== 'picked_up')} onClick={() => handleUpdateStatus(order.id, action.status)} className="rounded-xl bg-[#1f3124] px-3 py-2 text-[10px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-30">{action.label}</button>)}</div></div>)}</div>}</section><section className="bm-card p-5 sm:p-7"><div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[var(--bm-terracotta)]" /><div><h2 className="text-xl font-extrabold text-[var(--bm-ink)]">Delivery history</h2><p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Completed and cancelled jobs tied to this rider account.</p></div></div><div className="mt-5 space-y-3">{history.length ? history.slice(0, 20).map((order) => <div key={order.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-[var(--bm-line)] p-4 text-xs sm:flex-row sm:items-center"><div><p className="font-extrabold text-[var(--bm-ink)]">#{order.id.slice(0, 8)} · {order.restaurantName || order.restaurantId}</p><p className="mt-1 text-[var(--bm-ink-soft)]">{order.deliveryAddress.area}, {order.deliveryAddress.city}</p></div><span className="flex items-center gap-1 font-extrabold capitalize text-[#507254]"><CheckCircle2 className="h-4 w-4" />{order.orderStatus}</span></div>) : <p className="rounded-2xl bg-[var(--bm-paper)] p-8 text-center text-xs text-[var(--bm-ink-soft)]">No delivery history yet.</p>}</div></section></div></div>;
};

function deliveredTotal(orders: Order[]) {
  return orders.filter((order) => order.orderStatus === 'delivered').reduce((sum, order) => sum + Math.max(0, Math.round(Number(order.deliveryFee || 0) * 0.25)), 0);
}
