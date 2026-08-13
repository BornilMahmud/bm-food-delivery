import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { FoodDetailModal } from './components/FoodDetailModal';
import { InstallPrompt } from './components/InstallPrompt';
import { HomePage } from './pages/HomePage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackerPage } from './pages/OrderTrackerPage';
import { UserOrdersPage } from './pages/UserOrdersPage';
import { UserProfilePage } from './pages/UserProfilePage';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const RestaurantDashboard = lazy(() => import('./pages/restaurant/RestaurantDashboard').then((module) => ({ default: module.RestaurantDashboard })));
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard').then((module) => ({ default: module.RiderDashboard })));
import { Food } from './types';
import { SelectedFoodOption } from './lib/orderMath';

interface RouteState {
  view: string;
  restaurantId?: string;
  orderId?: string;
  adminTab?: string;
}

const resolveRoute = (): RouteState => {
  if (typeof window === 'undefined') return { view: 'home' };
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin/')) {
    const section = path.split('/')[2];
    const adminTab = ({ 'dashboard': 'overview', 'orders': 'orders', 'restaurants': 'restaurants', 'foods': 'foods', 'categories': 'categories', 'users': 'users', 'riders': 'riders', 'payments': 'payments', 'payment-methods': 'payments', 'gateway': 'gateway', 'coupons': 'coupons', 'reviews': 'reviews', 'banners': 'banners', 'notifications': 'notifications', 'settings': 'settings', 'analytics': 'analytics', 'payouts': 'payouts', 'audit-logs': 'audit-logs', 'todays-collection': 'todays' } as Record<string, string>)[section || 'dashboard'] || 'overview';
    return { view: 'admin', adminTab };
  }
  if (path === '/restaurants') return { view: 'restaurants' };
  if (path.startsWith('/restaurants/')) return { view: 'restaurant-detail', restaurantId: decodeURIComponent(path.split('/')[2] || '') };
  if (path === '/checkout') return { view: 'checkout' };
  if (path === '/profile') return { view: 'profile' };
  if (path === '/restaurant' || path === '/vendor') return { view: 'vendor' };
  if (path === '/rider') return { view: 'rider' };
  if (path.startsWith('/orders/')) return { view: 'order-tracker', orderId: decodeURIComponent(path.split('/')[2] || '') };
  if (path === '/orders') return { view: 'user-orders' };
  return { view: 'home' };
};

const pathForView = (view: string) => ({
  home: '/',
  restaurants: '/restaurants',
  checkout: '/checkout',
  profile: '/profile',
  'user-orders': '/orders',
  admin: '/admin',
  vendor: '/restaurant',
  rider: '/rider',
}[view] || '/');

export function AppContent() {
  const route = resolveRoute();
  const [currentView, setCurrentViewState] = useState<string>(route.view);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(route.restaurantId || 'rest-kacchi-express');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(route.orderId || null);
  const [detailFood, setDetailFood] = useState<Food | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orderConfirmationId, setOrderConfirmationId] = useState<string | null>(null);
  const [orderConfirmationMinutes, setOrderConfirmationMinutes] = useState(35);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const { clearCart, addItem } = useCart();

  const navigate = (view: string, pathOverride?: string) => {
    const nextPath = pathOverride || pathForView(view);
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) window.history.pushState({ view }, '', nextPath);
    setCurrentViewState(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCurrentView = (view: string) => navigate(view);

  useEffect(() => {
    const onPopState = () => {
      const next = resolveRoute();
      setCurrentViewState(next.view);
      if (next.restaurantId) setSelectedRestaurantId(next.restaurantId);
      if (next.orderId) setActiveOrderId(next.orderId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleDirectOrder = (food: Food, qty: number = 1, notes?: string, selectedOptions: SelectedFoodOption[] = []) => {
    clearCart();
    for (let i = 0; i < qty; i++) {
      addItem(food, undefined, notes, selectedOptions);
    }
    setDetailFood(null);
    navigate('checkout');
  };

  const handleSelectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
    navigate('restaurant-detail', `/restaurants/${encodeURIComponent(id)}`);
  };

  const handleOrderPlaced = (orderId: string, estimatedMinutes = 35) => {
    setActiveOrderId(orderId);
    setOrderConfirmationMinutes(estimatedMinutes);
    setOrderConfirmationId(orderId);
    navigate('order-tracker', `/orders/${encodeURIComponent(orderId)}`);
  };

  const handleSelectTrackOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    navigate('order-tracker', `/orders/${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="bm-shell min-h-screen flex flex-col text-[var(--bm-ink)] font-sans antialiased transition-colors duration-200">
      
      {/* Navigation Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode = 'login') => { setAuthMode(mode); setIsAuthOpen(true); }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Body View Switching */}
      <main className="min-w-0 flex-1">
        <Suspense fallback={<div className="bm-shell flex min-h-[50vh] items-center justify-center p-8 text-sm font-extrabold text-[var(--bm-ink-soft)]">Loading BM Food workspace...</div>}>
        {currentView === 'home' && (
          <HomePage
            onSelectRestaurant={handleSelectRestaurant}
            onSelectCategory={(catId) => {
              setCurrentView('home');
            }}
            onOpenDetailFood={(food) => setDetailFood(food)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'restaurants' && (
          <RestaurantsPage onSelectRestaurant={handleSelectRestaurant} />
        )}

        {currentView === 'restaurant-detail' && (
          <RestaurantDetailPage
            restaurantId={selectedRestaurantId}
            onBack={() => navigate('restaurants')}
            onOpenDetailFood={(food) => setDetailFood(food)}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBackToCart={() => setIsCartOpen(true)}
            onOrderPlaced={handleOrderPlaced}
            onOpenAuthModal={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'order-tracker' && (
          <OrderTrackerPage
            orderId={activeOrderId || ''}
            onBackToHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'user-orders' && (
          <UserOrdersPage
            onSelectTrackOrder={handleSelectTrackOrder}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'profile' && <UserProfilePage />}

        {currentView === 'admin' && <AdminDashboard initialTab={route.adminTab} />}

        {currentView === 'vendor' && <RestaurantDashboard />}

        {currentView === 'rider' && <RiderDashboard />}
        </Suspense>
      </main>

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigate('checkout');
        }}
      />

      {/* Global Auth Modal */}
      <AuthModal isOpen={isAuthOpen} initialMode={authMode} onClose={() => setIsAuthOpen(false)} />

      <OrderConfirmationModal
        isOpen={Boolean(orderConfirmationId)}
        orderId={orderConfirmationId}
        estimatedMinutes={orderConfirmationMinutes}
        onTrackOrder={() => setOrderConfirmationId(null)}
        onClose={() => setOrderConfirmationId(null)}
      />

      {/* Global Food Item Customization Modal */}
      <FoodDetailModal food={detailFood} onClose={() => setDetailFood(null)} onDirectOrder={handleDirectOrder} />

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />
      <InstallPrompt />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
