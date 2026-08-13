import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { writeAdminAuditLog } from '../../lib/adminAudit';
import { useAuth } from '../../contexts/AuthContext';
import {
  Food,
  FoodOptionGroup,
  Restaurant,
  Order,
  PaymentMethodConfig,
  Category,
  UserProfile,
  Coupon,
  DeliveryRider,
  Review,
  AppNotification,
  Banner,
} from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { isCashOrder, recognizedRevenue } from '../../lib/orderMath';
import { AdminUsersTab } from '../../components/admin/AdminUsersTab';
import { AdminCategoriesTab } from '../../components/admin/AdminCategoriesTab';
import { AdminCouponsTab } from '../../components/admin/AdminCouponsTab';
import { AdminRidersTab } from '../../components/admin/AdminRidersTab';
import { AdminReviewsTab } from '../../components/admin/AdminReviewsTab';
import { AdminNotificationsTab } from '../../components/admin/AdminNotificationsTab';
import { AdminBannersTab } from '../../components/admin/AdminBannersTab';
import { AdminSettingsTab } from '../../components/admin/AdminSettingsTab';
import { AdminGatewayTab } from '../../components/admin/AdminGatewayTab';
import { AdminOperationsTab } from '../../components/admin/AdminOperationsTab';
import { AdminOverviewCharts } from '../../components/admin/AdminOverviewCharts';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Bike,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Settings,
  CreditCard,
  ChefHat,
  Filter,
  Eye,
  Tag,
  Shield,
  Bell,
  Layout,
  MessageSquare,
  Lock,
  UserCheck,
  RefreshCw,
  Clock,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';

type AdminTab = 'overview' | 'orders' | 'foods' | 'restaurants' | 'categories' | 'users' | 'payments' | 'gateway' | 'coupons' | 'riders' | 'reviews' | 'notifications' | 'banners' | 'settings' | 'analytics' | 'todays' | 'payouts' | 'audit-logs';
interface AdminDashboardProps { initialTab?: string; }
const normalizeAdminTab = (value?: string): AdminTab => (['overview', 'orders', 'foods', 'restaurants', 'categories', 'users', 'payments', 'gateway', 'coupons', 'riders', 'reviews', 'notifications', 'banners', 'settings', 'analytics', 'todays', 'payouts', 'audit-logs'].includes(value || '') ? value as AdminTab : 'overview');

const ADMIN_NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: Layout },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'foods', label: 'Food menu', icon: ChefHat },
  { key: 'restaurants', label: 'Kitchens', icon: Store },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'gateway', label: 'Gateway', icon: Zap },
  { key: 'coupons', label: 'Coupons', icon: Tag },
  { key: 'riders', label: 'Riders', icon: Bike },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare },
  { key: 'notifications', label: 'Broadcasts', icon: Bell },
  { key: 'banners', label: 'Banners', icon: Layout },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'analytics', label: 'Analytics', icon: DollarSign },
  { key: 'todays', label: 'Today’s collection', icon: ChefHat },
  { key: 'payouts', label: 'Payouts', icon: CreditCard },
  { key: 'audit-logs', label: 'Audit logs', icon: Shield },
] as const;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab }) => {
  const { currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>(normalizeAdminTab(initialTab));
  const [navCollapsed, setNavCollapsed] = useState(false);

  const scrollAdminToTop = () => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }
  };

  const selectAdminTab = (tab: AdminTab) => {
    setActiveTab(tab);
    scrollAdminToTop();
  };

  const toggleAdminNavigation = () => {
    setNavCollapsed((collapsed) => !collapsed);
    scrollAdminToTop();
  };

  // Datasets
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [loading, setLoading] = useState(true);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // Search & Filter state for Orders
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search & Filter state for Foods
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('all');
  const [foodRestaurantFilter, setFoodRestaurantFilter] = useState('all');

  // Food Form Modal
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodPrice, setFoodPrice] = useState<number>(250);
  const [foodDiscount, setFoodDiscount] = useState<number | ''>('');
  const [foodImageUrl, setFoodImageUrl] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [foodRestaurant, setFoodRestaurant] = useState('');
  const [foodPrepTime, setFoodPrepTime] = useState(20);
  const [foodAvailable, setFoodAvailable] = useState(true);
  const [foodFeatured, setFoodFeatured] = useState(false);
  const [foodPopular, setFoodPopular] = useState(false);
  const [foodTodaysSpecial, setFoodTodaysSpecial] = useState(false);
  const [foodOptionsJson, setFoodOptionsJson] = useState('[]');

  // Restaurant Form Modal
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [editingRest, setEditingRest] = useState<Restaurant | null>(null);
  const [restName, setRestName] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restLogoUrl, setRestLogoUrl] = useState('');
  const [restCoverUrl, setRestCoverUrl] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restPhone, setRestPhone] = useState('');
  const [restFee, setRestFee] = useState(50);
  const [restMinOrder, setRestMinOrder] = useState(200);
  const [restIsOpen, setRestIsOpen] = useState(true);
  const [restIsFeatured, setRestIsFeatured] = useState(true);

  // Load all collections
  const refreshAllData = async () => {
    if (!currentUser || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSeedStatus(null);
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));

      const foodSnap = await getDocs(collection(db, 'foods'));
      setFoods(foodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Food)));

      const restSnap = await getDocs(collection(db, 'restaurants'));
      setRestaurants(restSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Restaurant)));

      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));

      const pmSnap = await getDocs(collection(db, 'paymentMethods'));
      setPaymentMethods(pmSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentMethodConfig)));

      const userSnap = await getDocs(collection(db, 'users'));
      setUsers(userSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));

      const riderSnap = await getDocs(collection(db, 'riders'));
      setRiders(riderSnap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryRider)));

      const revSnap = await getDocs(collection(db, 'reviews'));
      setReviews(revSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));

      const notifSnap = await getDocs(collection(db, 'notifications'));
      setNotifications(notifSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));

      const bannerSnap = await getDocs(collection(db, 'banners'));
      setBanners(bannerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner)));

    } catch (e) {
      console.error('Unable to load live admin data:', e);
      setOrders([]);
      setFoods([]);
      setRestaurants([]);
      setCategories([]);
      setPaymentMethods([]);
      setUsers([]);
      setRiders([]);
      setReviews([]);
      setNotifications([]);
      setBanners([]);
      setSeedStatus('Live admin data could not be loaded. Check your connection and permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentUser, isAdmin]);

  // Food Save
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodImageUrl || !foodRestaurant || !foodCategory) {
      alert("Please fill all required fields, including external Image URL.");
      return;
    }

    let parsedOptions: FoodOptionGroup[] = [];
    try {
      const rawOptions = JSON.parse(foodOptionsJson || '[]');
      if (!Array.isArray(rawOptions)) throw new Error('Options must be a JSON array.');
      parsedOptions = rawOptions as FoodOptionGroup[];
    } catch {
      alert('Food options must be a valid JSON array.');
      return;
    }

    const foodData: Food = {
      id: editingFood ? editingFood.id : `food-${Date.now()}`,
      name: foodName,
      slug: foodName.toLowerCase().replace(/\s+/g, '-'),
      description: foodDesc,
      price: Number(foodPrice),
      discountPrice: foodDiscount !== '' ? Number(foodDiscount) : null,
      imageUrl: foodImageUrl,
      categoryId: foodCategory,
      restaurantId: foodRestaurant,
      rating: editingFood ? editingFood.rating : 4.8,
      reviewCount: editingFood ? editingFood.reviewCount : 1,
      preparationTime: Number(foodPrepTime),
      isAvailable: foodAvailable,
      isFeatured: foodFeatured,
      isPopular: foodPopular,
      isTodaysSpecial: foodTodaysSpecial,
      tags: editingFood?.tags || ['Chef Special', 'Fresh'],
      options: parsedOptions,
    };

    try {
      await setDoc(doc(db, 'foods', foodData.id), foodData);
      setFoodModalOpen(false);
      refreshAllData();
    } catch (err) {
      console.error(err);
      alert("Error saving food item");
    }
  };

  const openEditFood = (food: Food) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodDesc(food.description);
    setFoodPrice(food.price);
    setFoodDiscount(food.discountPrice ?? '');
    setFoodImageUrl(food.imageUrl);
    setFoodCategory(food.categoryId);
    setFoodRestaurant(food.restaurantId);
    setFoodPrepTime(food.preparationTime);
    setFoodAvailable(food.isAvailable);
    setFoodFeatured(food.isFeatured);
    setFoodPopular(Boolean(food.isPopular));
    setFoodTodaysSpecial(Boolean(food.isTodaysSpecial));
    setFoodOptionsJson(JSON.stringify(food.options || [], null, 2));
    setFoodModalOpen(true);
  };

  const openNewFood = () => {
    setEditingFood(null);
    setFoodName('');
    setFoodDesc('');
    setFoodPrice(250);
    setFoodDiscount('');
    setFoodImageUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80');
    setFoodCategory(categories[0]?.id || 'cat-biryani');
    setFoodRestaurant(restaurants[0]?.id || 'rest-kacchi-express');
    setFoodPrepTime(20);
    setFoodAvailable(true);
    setFoodFeatured(false);
    setFoodPopular(false);
    setFoodTodaysSpecial(false);
    setFoodOptionsJson('[]');
    setFoodModalOpen(true);
  };

  const handleDeleteFood = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      await deleteDoc(doc(db, 'foods', id));
      refreshAllData();
    }
  };

  // Restaurant Save
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName || !restLogoUrl || !restAddress) {
      alert("Please enter restaurant name, logo URL, and address.");
      return;
    }

    const restData: Restaurant = {
      id: editingRest ? editingRest.id : `rest-${Date.now()}`,
      name: restName,
      slug: restName.toLowerCase().replace(/\s+/g, '-'),
      description: restDesc,
      logoUrl: restLogoUrl,
      coverImageUrl: restCoverUrl || restLogoUrl,
      cuisineTypes: ['Biryani', 'Traditional'],
      address: restAddress,
      phone: restPhone,
      rating: editingRest ? editingRest.rating : 4.8,
      reviewCount: editingRest ? editingRest.reviewCount : 50,
      deliveryFee: Number(restFee),
      minimumOrder: Number(restMinOrder),
      estimatedDeliveryTime: 30,
      isOpen: restIsOpen,
      isFeatured: restIsFeatured,
      status: 'active',
    };

    try {
      await setDoc(doc(db, 'restaurants', restData.id), restData);
      setRestModalOpen(false);
      refreshAllData();
    } catch (err) {
      console.error(err);
      alert("Error saving restaurant.");
    }
  };

  const openNewRestaurant = () => {
    setEditingRest(null);
    setRestName('');
    setRestDesc('');
    setRestLogoUrl('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80');
    setRestCoverUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1000&auto=format&fit=crop&q=80');
    setRestAddress('Dhanmondi, Dhaka');
    setRestPhone('+8801700112233');
    setRestFee(50);
    setRestMinOrder(200);
    setRestIsOpen(true);
    setRestIsFeatured(true);
    setRestModalOpen(true);
  };

  const openEditRestaurant = (r: Restaurant) => {
    setEditingRest(r);
    setRestName(r.name);
    setRestDesc(r.description);
    setRestLogoUrl(r.logoUrl);
    setRestCoverUrl(r.coverImageUrl);
    setRestAddress(r.address);
    setRestPhone(r.phone);
    setRestFee(r.deliveryFee);
    setRestMinOrder(r.minimumOrder);
    setRestIsOpen(r.isOpen);
    setRestIsFeatured(r.isFeatured);
    setRestModalOpen(true);
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this restaurant kitchen?")) {
      await deleteDoc(doc(db, 'restaurants', id));
      refreshAllData();
    }
  };

  // Order Updates
  const handleUpdateOrderStatus = async (orderId: string, orderStatus: string) => {
    const previousOrder = orders.find((item) => item.id === orderId);
    const shouldSettleCash = orderStatus === 'delivered' && previousOrder ? isCashOrder(previousOrder) && previousOrder.paymentStatus !== 'paid' : false;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus,
        ...(shouldSettleCash ? { paymentStatus: 'paid' } : {}),
        updatedAt: serverTimestamp(),
      });
      if (shouldSettleCash && previousOrder?.paymentId) {
        await updateDoc(doc(db, 'payments', previousOrder.paymentId), { status: 'paid', verifiedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      void writeAdminAuditLog({ adminId: currentUser?.uid || 'unknown', action: shouldSettleCash ? 'order_delivered_cash_collected' : 'order_status_changed', targetType: 'order', targetId: orderId, previousValue: { orderStatus: previousOrder?.orderStatus, paymentStatus: previousOrder?.paymentStatus }, newValue: { orderStatus, ...(shouldSettleCash ? { paymentStatus: 'paid' } : {}) } }).catch((auditError) => console.warn('Audit log write failed:', auditError));
    } catch (e) {
      console.warn("Firestore update blocked:", e);
    }
    refreshAllData();
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    const r = riders.find((rd) => rd.id === riderId);
    const previousOrder = orders.find((item) => item.id === orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        riderId,
        riderName: r?.name || 'Rider',
        riderPhone: r?.phone || '',
        updatedAt: serverTimestamp(),
      });
      void writeAdminAuditLog({ adminId: currentUser?.uid || 'unknown', action: 'rider_assigned', targetType: 'order', targetId: orderId, previousValue: { riderId: previousOrder?.riderId || null }, newValue: { riderId, riderName: r?.name || 'Rider' } }).catch((auditError) => console.warn('Audit log write failed:', auditError));
    } catch (e) {
      console.warn("Firestore update blocked:", e);
    }
    refreshAllData();
  };

  const handleApprovePayment = async (orderId: string, approve: boolean) => {
    const nextStatus = approve ? 'paid' : 'rejected';
    const previousOrder = orders.find((item) => item.id === orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      const order = orders.find((item) => item.id === orderId);
      if (order?.paymentId) {
        await updateDoc(doc(db, 'payments', order.paymentId), {
          status: nextStatus,
          verifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const paymentSnapshot = await getDocs(query(collection(db, 'payments'), where('orderId', '==', orderId)));
        await Promise.all(paymentSnapshot.docs.map((payment) => updateDoc(payment.ref, {
          status: nextStatus,
          verifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })));
      }
      void writeAdminAuditLog({ adminId: currentUser?.uid || 'unknown', action: approve ? 'payment_verified' : 'payment_rejected', targetType: 'order', targetId: orderId, previousValue: { paymentStatus: previousOrder?.paymentStatus }, newValue: { paymentStatus: nextStatus } }).catch((auditError) => console.warn('Audit log write failed:', auditError));
    } catch (e) {
      console.warn('Payment approval update failed:', e);
      setSeedStatus('Payment status could not be updated.');
    }
    await refreshAllData();
  };

  const handleSavePaymentMethod = async (method: PaymentMethodConfig) => {
    setSavingPaymentId(method.id);
    const safeMethod = method.type === 'gateway' ? { ...method, isEnabled: false } : method;
    const previousMethod = paymentMethods.find((item) => item.id === method.id);
    try {
      await setDoc(doc(db, 'paymentMethods', method.id), {
        ...safeMethod,
        sortOrder: Number(safeMethod.sortOrder),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setPaymentMethods((previous) => previous.map((item) => item.id === safeMethod.id ? safeMethod : item));
      void writeAdminAuditLog({ adminId: currentUser?.uid || 'unknown', action: 'payment_method_updated', targetType: 'paymentMethod', targetId: method.id, previousValue: previousMethod, newValue: safeMethod }).catch((auditError) => console.warn('Audit log write failed:', auditError));
      setSeedStatus(`${safeMethod.name} payment settings saved.`);
    } catch (saveError) {
      console.error('Unable to save payment method:', saveError);
      setSeedStatus('Payment settings could not be saved.');
    } finally {
      setSavingPaymentId(null);
      await refreshAllData();
    }
  };

  // Metrics
  const deliveredCashRevenue = orders.filter((order) => order.orderStatus === 'delivered' && isCashOrder(order)).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalRevenue = recognizedRevenue(orders);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'cancelled').length;
  const manualPendingPayments = orders.filter((o) => o.paymentStatus === 'manual_pending');

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.userName && o.userName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.userPhone && o.userPhone.includes(orderSearch));
    const matchesStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const matchesPayment = paymentStatusFilter === 'all' || o.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Filtered Foods
  const filteredFoods = foods.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(foodSearch.toLowerCase());
    const matchesCat = foodCategoryFilter === 'all' || f.categoryId === foodCategoryFilter;
    const matchesRest = foodRestaurantFilter === 'all' || f.restaurantId === foodRestaurantFilter;
    return matchesSearch && matchesCat && matchesRest;
  });

  if (!currentUser || !isAdmin) {
    return (
      <div className="bm-card max-w-md mx-auto my-16 p-8 text-center space-y-3">
        <Shield className="w-10 h-10 text-red-500 mx-auto" />
        <h1 className="text-xl font-black text-neutral-900">Admin access required</h1>
        <p className="text-xs text-neutral-500">Sign in with an active administrator account to continue.</p>
      </div>
    );
  }

  return (
    <div className="bm-shell mx-auto min-h-[calc(100vh-72px)] w-full min-w-0 max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      
      {/* Admin Title & Seed Button */}
      <div className="relative flex min-w-0 flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl border border-[var(--bm-line)] bg-[#0b0e11] p-5 text-[var(--bm-cream)] shadow-[var(--bm-shadow-deep)] sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] px-2.5 py-0.5 rounded-full tracking-wider">
              Control Hub
            </span>
            <span className="text-xs text-neutral-400 font-bold">Role: Super Admin</span>
          </div>
          <h1 className="break-words text-xl font-black tracking-tight sm:text-3xl">BM Food Delivery Admin Panel</h1>
          <p className="text-xs text-neutral-300 mt-1">
            Live control for orders, kitchens, riders, payments, and settings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshAllData}
            className="px-4 py-2.5 bg-[#232a31] hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)] text-[var(--bm-cream)] font-bold text-xs rounded-xl flex items-center gap-1.5"
            title="Reload live dataset"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {seedStatus && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{seedStatus}</span>
          <button onClick={() => setSeedStatus(null)} className="text-neutral-500 hover:text-[var(--bm-ember-soft)] font-black">✕</button>
        </div>
      )}

      <div className={`grid min-w-0 items-start gap-4 sm:gap-6 ${navCollapsed ? 'lg:grid-cols-[74px_minmax(0,1fr)]' : 'lg:grid-cols-[240px_minmax(0,1fr)]'}`}>
        <aside className={`bm-card min-w-0 w-full p-2 transition-[width] duration-300 lg:self-start ${navCollapsed ? 'lg:w-[74px]' : 'lg:w-[240px]'}`}>
          <div className="flex items-center justify-between gap-2 border-b border-[var(--bm-line)] px-2 pb-3">
            {!navCollapsed && <span className="bm-eyebrow">Workspace</span>}
            <button type="button" aria-label={navCollapsed ? 'Expand admin navigation' : 'Collapse admin navigation'} onClick={toggleAdminNavigation} className="bm-glass-button hidden h-9 w-9 items-center justify-center rounded-xl lg:flex">
              {navCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          <nav aria-label="Admin workspace" className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return <button key={item.key} type="button" title={navCollapsed ? item.label : undefined} data-active={isActive} onClick={() => selectAdminTab(item.key)} className={`bm-glass-button flex min-h-10 items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold ${navCollapsed ? 'justify-center px-0' : ''}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {!navCollapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                {!navCollapsed && item.key === 'orders' && manualPendingPayments.length > 0 && <span className="rounded-full bg-[var(--bm-ember)] px-1.5 py-0.5 text-[9px] font-black text-[var(--bm-ink-deep)]">{manualPendingPayments.length}</span>}
              </button>;
            })}
          </nav>
        </aside>
        <div className="bm-admin-content min-w-0 w-full space-y-5 sm:space-y-6">
          {/* Legacy tab strip is kept hidden so deep-link/tab logic remains stable. */}
          <div className="hidden bg-white p-2 rounded-2xl border border-neutral-100 shadow-xs flex-wrap gap-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => selectAdminTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Overview
        </button>
        <button
          onClick={() => selectAdminTab('orders')}
          className={`px-4 py-2.5 rounded-xl transition-colors relative ${activeTab === 'orders' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Orders ({orders.length})
          {manualPendingPayments.length > 0 && (
            <span className="ml-1 bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[10px]">
              {manualPendingPayments.length} Tx
            </span>
          )}
        </button>
        <button
          onClick={() => selectAdminTab('foods')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'foods' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Food Menu ({foods.length})
        </button>
        <button
          onClick={() => selectAdminTab('restaurants')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'restaurants' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Kitchens ({restaurants.length})
        </button>
        <button
          onClick={() => selectAdminTab('categories')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => selectAdminTab('users')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => selectAdminTab('coupons')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'coupons' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Coupons
        </button>
        <button
          onClick={() => selectAdminTab('riders')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'riders' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Riders ({riders.length})
        </button>
        <button
          onClick={() => selectAdminTab('reviews')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'reviews' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Reviews ({reviews.length})
        </button>
        <button
          onClick={() => selectAdminTab('notifications')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Broadcasts
        </button>
        <button
          onClick={() => selectAdminTab('banners')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'banners' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Banners
        </button>
        <button
          onClick={() => selectAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
        >
          Settings
        </button>
        <button onClick={() => selectAdminTab('analytics')} className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}>Analytics</button>
        <button onClick={() => selectAdminTab('todays')} className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'todays' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}>Today’s Collection</button>
        <button onClick={() => selectAdminTab('payouts')} className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'payouts' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}>Payouts</button>
        <button onClick={() => selectAdminTab('audit-logs')} className={`px-4 py-2.5 rounded-xl transition-colors ${activeTab === 'audit-logs' ? 'bg-[var(--bm-ember)] text-[var(--bm-ink-deep)]' : 'text-neutral-600 hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}>Audit logs</button>
          </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-600">৳{totalRevenue}</p>
              <p className="text-[11px] text-neutral-500">{completedOrders} completed deliveries · cash included</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">Total Orders</p>
              <p className="text-2xl font-black text-orange-600">{orders.length}</p>
              <p className="text-[11px] text-neutral-500">{pendingOrders} pending confirmation</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">Manual Tx Queue</p>
              <p className="text-2xl font-black text-red-600">{manualPendingPayments.length}</p>
              <p className="text-[11px] text-neutral-500">Awaiting bKash/Nagad verification</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">Delivered COD Cash</p>
              <p className="text-2xl font-black text-emerald-600">৳{deliveredCashRevenue}</p>
              <p className="text-[11px] text-neutral-500">Added when cash orders are delivered</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">Fleet & Kitchens</p>
              <p className="text-2xl font-black text-neutral-900">{restaurants.length} Kitchens</p>
              <p className="text-[11px] text-neutral-500">{riders.length} Active delivery heroes</p>
            </div>

          </div>

          {/* Pending Manual Tx box */}
          {manualPendingPayments.length > 0 && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 space-y-4">
              <h2 className="font-bold text-amber-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                bKash / Nagad Manual Payment Approvals Pending ({manualPendingPayments.length})
              </h2>

              <div className="space-y-3">
                {manualPendingPayments.map((o) => (
                  <div key={o.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-neutral-900">Order #{o.id.slice(0, 8)} - ৳{o.total}</p>
                      <p className="text-neutral-600">Customer: {o.userName} ({o.userPhone})</p>
                      <p className="text-orange-600 font-extrabold">
                        Method: {o.paymentMethod} | TxID: <span className="bg-amber-100 px-2 py-0.5 rounded-md text-red-600">{o.transactionId || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApprovePayment(o.id, true)}
                        className="px-4 py-2 bg-[var(--bm-basil)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve Paid
                      </button>
                      <button
                        onClick={() => handleApprovePayment(o.id, false)}
                        className="px-4 py-2 bg-[var(--bm-error)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdminOverviewCharts orders={orders} />
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white min-w-0 p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex min-w-0 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900">Order Management & Dispatches ({filteredOrders.length})</h2>
              <p className="text-xs text-neutral-500">Track order lifecycle, assign riders, and update status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search order ID or phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All Order Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="picked_up">Picked Up</option>
                <option value="on_the_way">On The Way</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="manual_pending">Manual Pending</option>
                <option value="pending">COD Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="bm-table-scroll">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Kitchen</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Assign Rider</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bm-ember-wash)]">
                    <td className="p-3 font-bold text-neutral-900">#{o.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <p className="font-bold">{o.userName}</p>
                      <p className="text-[10px] text-neutral-400">{o.userPhone}</p>
                    </td>
                    <td className="p-3 text-orange-600 font-bold">{o.restaurantName || 'BM Kitchen'}</td>
                    <td className="p-3 font-black text-neutral-900">৳{o.total}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        o.paymentStatus === 'manual_pending' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {o.paymentMethod} ({o.paymentStatus})
                      </span>
                      {o.transactionId && <span className="block text-[10px] text-neutral-400">Tx: {o.transactionId}</span>}
                    </td>
                    <td className="p-3">
                      <select
                        value={o.riderId || ''}
                        onChange={(e) => handleAssignRider(o.id, e.target.value)}
                        className="p-1 bg-white border border-neutral-300 rounded-lg text-[11px] font-bold"
                      >
                        <option value="">-- Assign Rider --</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.vehicleType})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="p-1.5 bg-neutral-100 border border-neutral-300 rounded-lg font-bold text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="on_the_way">On The Way</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-neutral-500 hover:text-[var(--bm-ember-soft)]"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail View Modal */}
      {selectedOrder && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <div className="bm-modal-panel relative w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] max-h-[90vh] z-10">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-neutral-900 text-lg">Order #{selectedOrder.id.slice(0, 8)}</h3>
                <p className="text-xs text-neutral-500">Ordered from: <strong>{selectedOrder.restaurantName}</strong></p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-bold text-xs uppercase">
                {selectedOrder.orderStatus}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-neutral-900 mb-1">Customer & Delivery Info:</p>
                <p>Name: {selectedOrder.deliveryAddress?.name || selectedOrder.userName}</p>
                <p>Phone: {selectedOrder.deliveryAddress?.phone || selectedOrder.userPhone}</p>
                <p>Address: {selectedOrder.deliveryAddress?.address}, {selectedOrder.deliveryAddress?.area}, {selectedOrder.deliveryAddress?.city}</p>
              </div>

              <div>
                <p className="font-bold text-neutral-900 mb-1">Ordered Dishes:</p>
                <div className="p-3 bg-neutral-50 rounded-xl space-y-1">
                  {selectedOrder.items?.map((i, idx) => (
                    <div key={idx} className="flex justify-between font-medium">
                      <span>{i.foodName} × {i.quantity}</span>
                      <span>৳{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t space-y-1 font-semibold">
                <div className="flex justify-between"><span>Subtotal:</span><span>৳{selectedOrder.subtotal}</span></div>
                <div className="flex justify-between"><span>Delivery:</span><span>৳{selectedOrder.deliveryFee}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>-৳{selectedOrder.discount}</span></div>
                <div className="flex justify-between text-base font-black text-neutral-900 pt-1 border-t">
                  <span>Total Payable:</span>
                  <span className="text-orange-600">৳{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-[var(--bm-graphite-overlay)] text-[var(--bm-cream)] font-bold rounded-xl text-xs transition hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FOODS */}
      {activeTab === 'foods' && (
        <div className="bg-white min-w-0 p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex min-w-0 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-900">Food Menu Items ({filteredFoods.length})</h2>
              <p className="text-xs text-neutral-500">Manage dishes, prices, availability, and external image URLs.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search dish name..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <select
                value={foodCategoryFilter}
                onChange={(e) => setFoodCategoryFilter(e.target.value)}
                className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={openNewFood}
                className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:bg-[var(--bm-ember-hover)] shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Food Item
              </button>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map((food) => (
              <div key={food.id} className="p-4 border border-neutral-200 rounded-2xl flex gap-3 items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
                  <ImageWithFallback src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-bold text-neutral-900 truncate">{food.name}</h4>
                  <p className="text-orange-600 font-black">৳{food.discountPrice ?? food.price}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${food.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {food.isAvailable ? 'Available' : 'Sold Out'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEditFood(food)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteFood(food.id)} className="p-1 text-neutral-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT / ADD FOOD MODAL */}
      {foodModalOpen && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setFoodModalOpen(false)} />
          <div className="bm-modal-panel relative w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] max-h-[90vh] z-10">
            <h2 className="text-lg font-bold text-neutral-900">{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</h2>

            <form onSubmit={handleSaveFood} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Discount Price (৳)</label>
                  <input
                    type="number"
                    value={foodDiscount}
                    onChange={(e) => setFoodDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Requirement #6: External Image URL + Live Preview */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">External Food Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={foodImageUrl}
                  onChange={(e) => setFoodImageUrl(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
                
                {foodImageUrl && (
                  <div className="mt-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                      <ImageWithFallback src={foodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">✓ Live Image Preview</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Restaurant *</label>
                  <select
                    value={foodRestaurant}
                    onChange={(e) => setFoodRestaurant(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Category *</label>
                  <select
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={foodAvailable}
                    onChange={(e) => setFoodAvailable(e.target.checked)}
                  />
                  Available
                </label>

                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={foodFeatured}
                    onChange={(e) => setFoodFeatured(e.target.checked)}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={foodPopular} onChange={(e) => setFoodPopular(e.target.checked)} />
                  Popular
                </label>
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={foodTodaysSpecial} onChange={(e) => setFoodTodaysSpecial(e.target.checked)} />
                  Today’s Special
                </label>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Customization options (JSON)</label>
                <textarea value={foodOptionsJson} onChange={(e) => setFoodOptionsJson(e.target.value)} rows={5} className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[10px]" placeholder={'[{"id":"size","name":"Size","type":"single","required":true,"choices":[{"id":"regular","label":"Regular","priceDelta":0}]}]'} />
                <p className="mt-1 text-[10px] text-neutral-500">Each choice must include id, label, and priceDelta. Invalid JSON is rejected before saving.</p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl"
                >
                  Save Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: RESTAURANTS */}
      {activeTab === 'restaurants' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-neutral-900">Partner Kitchens ({restaurants.length})</h2>
              <p className="text-xs text-neutral-500">Manage vendor profiles, delivery fees, and minimum orders.</p>
            </div>

            <button
              onClick={openNewRestaurant}
              className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:bg-[var(--bm-ember-hover)]"
            >
              <Plus className="w-4 h-4" /> Add Restaurant
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {restaurants.map((r) => (
              <div key={r.id} className="p-4 border rounded-2xl flex gap-3 justify-between items-start">
                <div className="flex gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
                    <ImageWithFallback src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-neutral-900 text-sm">{r.name}</h4>
                    <p className="text-neutral-500">{r.address}</p>
                    <p className="text-orange-600 font-bold mt-1">Delivery Fee: ৳{r.deliveryFee} | Min Order: ৳{r.minimumOrder}</p>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditRestaurant(r)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteRestaurant(r.id)} className="p-1 text-neutral-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESTAURANT MODAL */}
      {restModalOpen && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setRestModalOpen(false)} />
          <div className="bm-modal-panel relative w-full max-w-lg space-y-4 rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] z-10">
            <h3 className="text-base font-bold text-neutral-900">
              {editingRest ? 'Edit Kitchen' : 'Create New Partner Kitchen'}
            </h3>

            <form onSubmit={handleSaveRestaurant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kacchi Express"
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Old Dhaka style Kacchi..."
                  value={restDesc}
                  onChange={(e) => setRestDesc(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Logo URL *</label>
                  <input
                    type="url"
                    required
                    value={restLogoUrl}
                    onChange={(e) => setRestLogoUrl(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={restCoverUrl}
                    onChange={(e) => setRestCoverUrl(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={restAddress}
                    onChange={(e) => setRestAddress(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={restPhone}
                    onChange={(e) => setRestPhone(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    value={restFee}
                    onChange={(e) => setRestFee(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Minimum Order (৳)</label>
                  <input
                    type="number"
                    value={restMinOrder}
                    onChange={(e) => setRestMinOrder(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setRestModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl shadow-md"
                >
                  Save Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {activeTab === 'categories' && (
        <AdminCategoriesTab categories={categories} onRefresh={refreshAllData} />
      )}

      {/* TAB 6: USERS */}
      {activeTab === 'users' && (
        <AdminUsersTab users={users} onRefresh={refreshAllData} />
      )}

      {/* TAB 7: PAYMENTS & GATEWAYS */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
          <div><h2 className="text-lg font-bold text-neutral-900">Payment Method Configuration</h2><p className="text-xs text-neutral-500 mt-1">Only enabled methods are offered at checkout. Online gateway methods remain disabled until a real provider is configured.</p></div>
          {paymentMethods.length === 0 ? <p className="p-6 text-center text-neutral-500 text-sm">No payment methods have been configured.</p> : <div className="space-y-4">{paymentMethods.map((pm) => <div key={pm.id} className="p-4 border rounded-2xl space-y-3"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="text-xs font-bold text-neutral-700">Provider name<input value={pm.name} onChange={(event) => setPaymentMethods((previous) => previous.map((item) => item.id === pm.id ? { ...item, name: event.target.value } : item))} className="mt-1 w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg font-normal" /></label><label className="text-xs font-bold text-neutral-700">Account / mobile number<input value={pm.accountNumber || ''} onChange={(event) => setPaymentMethods((previous) => previous.map((item) => item.id === pm.id ? { ...item, accountNumber: event.target.value } : item))} className="mt-1 w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg font-normal" /></label></div><label className="block text-xs font-bold text-neutral-700">Customer instructions<textarea value={pm.instructions || ''} onChange={(event) => setPaymentMethods((previous) => previous.map((item) => item.id === pm.id ? { ...item, instructions: event.target.value } : item))} rows={2} className="mt-1 w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg font-normal" /></label><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-bold text-neutral-700"><input type="checkbox" checked={pm.isEnabled} onChange={(event) => setPaymentMethods((previous) => previous.map((item) => item.id === pm.id ? { ...item, isEnabled: event.target.checked } : item))} /> Enabled at checkout</label><label className="text-xs font-bold text-neutral-700">Sort order<input type="number" min="0" value={pm.sortOrder} onChange={(event) => setPaymentMethods((previous) => previous.map((item) => item.id === pm.id ? { ...item, sortOrder: Number(event.target.value) } : item))} className="ml-2 w-20 p-2 bg-neutral-50 border border-neutral-200 rounded-lg font-normal" /></label><button onClick={() => handleSavePaymentMethod(pm)} disabled={savingPaymentId === pm.id} className="px-4 py-2 bg-[var(--bm-ember)] disabled:opacity-50 text-[var(--bm-ink-deep)] rounded-xl text-xs font-bold transition hover:bg-[var(--bm-ember-hover)]">{savingPaymentId === pm.id ? 'Saving...' : 'Save Method'}</button></div></div>)}</div>}
        </div>
      )}

      {/* TAB 8: COUPONS */}
      {activeTab === 'coupons' && (
        <AdminCouponsTab coupons={coupons} onRefresh={refreshAllData} />
      )}

      {/* TAB 9: RIDERS */}
      {activeTab === 'riders' && (
        <AdminRidersTab riders={riders} onRefresh={refreshAllData} />
      )}

      {/* TAB 10: REVIEWS */}
      {activeTab === 'reviews' && (
        <AdminReviewsTab reviews={reviews} onRefresh={refreshAllData} />
      )}

      {/* TAB 11: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <AdminNotificationsTab notifications={notifications} onRefresh={refreshAllData} />
      )}

      {/* TAB 12: BANNERS */}
      {activeTab === 'banners' && (
        <AdminBannersTab banners={banners} onRefresh={refreshAllData} />
      )}

      {/* TAB 13: SETTINGS */}
      {activeTab === 'settings' && (
        <AdminSettingsTab onRefresh={refreshAllData} />
      )}
      {activeTab === 'gateway' && (
        <AdminGatewayTab onRefresh={refreshAllData} />
      )}
      {activeTab === 'analytics' && <AdminOperationsTab mode="analytics" orders={orders} foods={foods} restaurants={restaurants} riders={riders} />}
      {activeTab === 'todays' && <AdminOperationsTab mode="todays" orders={orders} foods={foods} restaurants={restaurants} riders={riders} />}
      {activeTab === 'payouts' && <AdminOperationsTab mode="payouts" orders={orders} foods={foods} restaurants={restaurants} riders={riders} />}
      {activeTab === 'audit-logs' && <AdminOperationsTab mode="audit-logs" orders={orders} foods={foods} restaurants={restaurants} riders={riders} />}

        </div>
      </div>
    </div>
  );
};
