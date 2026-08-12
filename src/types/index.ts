export type UserRole = 'customer' | 'admin' | 'restaurant' | 'rider' | 'support';
export type UserStatus = 'active' | 'suspended';

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  isDefault?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  restaurantId?: string;
  addresses: Address[];
  favorites: string[]; // food or restaurant IDs
  walletBalance: number;
  createdAt: any;
  updatedAt: any;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  cuisineTypes: string[];
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: number; // in minutes
  isOpen: boolean;
  isFeatured: boolean;
  status: 'active' | 'inactive' | 'pending';
  ownerId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: any;
}

export interface FoodOptionChoice {
  id: string;
  label: string;
  priceDelta: number;
}

export interface FoodOptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required?: boolean;
  choices: FoodOptionChoice[];
}

export interface Food {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  categoryId: string;
  restaurantId: string;
  rating: number;
  reviewCount: number;
  preparationTime: number; // in minutes
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular?: boolean;
  isTodaysSpecial?: boolean;
  tags: string[];
  options?: FoodOptionGroup[];
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  foodId: string;
  foodName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selectedOptions?: Array<{ groupId: string; groupName: string; choiceId: string; choiceLabel: string; priceDelta: number }>;
  notes?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'failed' | 'refunded' | 'manual_pending';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'on_the_way'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  restaurantId: string;
  restaurantName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;

  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    area: string;
    latitude?: number | null;
    longitude?: number | null;
  };

  paymentMethod: string; // e.g. "cod", "bKash Manual", "Online Gateway"
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;

  transactionId?: string; // For manual or gateway transactions
  paymentProofUrl?: string;
  paymentId?: string;
  estimatedDeliveryMinutes?: number;

  riderId: string | null;
  riderName?: string;
  riderPhone?: string;

  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'manual' | 'cod' | 'gateway';
  accountNumber?: string;
  instructions?: string;
  isEnabled: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  rating: number;
  foodRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  valueRating?: number;
  comment: string;
  foodId?: string;
  foodName?: string;
  restaurantId: string;
  restaurantName?: string;
  userId: string;
  userName: string;
  orderId: string;
  isVisible?: boolean;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all' or specific user ID
  title: string;
  message: string;
  imageUrl?: string;
  targetAudience?: 'all' | 'customer' | 'restaurant' | 'rider';
  isRead: boolean;
  createdAt: any;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  targetId?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SystemSettings {
  id?: string;
  businessName: string;
  logoUrl: string;
  contactPhone: string;
  contactEmail: string;
  currency: string;
  taxPercentage: number;
  defaultDeliveryFee: number;
  minimumOrder: number;
  codEnabled: boolean;
  manualPaymentsEnabled: boolean;
  onlineGatewayEnabled: boolean;
  gatewayProvider?: 'none' | 'sslcommerz' | 'aamarpay' | 'shurjopay' | 'stripe' | 'custom';
  gatewayMode?: 'test' | 'live';
  gatewayApiBaseUrl?: string;
  gatewayPublicKey?: string;
  gatewayWebhookUrl?: string;
  orderCancellationWindowMinutes?: number;
  rewardPointsRate?: number;
  referralReward?: number;
  platformCommissionPercentage?: number;
}

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'bike' | 'bicycle' | 'scooter';
  vehicleNumber?: string;
  status: 'available' | 'busy' | 'offline';
  currentOrderId?: string | null;
  currentLocation?: { latitude: number; longitude: number; updatedAt?: any } | null;
  totalDeliveries: number;
  completedDeliveries?: number;
  cancelledDeliveries?: number;
  averageDeliveryMinutes?: number;
  rating: number;
  walletEarnings: number;
  isApproved: boolean;
  createdAt?: any;
}

