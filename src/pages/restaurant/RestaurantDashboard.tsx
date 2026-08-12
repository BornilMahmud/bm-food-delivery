import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Food, Order, OrderStatus } from '../../types';
import { AlertCircle, CheckCircle2, ChefHat, Clock3, Eye, PackageCheck, Store, Utensils } from 'lucide-react';

const VENDOR_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirm' },
  { status: 'preparing', label: 'Start cooking' },
  { status: 'ready', label: 'Mark ready' },
];

export const RestaurantDashboard: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingFoodId, setUpdatingFoodId] = useState<string | null>(null);

  const restaurantId = userProfile?.restaurantId;
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!restaurantId || isAdmin) {
        setLoading(false);
        setError('No restaurant is assigned to this vendor account.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [orderSnapshot, foodSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('restaurantId', '==', restaurantId))),
          getDocs(query(collection(db, 'foods'), where('restaurantId', '==', restaurantId))),
        ]);
        if (active) {
          const list = orderSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Order));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setOrders(list);
          setFoods(foodSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Food)).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (loadError) {
        console.error('Unable to load restaurant operations:', loadError);
        if (active) setError('Unable to load this restaurant’s live operations. Check the vendor role and Firestore rules.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [restaurantId, isAdmin]);

  const handleUpdateStatus = async (orderId: string, orderStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus, updatedAt: serverTimestamp() });
      setOrders((previous) => previous.map((order) => order.id === orderId ? { ...order, orderStatus } : order));
    } catch (updateError) {
      console.error('Unable to update order status:', updateError);
      setError('The order status could not be updated.');
    } finally { setUpdatingId(null); }
  };

  const handleToggleFood = async (food: Food) => {
    setUpdatingFoodId(food.id);
    try {
      await updateDoc(doc(db, 'foods', food.id), { isAvailable: !food.isAvailable, updatedAt: serverTimestamp() });
      setFoods((previous) => previous.map((item) => item.id === food.id ? { ...item, isAvailable: !food.isAvailable } : item));
    } catch (updateError) {
      console.error('Unable to update food availability:', updateError);
      setError('The menu availability could not be updated.');
    } finally { setUpdatingFoodId(null); }
  };

  const lanes = useMemo(() => ({ incoming: orders.filter((order) => ['pending', 'confirmed'].includes(order.orderStatus)), cooking: orders.filter((order) => order.orderStatus === 'preparing'), ready: orders.filter((order) => order.orderStatus === 'ready') }), [orders]);

  return <div className="bm-shell min-h-[calc(100vh-72px)] px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl space-y-8"><div className="rounded-[28px] bg-[#201b17] p-6 text-white shadow-[var(--bm-shadow-deep)] sm:p-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e0c48b]">BM Food / Kitchen platform</p><h1 className="bm-display mt-3 text-5xl leading-none sm:text-6xl">Make every order count.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#d8cec2]">A scoped kitchen display for the restaurant assigned to this account. Confirm, cook, and mark orders ready without seeing another partner’s data.</p></div><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5d9a7] text-[#201b17]"><ChefHat className="h-8 w-8" /></div></div></div>{error && <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Incoming</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-terracotta)]">{lanes.incoming.length}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Cooking</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-ink)]">{lanes.cooking.length}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Ready</p><p className="mt-2 text-3xl font-extrabold text-[#507254]">{lanes.ready.length}</p></div><div className="bm-card p-5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">Live menu</p><p className="mt-2 text-3xl font-extrabold text-[var(--bm-ink)]">{foods.filter((food) => food.isAvailable).length}</p></div></div><section className="bm-card p-5 sm:p-7"><div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[var(--bm-terracotta)]" /><div><h2 className="text-xl font-extrabold text-[var(--bm-ink)]">Kitchen display</h2><p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Live orders scoped to this authorized restaurant.</p></div></div>{loading ? <p className="p-10 text-center text-sm font-bold text-[var(--bm-ink-soft)]">Loading kitchen operations...</p> : orders.length === 0 ? <p className="p-10 text-center text-sm font-bold text-[var(--bm-ink-soft)]">No orders are waiting for this restaurant.</p> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{([['incoming', 'Incoming', lanes.incoming], ['cooking', 'Cooking', lanes.cooking], ['ready', 'Ready for dispatch', lanes.ready] ] as const).map(([key, label, lane]) => <div key={key} className="rounded-2xl bg-[var(--bm-paper)] p-3"><div className="flex items-center justify-between px-2 py-2"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--bm-ink-soft)]">{label}</p><span className="rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-[var(--bm-terracotta)]">{lane.length}</span></div><div className="space-y-3">{lane.map((order) => <div key={order.id} className="rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-strong)] p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold text-[var(--bm-ink)]">#{order.id.slice(0, 8)}</p><span className="flex items-center gap-1 text-[10px] text-[var(--bm-ink-soft)]"><Clock3 className="h-3 w-3" />{order.items?.reduce((sum, item) => sum + item.quantity, 0)} items</span></div><p className="mt-3 text-[11px] leading-5 text-[var(--bm-ink-soft)]">{order.items?.map((item) => `${item.foodName} × ${item.quantity}`).join(', ')}</p><p className="mt-3 text-xs font-extrabold text-[var(--bm-terracotta)]">৳{order.total} · {order.paymentMethod}</p><div className="mt-3 flex flex-wrap gap-2">{VENDOR_STATUSES.map((action) => <button key={action.status} disabled={updatingId === order.id || order.orderStatus === action.status || (key === 'ready' && action.status !== 'ready')} onClick={() => handleUpdateStatus(order.id, action.status)} className="rounded-lg bg-[var(--bm-ink)] px-2.5 py-2 text-[10px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-30">{action.label}</button>)}</div></div>)}</div></div>)}</div>}</section><section className="bm-card p-5 sm:p-7"><div className="flex items-center gap-2"><Utensils className="h-5 w-5 text-[var(--bm-terracotta)]" /><div><h2 className="text-xl font-extrabold text-[var(--bm-ink)]">Menu availability</h2><p className="mt-1 text-xs text-[var(--bm-ink-soft)]">Update availability for your own restaurant’s live dishes.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{foods.length ? foods.map((food) => <div key={food.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--bm-line)] p-3"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[var(--bm-ink)]">{food.name}</p><p className="mt-1 text-[10px] text-[var(--bm-ink-soft)]">৳{food.discountPrice ?? food.price} · {food.isAvailable ? 'Available' : 'Paused'}</p></div><button onClick={() => handleToggleFood(food)} disabled={updatingFoodId === food.id} title="Toggle availability" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${food.isAvailable ? 'bg-[#e4ede2] text-[#507254]' : 'bg-[#fbefe9] text-[var(--bm-terracotta)]'}`}><Eye className="h-4 w-4" /></button></div>) : <p className="text-xs text-[var(--bm-ink-soft)]">No dishes are assigned to this restaurant yet.</p>}</div></section></div></div>;
};
