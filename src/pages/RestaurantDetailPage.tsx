import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Restaurant, Food, Category, Review } from '../types';
import { FoodCard } from '../components/FoodCard';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Star, Clock, Bike, MapPin, Phone, ArrowLeft, Search, CheckCircle } from 'lucide-react';

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
  onOpenDetailFood: (food: Food) => void;
}

export const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({
  restaurantId,
  onBack,
  onOpenDetailFood,
}) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const rDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (!rDoc.exists()) throw new Error('Restaurant not found.');
        const foodSnap = await getDocs(query(collection(db, 'foods'), where('restaurantId', '==', restaurantId), where('isAvailable', '==', true)));
        const categorySnap = await getDocs(query(collection(db, 'categories'), where('isActive', '==', true)));
        const reviewSnap = await getDocs(query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId), where('isVisible', '==', true)));
        if (!active) return;
        setRestaurant({ id: rDoc.id, ...rDoc.data() } as Restaurant);
        setFoods(foodSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Food)));
        setCategories(categorySnap.docs.map((item) => ({ id: item.id, ...item.data() } as Category)).sort((a, b) => a.sortOrder - b.sortOrder));
        setReviews(reviewSnap.docs.map((item) => ({ id: item.id, ...item.data() } as Review)));
      } catch (loadErrorValue) {
        console.error('Unable to load restaurant detail:', loadErrorValue);
        if (active) {
          setRestaurant(null);
          setFoods([]);
          setCategories([]);
          setReviews([]);
          setLoadError(loadErrorValue instanceof Error ? loadErrorValue.message : 'Restaurant data is unavailable.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [restaurantId]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center"><p className="text-neutral-500 font-bold">Loading restaurant details...</p></div>;
  }

  if (!restaurant) {
    return <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-neutral-100 text-center space-y-3"><p className="text-red-600 font-bold">{loadError || 'Restaurant not found.'}</p><button onClick={onBack} className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs">Back to Restaurants</button></div>;
  }

  const filteredFoods = foods.filter((f) => {
    const matchCat = selectedCatId === 'all' || f.categoryId === selectedCatId;
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bm-shell min-h-[calc(100vh-72px)] space-y-8 pb-16">
      
      {/* Back button & Cover header */}
      <div className="relative h-64 sm:h-80 w-full bg-[#0b0e11] overflow-hidden">
        <ImageWithFallback
          src={restaurant.coverImageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/40 to-transparent" />

        <div className="absolute top-4 left-4 z-10 max-w-7xl mx-auto w-full">
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Restaurants
          </button>
        </div>

        {/* Restaurant Header Overlay */}
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-xl shrink-0">
              <ImageWithFallback
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{restaurant.name}</h1>
                <span className="bg-[var(--bm-basil)] text-[var(--bm-ink-deep)] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Verified
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-1">{restaurant.description}</p>
              <div className="flex items-center gap-2 text-xs text-neutral-300 mt-2">
                <MapPin className="w-3.5 h-3.5 text-[var(--bm-ember)]" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-3 text-xs bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl shrink-0">
            <div className="text-center px-2">
              <div className="text-[var(--bm-saffron)] font-extrabold text-base flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-[var(--bm-saffron)]" />
                {restaurant.rating.toFixed(1)}
              </div>
              <span className="text-[10px] text-neutral-300">{restaurant.reviewCount} reviews</span>
            </div>

            <div className="w-px h-8 bg-white/20" />

            <div className="text-center px-2">
              <div className="font-extrabold text-white text-base flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-[var(--bm-ember)]" />
                {restaurant.estimatedDeliveryTime}m
              </div>
              <span className="text-[10px] text-neutral-300">Delivery Time</span>
            </div>

            <div className="w-px h-8 bg-white/20" />

            <div className="text-center px-2">
              <div className="font-extrabold text-white text-base flex items-center justify-center gap-1">
                <Bike className="w-4 h-4 text-[var(--bm-ember)]" />
                ৳{restaurant.deliveryFee}
              </div>
              <span className="text-[10px] text-neutral-300">Delivery Fee</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Category Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCatId === 'all'
                  ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Menu Items ({foods.length})
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCatId === c.id
                    ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search within menu */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

        </div>

        {/* Menu Items Grid */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Menu Dishes ({filteredFoods.length})
          </h2>

          {filteredFoods.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-neutral-100">
              <p className="font-bold text-neutral-600">No dishes found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  restaurantName={restaurant.name}
                  onOpenDetail={onOpenDetailFood}
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
