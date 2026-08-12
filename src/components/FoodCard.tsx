import React, { useEffect, useState } from 'react';
import { arrayRemove, arrayUnion, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Check, Clock3, Heart, Minus, Plus, Star } from 'lucide-react';
import { Food } from '../types';
import { useCart } from '../contexts/CartContext';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

interface FoodCardProps {
  food: Food;
  restaurantName?: string;
  onOpenDetail?: (food: Food) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, restaurantName, onOpenDetail }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { currentUser, userProfile } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const cartItem = items.find((item) => item.foodId === food.id);
  const quantity = cartItem?.quantity || 0;
  const hasDiscount = food.discountPrice !== null && food.discountPrice < food.price;
  const price = food.discountPrice ?? food.price;

  useEffect(() => {
    setFavorite(Boolean(userProfile?.favorites?.includes(food.id)));
  }, [food.id, userProfile?.favorites]);

  const handleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!currentUser) {
      window.alert('Sign in to save favorites to your BM Food profile.');
      return;
    }
    const favoriteRef = doc(db, 'favorites', `${currentUser.uid}_${food.id}`);
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      if (favorite) {
        await Promise.all([deleteDoc(favoriteRef), updateDoc(userRef, { favorites: arrayRemove(food.id), updatedAt: serverTimestamp() })]);
        setFavorite(false);
      } else {
        await Promise.all([setDoc(favoriteRef, { id: favoriteRef.id, userId: currentUser.uid, foodId: food.id, createdAt: serverTimestamp() }), updateDoc(userRef, { favorites: arrayUnion(food.id), updatedAt: serverTimestamp() })]);
        setFavorite(true);
      }
    } catch (favoriteError) {
      console.error('Unable to update favorite:', favoriteError);
    }
  };

  const handleAdd = () => {
    if (!food.isAvailable) return;
    if (addItem(food, restaurantName)) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1100);
    }
  };

  return (
    <article className="group bm-card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--bm-shadow-deep)]">
      <div className="relative aspect-[1.12] cursor-pointer overflow-hidden bg-[#1b2026]" onClick={() => onOpenDetail?.(food)}>
        <ImageWithFallback src={food.imageUrl} alt={food.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {hasDiscount && <span className="rounded-full bg-[#f3b562] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#1a1512]">Save ৳{food.price - food.discountPrice!}</span>}
          {food.isFeatured && <span className="rounded-full bg-[#0b0e11]/85 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-white backdrop-blur">Trending</span>}
        </div>
        <button aria-label={favorite ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`} aria-pressed={favorite} onClick={handleFavorite} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 backdrop-blur transition ${favorite ? 'bg-[#f5eee6] text-[var(--bm-terracotta)]' : 'bg-black/20 text-white hover:bg-[var(--bm-ember)] hover:text-[var(--bm-ink-deep)]'}`}><Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} /></button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#0b0e11]/82 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur"><Clock3 className="h-3 w-3 text-[#f3b562]" /> {food.preparationTime} min prep</div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div><p className="truncate text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--bm-terracotta)]">{restaurantName || 'Verified kitchen'}</p><h3 className="mt-2 cursor-pointer text-base font-extrabold leading-tight text-[var(--bm-ink)] transition hover:text-[var(--bm-terracotta)]" onClick={() => onOpenDetail?.(food)}>{food.name}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--bm-ink-soft)]">{food.description}</p></div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[var(--bm-line)] pt-4"><div><div className="flex items-baseline gap-2"><span className="text-lg font-extrabold text-[var(--bm-ink)]">৳{price}</span>{hasDiscount && <span className="text-xs text-[var(--bm-ink-soft)] line-through">৳{food.price}</span>}</div><div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[var(--bm-brass)]"><Star className="h-3 w-3 fill-current" /> {food.rating.toFixed(1)} <span className="text-[var(--bm-ink-soft)]">({food.reviewCount})</span></div></div>{quantity > 0 ? <div className="flex items-center gap-1 rounded-full bg-[var(--bm-graphite-overlay)] p-1 text-[var(--bm-cream)]"><button aria-label={`Decrease ${food.name} quantity`} onClick={() => updateQuantity(food.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[var(--bm-ember)]/20"><Minus className="h-3.5 w-3.5" /></button><span className="w-5 text-center text-xs font-extrabold">{quantity}</span><button aria-label={`Increase ${food.name} quantity`} onClick={() => updateQuantity(food.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[var(--bm-ember)]/20"><Plus className="h-3.5 w-3.5" /></button></div> : <button aria-label={`Add ${food.name} to cart`} onClick={handleAdd} disabled={!food.isAvailable} className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[10px] font-extrabold transition ${food.isAvailable ? added ? 'bg-[var(--bm-basil)] text-[var(--bm-ink-deep)]' : 'border border-[var(--bm-terracotta)]/30 bg-[#232a31] text-[var(--bm-terracotta)] hover:bg-[var(--bm-ember)] hover:text-[var(--bm-ink-deep)]' : 'cursor-not-allowed bg-[var(--bm-paper)] text-[var(--bm-ink-soft)]'}`}>{added ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Add</>}</button>}</div>
      </div>
    </article>
  );
};
