import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, getFriendlyAuthErrorMessage } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, phone: string, defaultAddress?: string, photoURL?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isRestaurantOwner: boolean;
  isRider: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const syncAddressDocuments = async (uid: string, addresses: UserProfile['addresses']) => {
  await Promise.all(addresses.map((address) => setDoc(doc(db, 'addresses', `${uid}_${address.id}`), { ...address, userId: uid, updatedAt: serverTimestamp() }, { merge: true })));
};

const createCustomerProfile = (user: FirebaseUser, overrides: Partial<UserProfile> = {}): UserProfile => ({
  uid: user.uid,
  name: overrides.name || user.displayName || user.email?.split('@')[0] || 'Customer',
  email: overrides.email || user.email || '',
  phone: overrides.phone || user.phoneNumber || '',
  photoURL: overrides.photoURL ?? user.photoURL ?? null,
  role: 'customer',
  status: 'active',
  addresses: overrides.addresses || [],
  favorites: overrides.favorites || [],
  walletBalance: overrides.walletBalance || 0,
  createdAt: overrides.createdAt || serverTimestamp(),
  updatedAt: serverTimestamp(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: FirebaseUser) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const profileSnap = await getDoc(userRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data() as Partial<UserProfile>;
        const allowedRoles: UserRole[] = ['customer', 'admin', 'restaurant', 'rider', 'support'];
        const role = allowedRoles.includes(data.role as UserRole) ? data.role as UserRole : 'customer';
        setUserProfile({
          ...createCustomerProfile(user),
          ...data,
          uid: user.uid,
          role,
          status: data.status === 'suspended' ? 'suspended' : 'active',
          email: data.email || user.email || '',
        });
        return;
      }

      const newProfile = createCustomerProfile(user);
      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
    } catch (error) {
      console.error('Unable to load the authenticated user profile:', error);
      // Never infer any role or fabricate a profile after a backend failure.
      // A missing profile keeps every privileged route closed until Firestore
      // access is restored and the real role document can be read.
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      try {
        if (user) {
          await fetchUserProfile(user);
        } else {
          setUserProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error: any) {
      throw new Error(getFriendlyAuthErrorMessage(error.code || ''));
    }
  };

  const signup = async (
    email: string,
    pass: string,
    name: string,
    phone: string,
    defaultAddress?: string,
    photoURL?: string,
  ) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const initialAddresses = defaultAddress?.trim()
        ? [{
            id: `addr-${crypto.randomUUID()}`,
            name: 'Home',
            phone: phone.trim(),
            address: defaultAddress.trim(),
            city: 'Dhaka',
            area: 'Main',
            isDefault: true,
          }]
        : [];
      const newProfile = createCustomerProfile(res.user, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        photoURL: photoURL?.trim() || null,
        addresses: initialAddresses,
      });
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      await syncAddressDocuments(res.user.uid, initialAddresses);
      setUserProfile(newProfile);
    } catch (error: any) {
      throw new Error(getFriendlyAuthErrorMessage(error.code || ''));
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-In popup was closed before completing.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Google Sign-In popup was blocked by your browser settings.');
      }
      throw new Error(getFriendlyAuthErrorMessage(error.code || ''));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      throw new Error(getFriendlyAuthErrorMessage(error.code || ''));
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('You must be signed in to update your profile.');

    // Role, status, uid, and wallet fields are server/admin managed. The
    // client may only update profile information owned by the current user.
    const { uid: _uid, role: _role, status: _status, walletBalance: _wallet, ...editableData } = data;
    const updated = { ...editableData, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, 'users', currentUser.uid), updated);
    if (Array.isArray(editableData.addresses)) await syncAddressDocuments(currentUser.uid, editableData.addresses);
    setUserProfile((previous) => previous ? { ...previous, ...editableData } : previous);
  };

  const isAdmin = userProfile?.role === 'admin' && userProfile.status === 'active';
  const isRestaurantOwner = (userProfile?.role === 'restaurant' || isAdmin) && userProfile?.status === 'active';
  const isRider = (userProfile?.role === 'rider' || isAdmin) && userProfile?.status === 'active';
  const isCustomer = userProfile?.role === 'customer' && userProfile.status === 'active';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
        updateUserProfile,
        isAdmin,
        isRestaurantOwner,
        isRider,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
