import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowRight, Filter, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { db } from '../lib/firebase';
import { Restaurant } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';

interface RestaurantsPageProps { onSelectRestaurant: (id: string) => void; }

export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'fee' | 'eta'>('rating');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDocs(query(collection(db, 'restaurants'), where('status', '==', 'active'))).then((snapshot) => {
      if (!active) return;
      setRestaurants(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Restaurant)).filter((restaurant) => restaurant.status === 'active'));
      setError(null);
    }).catch((loadError) => {
      console.error('Unable to load restaurants:', loadError);
      if (active) setError('Restaurants are temporarily unavailable.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const cuisines = useMemo(() => Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.cuisineTypes || []))).sort(), [restaurants]);
  const filtered = useMemo(() => restaurants.filter((restaurant) => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch = !term || restaurant.name.toLowerCase().includes(term) || restaurant.address.toLowerCase().includes(term) || restaurant.cuisineTypes.some((cuisine) => cuisine.toLowerCase().includes(term));
    return matchSearch && (selectedCuisine === 'all' || restaurant.cuisineTypes.includes(selectedCuisine));
  }).sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'fee' ? a.deliveryFee - b.deliveryFee : a.estimatedDeliveryTime - b.estimatedDeliveryTime), [restaurants, searchTerm, selectedCuisine, sortBy]);

  return <div className="bm-shell min-h-[calc(100vh-72px)] pb-20"><section className="mx-4 mt-4 overflow-hidden rounded-[28px] bg-[#0b0e11] px-6 py-12 text-[#f7efe6] sm:mx-6 sm:px-10 lg:mx-10 lg:py-16"><div className="max-w-3xl"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f3b562]">BM Food / Restaurants</p><h1 className="bm-display mt-4 text-5xl leading-none sm:text-7xl">Kitchens with a point of view.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#c9beb4]">Find the teams, menus, and dishes shaping the city’s next food stories. Every restaurant shown here is live from the BM Food catalog.</p><div className="mt-7 flex flex-wrap gap-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-white/55"><span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#f3b562]" /> Dhaka delivery hubs</span><span>·</span><span>{restaurants.length} live kitchens</span></div></div></section><main className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-strong)] p-3 shadow-[var(--bm-shadow)] md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-[var(--bm-paper)] px-3"><Search className="h-4 w-4 shrink-0 text-[var(--bm-ink-soft)]" /><input aria-label="Search restaurants" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by restaurant, cuisine, or location" className="w-full bg-transparent py-3 text-xs text-[var(--bm-ink)] placeholder:text-[var(--bm-ink-soft)] focus:outline-none" /></div><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-[var(--bm-line)] px-3 text-xs text-[var(--bm-ink-soft)]"><Filter className="h-3.5 w-3.5" /><select aria-label="Filter by cuisine" value={selectedCuisine} onChange={(event) => setSelectedCuisine(event.target.value)} className="bg-transparent py-3 font-extrabold text-[var(--bm-ink)] focus:outline-none"><option value="all">All cuisines</option>{cuisines.map((cuisine) => <option key={cuisine} value={cuisine}>{cuisine}</option>)}</select></label><label className="flex items-center gap-2 rounded-xl border border-[var(--bm-line)] px-3 text-xs text-[var(--bm-ink-soft)]"><SlidersHorizontal className="h-3.5 w-3.5" /><select aria-label="Sort restaurants" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="bg-transparent py-3 font-extrabold text-[var(--bm-ink)] focus:outline-none"><option value="rating">Top rated</option><option value="fee">Lowest fee</option><option value="eta">Fastest arrival</option></select></label></div></div>{error && <div className="mb-6 rounded-2xl border border-[var(--bm-error)]/30 bg-[var(--bm-error)]/10 p-4 text-xs font-bold text-[var(--bm-error)]">{error} Please try again after the Firebase catalog is available.</div>}{loading ? <div className="bm-card p-12 text-center text-sm font-bold text-[var(--bm-ink-soft)]">Curating the live restaurant list...</div> : filtered.length === 0 ? <div className="bm-card p-12 text-center"><p className="text-sm font-extrabold text-[var(--bm-ink)]">No restaurants match this view.</p><p className="mt-2 text-xs text-[var(--bm-ink-soft)]">Clear the filters or check back when more kitchens are published.</p><button onClick={() => { setSearchTerm(''); setSelectedCuisine('all'); }} className="bm-button mt-5">Clear filters <ArrowRight className="h-4 w-4" /></button></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={onSelectRestaurant} />)}</div>}</main></div>;
};
