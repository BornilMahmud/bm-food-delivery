import React from 'react';
import { Bike, CheckCircle2, Clock3, MapPin, Star } from 'lucide-react';
import { Restaurant } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (id: string) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => (
  <article onClick={() => onClick(restaurant.id)} className="group bm-card flex h-full cursor-pointer flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--bm-shadow-deep)]">
    <div className="relative aspect-[1.75] overflow-hidden bg-[#1b2026]"><ImageWithFallback src={restaurant.coverImageUrl} alt={restaurant.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" /><div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] backdrop-blur ${restaurant.isOpen ? 'bg-[#1b2026]/90 text-[#8fa48c]' : 'bg-[#0b0e11]/80 text-white/70'}`}><span className={`h-1.5 w-1.5 rounded-full ${restaurant.isOpen ? 'bg-[#8fa48c]' : 'bg-white/40'}`} />{restaurant.isOpen ? 'Open now' : 'Closed'}</span><span className="flex items-center gap-1 rounded-full bg-[#0b0e11]/70 px-2.5 py-1.5 text-[10px] font-extrabold text-white backdrop-blur"><Star className="h-3 w-3 fill-[#f3b562] text-[#f3b562]" />{restaurant.rating.toFixed(1)}</span></div><div className="absolute bottom-4 left-4 flex items-end gap-3"><div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-xl"><ImageWithFallback src={restaurant.logoUrl} alt={`${restaurant.name} logo`} className="h-full w-full object-cover" /></div><div className="text-white"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-white/65">Featured kitchen</p><h3 className="mt-1 text-lg font-extrabold leading-tight">{restaurant.name}</h3></div></div></div>
    <div className="flex flex-1 flex-col justify-between p-5"><div><p className="line-clamp-1 text-xs text-[var(--bm-ink-soft)]">{restaurant.cuisineTypes.join(' · ')}</p><div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--bm-ink-soft)]"><MapPin className="h-3.5 w-3.5 text-[var(--bm-terracotta)]" /><span className="truncate">{restaurant.address}</span></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--bm-line)] pt-4 text-[10px] font-extrabold text-[var(--bm-ink-soft)]"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[var(--bm-brass)]" />{restaurant.estimatedDeliveryTime} min</span><span className="flex items-center gap-1.5"><Bike className="h-3.5 w-3.5 text-[var(--bm-terracotta)]" />৳{restaurant.deliveryFee} delivery</span><span className="flex items-center gap-1.5 text-[var(--bm-sage)]"><CheckCircle2 className="h-3.5 w-3.5" />Verified</span></div></div>
  </article>
);
