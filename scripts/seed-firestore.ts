import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_FOODS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_RESTAURANTS,
  INITIAL_REVIEWS,
  INITIAL_RIDERS,
  INITIAL_SETTINGS,
} from '../src/lib/seedData';

const projectId = process.env.FIREBASE_PROJECT_ID || 'bm-food-d04b1';
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON file before running the seed script.');
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf8'));
const app = getApps()[0] || initializeApp({ projectId, credential: cert(serviceAccount) });
const firestore = getFirestore(app);

const upsertMany = async (collectionName: string, records: Array<Record<string, unknown> & { id: string }>) => {
  for (let start = 0; start < records.length; start += 400) {
    const batch = firestore.batch();
    records.slice(start, start + 400).forEach((record) => {
      const { id, ...data } = record;
      batch.set(firestore.collection(collectionName).doc(id), {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }
};

const restaurantNames = ['Dhanmondi Kitchen', 'Gulshan Table', 'Banani Smokehouse', 'Uttara Oven', 'Mirpur Bites', 'Old Dhaka Feast', 'Lalbagh Curry Club'];
const categoryNames = ['Chicken', 'Desserts', 'Drinks', 'Asian Bowls', 'Healthy', 'Breakfast', 'Seafood'];

const restaurants = Array.from({ length: 12 }, (_, index) => {
  const base = INITIAL_RESTAURANTS[index % INITIAL_RESTAURANTS.length];
  return {
    ...base,
    id: index < INITIAL_RESTAURANTS.length ? base.id : `rest-${index + 1}`,
    slug: index < INITIAL_RESTAURANTS.length ? base.slug : `bm-food-kitchen-${index + 1}`,
    name: index < INITIAL_RESTAURANTS.length ? base.name : `${restaurantNames[index % restaurantNames.length]} ${index + 1}`,
    isFeatured: index < 6,
    status: 'active' as const,
    ownerId: base.ownerId || null,
  };
});

const categories = Array.from({ length: 12 }, (_, index) => {
  const base = INITIAL_CATEGORIES[index % INITIAL_CATEGORIES.length];
  return {
    ...base,
    id: index < INITIAL_CATEGORIES.length ? base.id : `cat-${index + 1}`,
    slug: index < INITIAL_CATEGORIES.length ? base.slug : `category-${index + 1}`,
    name: index < INITIAL_CATEGORIES.length ? base.name : categoryNames[index % categoryNames.length],
    sortOrder: index + 1,
    isActive: true,
  };
});

const foods = Array.from({ length: 80 }, (_, index) => {
  const base = INITIAL_FOODS[index % INITIAL_FOODS.length];
  const restaurant = restaurants[index % restaurants.length];
  const category = categories[index % categories.length];
  const isBase = index < INITIAL_FOODS.length;
  return {
    ...base,
    id: isBase ? base.id : `food-${index + 1}`,
    slug: isBase ? base.slug : `bm-food-dish-${index + 1}`,
    name: isBase ? base.name : `${base.name} · ${restaurant.name}`,
    restaurantId: restaurant.id,
    categoryId: category.id,
    isAvailable: true,
    isFeatured: index < 24,
    isPopular: index < 32,
    isTodaysSpecial: index < 15,
    options: base.options || [],
  };
});

const coupons = Array.from({ length: 10 }, (_, index) => {
  const base = INITIAL_COUPONS[index % INITIAL_COUPONS.length];
  return {
    ...base,
    id: index < INITIAL_COUPONS.length ? base.id : `coupon-bm-${index + 1}`,
    code: index < INITIAL_COUPONS.length ? base.code : `BMFOOD${index + 1}0`,
    isActive: true,
  };
});

const reviews = Array.from({ length: 12 }, (_, index) => {
  const base = INITIAL_REVIEWS[index % INITIAL_REVIEWS.length];
  const restaurant = restaurants[index % restaurants.length];
  return {
    ...base,
    id: index < INITIAL_REVIEWS.length ? base.id : `review-${index + 1}`,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    orderId: base.orderId || `seed-order-${index + 1}`,
    isVisible: true,
    foodRating: base.foodRating || base.rating,
    packagingRating: base.packagingRating || base.rating,
    deliveryRating: base.deliveryRating || base.rating,
    valueRating: base.valueRating || base.rating,
  };
});

const riders = INITIAL_RIDERS.map((rider) => ({
  ...rider,
  id: rider.id,
  completedDeliveries: rider.completedDeliveries || rider.totalDeliveries,
  cancelledDeliveries: rider.cancelledDeliveries || 0,
  averageDeliveryMinutes: rider.averageDeliveryMinutes || 31,
}));

const notifications = INITIAL_NOTIFICATIONS.map((notification) => ({
  ...notification,
  targetAudience: notification.targetAudience || 'all',
}));

const foodIds = foods.slice(0, 15).map((food) => food.id);

await upsertMany('restaurants', restaurants as any);
await upsertMany('categories', categories as any);
await upsertMany('foods', foods as any);
await upsertMany('coupons', coupons as any);
await upsertMany('paymentMethods', INITIAL_PAYMENT_METHODS.map((method) => ({ ...method, isEnabled: method.type !== 'gateway' })) as any);
await upsertMany('banners', INITIAL_BANNERS as any);
await upsertMany('reviews', reviews as any);
await upsertMany('riders', riders as any);
await upsertMany('notifications', notifications as any);

await firestore.doc('settings/general').set({
  ...INITIAL_SETTINGS,
  id: 'general',
  orderCancellationWindowMinutes: 10,
  rewardPointsRate: 1,
  referralReward: 50,
  platformCommissionPercentage: 10,
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

await firestore.doc('homepageCollections/todays').set({
  id: 'todays',
  title: "Today's Collection",
  subtitle: 'A fresh edit from the BM Food kitchens.',
  foodIds,
  isActive: true,
  startDate: new Date().toISOString(),
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true });

console.log(JSON.stringify({ projectId, restaurants: restaurants.length, categories: categories.length, foods: foods.length, coupons: coupons.length, paymentMethods: INITIAL_PAYMENT_METHODS.length, reviews: reviews.length, riders: riders.length, notifications: notifications.length, todaysCollection: foodIds.length }, null, 2));
