import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const email = (process.env.ADMIN_EMAIL || 'bornilmahmud56@gmail.com').trim().toLowerCase();
const projectId = process.env.FIREBASE_PROJECT_ID || 'bm-food-d04b1';
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON file before bootstrapping an administrator.');
}

const serviceAccount = JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf8'));
const app = getApps()[0] || initializeApp({ projectId, credential: cert(serviceAccount) });
const auth = getAuth(app);
const firestore = getFirestore(app);

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  await firestore.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    name: user.displayName || 'Bornil Mahmud',
    displayName: user.displayName || 'Bornil Mahmud',
    phone: user.phoneNumber || '',
    photoURL: user.photoURL || null,
    role: 'admin',
    status: 'active',
    isActive: true,
    addresses: [],
    favorites: [],
    walletBalance: 0,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Admin profile ready for ${email}. Firebase UID: ${user.uid}`);
} catch (error: any) {
  if (error?.code === 'auth/user-not-found') {
    console.error(`No Firebase Authentication user exists for ${email}. Create the account in Firebase Console > Authentication > Users, then run this script again.`);
  }
  throw error;
}
