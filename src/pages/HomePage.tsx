import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Restaurant, Category, Food, Banner, Review } from '../types';
import { FoodCard } from '../components/FoodCard';
import { RestaurantCard } from '../components/RestaurantCard';
import { ImageWithFallback } from '../components/ImageWithFallback';
import {
  ArrowDownRight,
  ArrowRight,
  Bike,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Percent,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';

interface HomePageProps {
  onSelectRestaurant: (id: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenDetailFood: (food: Food) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setCurrentView: (view: string) => void;
}

const heroFallback = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=88';
const secondaryFallback = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&auto=format&fit=crop&q=88';

export const HomePage: React.FC<HomePageProps> = ({
  onSelectRestaurant,
  onSelectCategory,
  onOpenDetailFood,
  searchTerm,
  setSearchTerm,
  setCurrentView,
}) => {
  const { userProfile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [todayFoodIds, setTodayFoodIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [categorySnap, restaurantSnap, foodSnap, bannerSnap, reviewSnap, todaySnap] = await Promise.all([
          getDocs(query(collection(db, 'categories'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'restaurants'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'foods'), where('isAvailable', '==', true))),
          getDocs(query(collection(db, 'banners'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'reviews'), where('isVisible', '==', true), limit(3))),
          getDoc(doc(db, 'homepageCollections', 'todays')).catch(() => null),
        ]);
        if (!active) return;
        const liveFoods = foodSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Food));
        setCategories(categorySnap.docs.map((item) => ({ id: item.id, ...item.data() } as Category)).sort((a, b) => a.sortOrder - b.sortOrder));
        setRestaurants(restaurantSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Restaurant)));
        setFoods(liveFoods);
        setBanners(bannerSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Banner)).sort((a, b) => a.sortOrder - b.sortOrder));
        setReviews(reviewSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Review)));
        const configuredIds = todaySnap?.exists() && Array.isArray(todaySnap.data().foodIds) ? todaySnap.data().foodIds.filter((id: unknown) => liveFoods.some((food) => food.id === id)) : [];
        setTodayFoodIds(configuredIds.length ? configuredIds : liveFoods.filter((food) => food.isTodaysSpecial || food.isFeatured).slice(0, 15).map((food) => food.id));
        setLoadError(null);
      } catch (error) {
        console.error('Unable to load the live home-page catalog:', error);
        if (active) setLoadError('The live catalog is temporarily unavailable. Published Firebase content will appear here once access is restored.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const filteredFoods = foods.filter((food) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesCategory = !selectedCategory || food.categoryId === selectedCategory;
    const matchesSearch = !term || food.name.toLowerCase().includes(term) || food.description.toLowerCase().includes(term) || food.tags.some((tag) => tag.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  });
  const featuredRestaurants = restaurants.filter((restaurant) => restaurant.isFeatured);
  const featuredFoods = foods.filter((food) => food.isFeatured);
  const todaysFoods = todayFoodIds.map((id) => foods.find((food) => food.id === id)).filter((food): food is Food => Boolean(food));
  const curatedFoods = todaysFoods.length ? todaysFoods : featuredFoods;
  const heroFood = curatedFoods[0] || foods[0];
  const supportingFood = curatedFoods[1] || foods[1];
  const heroImage = heroFood?.imageUrl || heroFallback;
  const supportingImage = supportingFood?.imageUrl || secondaryFallback;

  const handleHeroMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)),
      y: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)),
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
  };

  return (
    <div className="bm-shell pb-20">
      {loadError && <div className="mx-4 sm:mx-6 lg:mx-10 pt-4"><div className="bm-card flex items-start gap-3 border-red-200 bg-red-50/80 p-4 text-xs font-bold text-red-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />{loadError}</div></div>}
      {loading && <div className="mx-4 sm:mx-6 lg:mx-10 pt-4"><div className="bm-card p-4 text-xs font-bold text-[var(--bm-ink-soft)]">Curating the latest restaurants and dishes...</div></div>}

      <section className="mx-4 mt-4 overflow-hidden rounded-[28px] border border-[var(--bm-line)] bg-[#0b0e11] text-[#f7efe6] shadow-[var(--bm-shadow-deep)] sm:mx-6 lg:mx-10" onMouseMove={handleHeroMove} onMouseLeave={() => setPointer({ x: 0, y: 0 })}>
        <div className="bm-noise bm-grid relative isolate min-h-[650px] overflow-hidden px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#f3b562]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-[#8fa48c]/20 blur-3xl" />
          <div className="relative z-10 grid items-center gap-14 lg:grid-cols-[.92fr_1.08fr]">
            <div className="max-w-xl space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f3b562]/40 bg-[#f3b562]/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#f3b562]"><Sparkles className="h-3.5 w-3.5" /> Good food. Delivered beautifully.</div>
              <div className="space-y-5">
                <h1 className="bm-display text-5xl leading-[.98] sm:text-6xl lg:text-[5.8rem]">Your next favorite meal is closer than you think.</h1>
                <p className="max-w-lg text-sm leading-7 text-[#c9beb4] sm:text-base">Dhaka’s best kitchens, delivered with intention.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="bm-button" onClick={() => document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' })}>Explore Food <ArrowDownRight className="h-4 w-4" /></button>
                <button className="bm-button-secondary border-[var(--bm-ember)]/30 bg-[var(--bm-ember)]/06 text-[var(--bm-cream)] hover:bg-[var(--bm-ember)]/15" onClick={() => setCurrentView('restaurants')}>View Restaurants <ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[.06] p-2 backdrop-blur-sm sm:flex sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="h-4 w-4 shrink-0 text-[#f3b562]" /><input aria-label="Search for food" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') document.getElementById('food-menu-section')?.scrollIntoView({ behavior: 'smooth' }); }} placeholder="Search dishes, cravings, or cuisines" className="w-full bg-transparent py-3 text-xs text-white placeholder:text-[#9b9087] focus:outline-none" /></div>
                <button className="bm-button w-full sm:w-auto" onClick={() => document.getElementById('food-menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Search <Search className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-5 text-xs"><div><p className="font-extrabold text-white">25–35 min</p><p className="mt-1 text-[10px] text-[#9b9087]">Estimated arrival</p></div><div><p className="font-extrabold text-white">Live Firebase</p><p className="mt-1 text-[10px] text-[#9b9087]">Verified menus</p></div><div><p className="font-extrabold text-white">COD + manual</p><p className="mt-1 text-[10px] text-[#9b9087]">Trusted payments</p></div></div>
            </div>

            <div className="relative mx-auto h-[450px] w-full max-w-[560px] sm:h-[520px]" style={{ transform: `perspective(1100px) rotateY(${pointer.x * 2.5}deg) rotateX(${pointer.y * -2.5}deg)`, transition: 'transform 240ms cubic-bezier(.23,1,.32,1)' }}>
              <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f3b562]/25" />
              <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#8fa48c]/35" />
              <div className="bm-float absolute left-[6%] top-[12%] hidden w-32 rotate-[-9deg] overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur sm:block"><ImageWithFallback src={supportingImage} alt={supportingFood?.name || 'Featured food'} className="h-24 w-full rounded-xl object-cover" /><p className="px-1 pb-1 pt-2 text-[9px] font-bold text-white">{supportingFood?.name || 'A dish worth sharing'}</p></div>
              <div className="bm-float bm-float-delay absolute bottom-[10%] right-[3%] hidden w-36 rotate-[8deg] overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur sm:block"><ImageWithFallback src={heroImage} alt={heroFood?.name || 'Signature dish'} className="h-28 w-full rounded-xl object-cover" /><div className="flex items-center justify-between px-1 pb-1 pt-2 text-[9px] font-bold text-white"><span>Top pick</span><span className="flex items-center gap-1 text-[#f3b562]"><Star className="h-2.5 w-2.5 fill-current" />{heroFood?.rating?.toFixed(1) || '4.9'}</span></div></div>
              <div className="bm-float-slow absolute left-1/2 top-1/2 w-[76%] -translate-x-1/2 -translate-y-1/2 rotate-[3deg] overflow-hidden rounded-[32px] border border-[#f7efe6]/40 bg-[#1b2026] p-2 shadow-[0_34px_100px_rgba(0,0,0,.46)] sm:w-[68%]"><div className="relative overflow-hidden rounded-[25px]"><ImageWithFallback src={heroImage} alt={heroFood?.name || 'BM Food showcase'} className="h-64 w-full object-cover sm:h-80" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 right-4"><div className="mb-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[.12em] text-[#f7efe6]"><span>Signature selection</span><span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{heroFood?.rating?.toFixed(1) || 'Curated'}</span></div><p className="bm-display text-2xl text-white sm:text-3xl">{heroFood?.name || 'A table worth slowing down for'}</p><p className="mt-1 text-[10px] text-[#c9beb4]">{heroFood ? `From ${restaurants.find((item) => item.id === heroFood.restaurantId)?.name || 'a verified kitchen'}` : 'Premium dishes from verified kitchens'}</p></div></div></div>
              <div className="absolute left-[8%] top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#f3b562] shadow-xl backdrop-blur"><Utensils className="h-5 w-5" /></div>
              <div className="absolute right-[6%] top-[23%] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[#8fa48c] shadow-xl backdrop-blur"><Heart className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="absolute bottom-5 right-6 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/45 sm:flex"><Compass className="h-3.5 w-3.5" /> Move your cursor through the plate</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {banners.length > 0 ? <div className="grid gap-4 md:grid-cols-3">{banners.slice(0, 3).map((banner) => <button key={banner.id} onClick={() => setCurrentView('restaurants')} className="group relative min-h-36 overflow-hidden rounded-2xl text-left shadow-[var(--bm-shadow)]"><ImageWithFallback src={banner.imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" /><span className="absolute bottom-4 left-4 right-4 text-white"><span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f7efe6]">Limited offer</span><span className="mt-1 block text-base font-extrabold">{banner.title}</span><span className="mt-1 block text-xs text-white/70">{banner.subtitle}</span></span></button>)}</div> : <div className="bm-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="bm-eyebrow">Offers</p><p className="mt-1 text-sm font-bold text-[var(--bm-ink)]">Fresh offers will appear here as soon as Operations publishes them.</p></div><button className="bm-button-secondary shrink-0" onClick={() => setCurrentView('restaurants')}>Explore kitchens <ArrowRight className="h-3.5 w-3.5" /></button></div>}
      </section>

      <section id="trending-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="bm-eyebrow">01 / Today’s Collection</p><h2 className="bm-display mt-2 text-4xl text-[var(--bm-ink)] sm:text-5xl">Made for the moment.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--bm-ink-soft)]">A live edit from BM Food Operations, refreshed directly from the published Firestore menu.</p></div><button onClick={() => setCurrentView('restaurants')} className="hidden items-center gap-2 text-xs font-extrabold text-[var(--bm-terracotta)] sm:flex">See all restaurants <ArrowRight className="h-4 w-4" /></button></div>
        {curatedFoods.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{curatedFoods.slice(0, 4).map((food) => <FoodCard key={food.id} food={food} restaurantName={restaurants.find((restaurant) => restaurant.id === food.restaurantId)?.name} onOpenDetail={onOpenDetailFood} />)}</div> : <div className="bm-card p-10 text-center"><p className="text-sm font-bold text-[var(--bm-ink)]">Today’s Collection is empty.</p><p className="mt-2 text-xs text-[var(--bm-ink-soft)]">Admin-published dishes will appear here automatically once the collection is configured.</p></div>}
      </section>

      <section id="categories-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="bm-eyebrow">02 / Explore</p><h2 className="bm-display mt-2 text-4xl text-[var(--bm-ink)] sm:text-5xl">Follow the flavor.</h2></div>{selectedCategory && <button onClick={() => { setSelectedCategory(null); onSelectCategory(''); }} className="text-xs font-extrabold text-[var(--bm-terracotta)]">Clear selection</button>}</div>
        {categories.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.slice(0, 6).map((category) => { const active = selectedCategory === category.id; return <button key={category.id} onClick={() => { setSelectedCategory(active ? null : category.id); onSelectCategory(category.id); }} className={`group relative min-h-32 overflow-hidden rounded-2xl border text-left transition duration-200 hover:-translate-y-1 ${active ? 'border-[var(--bm-terracotta)] ring-2 ring-[var(--bm-terracotta)]/20' : 'border-[var(--bm-line)]'}`}><ImageWithFallback src={category.imageUrl} alt={category.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className={`absolute inset-0 ${active ? 'bg-[var(--bm-terracotta)]/70' : 'bg-black/40 group-hover:bg-black/50'}`} /><span className="absolute bottom-3 left-3 right-3 text-white"><span className="block text-sm font-extrabold">{category.name}</span><span className="mt-1 block truncate text-[10px] text-white/70">{category.description}</span></span></button>; })}</div> : <div className="bm-card p-8 text-center text-sm text-[var(--bm-ink-soft)]">Live categories will appear once they are published.</div>}
      </section>

      <section id="restaurants-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="bm-eyebrow">03 / Featured restaurants</p><h2 className="bm-display mt-2 text-4xl text-[var(--bm-ink)] sm:text-5xl">Kitchens with a point of view.</h2></div><button onClick={() => setCurrentView('restaurants')} className="flex items-center gap-2 text-xs font-extrabold text-[var(--bm-terracotta)]">View all <ChevronRight className="h-4 w-4" /></button></div>
        {featuredRestaurants.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredRestaurants.slice(0, 3).map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={onSelectRestaurant} />)}</div> : <div className="bm-card p-10 text-center"><p className="text-sm font-bold text-[var(--bm-ink)]">No featured restaurants are published yet.</p><p className="mt-2 text-xs text-[var(--bm-ink-soft)]">Verified kitchens will appear here when Operations marks them featured.</p></div>}
      </section>

      <section className="mx-4 overflow-hidden rounded-[28px] bg-[#14181d] sm:mx-6 lg:mx-10"><div className="grid items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[.8fr_1.2fr] lg:px-16 lg:py-16"><div className="space-y-5"><p className="bm-eyebrow">04 / Signature food</p><h2 className="bm-display text-5xl leading-none text-[#f7efe6] sm:text-6xl">Good food has a place in the story.</h2><p className="max-w-md text-sm leading-7 text-[#b7aaa0]">From old Dhaka comfort to new-school indulgence, BM Food brings the city’s best kitchens to your door with the attention they deserve.</p><button className="bm-button" onClick={() => document.getElementById('food-menu-section')?.scrollIntoView({ behavior: 'smooth' })}>Browse the menu <ArrowRight className="h-4 w-4" /></button></div><div className="relative min-h-[330px]"><div className="absolute right-0 top-4 h-64 w-[84%] rotate-3 overflow-hidden rounded-[28px] shadow-2xl sm:h-80"><ImageWithFallback src={supportingImage} alt={supportingFood?.name || 'Signature food'} className="h-full w-full object-cover" /></div><div className="absolute bottom-0 left-0 h-48 w-[48%] -rotate-6 overflow-hidden rounded-[24px] border-8 border-[#14181d] shadow-xl sm:h-56"><ImageWithFallback src={heroImage} alt={heroFood?.name || 'Signature food detail'} className="h-full w-full object-cover" /></div><div className="absolute left-[42%] top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-[#f3b562] bg-[#1b2026]/90 text-[#d93d0b] shadow-lg"><Sparkles className="h-6 w-6" /></div></div></div></section>

      <section id="food-menu-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="bm-eyebrow">05 / The menu</p><h2 className="bm-display mt-2 text-4xl text-[var(--bm-ink)] sm:text-5xl">Find your next order.</h2><p className="mt-2 text-sm text-[var(--bm-ink-soft)]">{filteredFoods.length} live dishes {selectedCategory ? 'in this category' : 'available to explore'}</p></div><button onClick={clearFilters} className="text-xs font-extrabold text-[var(--bm-terracotta)]">Reset filters</button></div>{filteredFoods.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{filteredFoods.map((food) => <FoodCard key={food.id} food={food} restaurantName={restaurants.find((restaurant) => restaurant.id === food.restaurantId)?.name} onOpenDetail={onOpenDetailFood} />)}</div> : <div className="bm-card p-10 text-center"><Search className="mx-auto h-8 w-8 text-[var(--bm-terracotta)]" /><p className="mt-3 text-sm font-bold text-[var(--bm-ink)]">No live dishes match that search.</p><p className="mt-2 text-xs text-[var(--bm-ink-soft)]">Try another phrase or clear the filters.</p><button className="bm-button mt-5" onClick={clearFilters}>Show all dishes</button></div>}</section>

      <section className="border-y border-[var(--bm-line)] bg-[var(--bm-paper-strong)] py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-8 max-w-xl"><p className="bm-eyebrow">06 / The rhythm</p><h2 className="bm-display mt-2 text-4xl text-[var(--bm-ink)] sm:text-5xl">Choose. Order. Enjoy.</h2></div><div className="grid gap-4 md:grid-cols-3"><div className="bm-card p-6"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#232a31] text-sm font-extrabold text-[var(--bm-terracotta)]">01</span><Compass className="h-5 w-5 text-[var(--bm-brass)]" /></div><h3 className="mt-8 text-base font-extrabold">Choose a kitchen</h3><p className="mt-2 text-xs leading-6 text-[var(--bm-ink-soft)]">Explore real menus and find a dish that fits the moment.</p></div><div className="bm-card p-6"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b2026] text-sm font-extrabold text-[var(--bm-sage)]">02</span><Utensils className="h-5 w-5 text-[var(--bm-sage)]" /></div><h3 className="mt-8 text-base font-extrabold">Place your order</h3><p className="mt-2 text-xs leading-6 text-[var(--bm-ink-soft)]">Review the delivery details, select a configured payment method, and confirm.</p></div><div className="bm-card p-6"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#232a31] text-sm font-extrabold text-[var(--bm-brass)]">03</span><Bike className="h-5 w-5 text-[var(--bm-brass)]" /></div><h3 className="mt-8 text-base font-extrabold">Enjoy the arrival</h3><p className="mt-2 text-xs leading-6 text-[var(--bm-ink-soft)]">Follow the live status from kitchen to doorstep.</p></div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[26px] bg-[#0b0e11] p-8 text-[#f7efe6] sm:p-10"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f3b562]">07 / Customer notes</p><h2 className="bm-display mt-5 text-4xl">A better way to eat around the city.</h2><p className="mt-4 text-sm leading-7 text-[#c9beb4]">{userProfile ? `Welcome back, ${userProfile.name}. Your next order is closer than you think.` : 'A thoughtful marketplace for the dishes, kitchens, and rituals that make Dhaka feel like home.'}</p><button className="bm-button mt-7" onClick={() => setCurrentView(userProfile ? 'user-orders' : 'restaurants')}>{userProfile ? 'See your orders' : 'Start exploring'} <ArrowRight className="h-4 w-4" /></button></div><div className="bm-card p-8 sm:p-10"><div className="flex items-center justify-between"><div><p className="bm-eyebrow">Verified reviews</p><h3 className="bm-display mt-2 text-3xl text-[var(--bm-ink)]">What people are saying.</h3></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#232a31] text-[var(--bm-terracotta)]"><Star className="h-5 w-5 fill-current" /></div></div>{reviews.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-3">{reviews.map((review) => <div key={review.id} className="border-l-2 border-[var(--bm-line)] pl-4"><div className="flex gap-0.5 text-[var(--bm-brass)]">{Array.from({ length: Math.min(5, review.rating) }).map((_, index) => <Star key={index} className="h-3 w-3 fill-current" />)}</div><p className="mt-3 line-clamp-4 text-xs leading-6 text-[var(--bm-ink-soft)]">“{review.comment}”</p><p className="mt-3 text-[10px] font-extrabold text-[var(--bm-ink)]">{review.userName || 'Verified customer'}</p></div>)}</div> : <div className="mt-8 rounded-2xl bg-[var(--bm-paper)] p-6 text-sm text-[var(--bm-ink-soft)]"><Check className="mb-3 h-5 w-5 text-[var(--bm-sage)]" />Verified customer reviews will appear here as orders are completed.</div>}</div></div></section>

      <section className="mx-4 overflow-hidden rounded-[28px] bg-[#1b2026] px-6 py-12 text-[#f7efe6] sm:mx-6 sm:px-10 lg:mx-10 lg:px-16"><div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ff5a1f]">08 / Your table awaits</p><h2 className="bm-display mt-3 text-5xl leading-none sm:text-6xl">Make the next meal memorable.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#b7aaa0]">Browse the kitchens, discover the dish, and let BM Food take care of the distance.</p></div><button className="bm-button" onClick={() => setCurrentView('restaurants')}>Explore restaurants <ArrowRight className="h-4 w-4" /></button></div></section>
    </div>
  );
};
