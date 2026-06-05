import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// ── Types ──
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  province?: string;
  district?: string;
  localGovernmentArea?: string;
  nic?: string;
  role: 'citizen' | 'admin';
  status: 'active' | 'suspended';
  isVerified: boolean;
  avatarUrl?: string;
  contributionPoints?: number;
  reportsAccepted?: number;          // count of non-rejected accepted reports
  reportsResolved?: number;          // count of fully resolved reports
  badges?: string[];                 // array of earned badge IDs
  reportsValidated?: number;
  notificationSound?: boolean;
  notificationsEnabled?: boolean;
  alertRadius?: string;
  createdAt: string;
  level:number;
  homeLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

interface AuthContextType {
  user: User | null;               // Firebase Auth user
  profile: UserProfile | null;     // Firestore profile data
  loading: boolean;                // true while checking auth state
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isProfileComplete: boolean;
}


const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);  // start true — checking auth

  const isProfileComplete = !!(
    profile &&
    profile.fullName &&
    profile.phoneNumber &&
    profile.nic &&
    profile.province &&
    profile.district &&
    profile.localGovernmentArea
  );

  // Fetch Firestore profile for a given uid
  const fetchProfile = async (uid: string) => {
    try {
      // 1. Check network connection first
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        console.warn('⚠️ Device is offline. Skipping Firestore profile fetch.');
        return;
      }

      // 2. Race the document fetch against a generous 8-second timeout
      const getDocPromise = getDoc(doc(db, 'users', uid));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore profile fetch timeout')), 8000)
      );

      const snap = await Promise.race([getDocPromise, timeoutPromise]);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        console.warn('⚠️ No user document found in Firestore for uid:', uid);
      }
    } catch (e) {
      const netState = await NetInfo.fetch().catch(() => ({ isConnected: true }));
      if (!netState.isConnected) {
        console.warn('⚠️ profile fetch aborted: device is offline.');
      } else {
        console.error('❌ fetchProfile error or timeout:', e);
      }
    }
  };

  // Re-fetch profile (call this after editing profile)
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Listen to profile changes in Firestore and verify password sync
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile & { lastPasswordChange?: string };
        setProfile(data);

        try {
          const localVal = await AsyncStorage.getItem('lastPasswordChangeLocal');
          if (data.lastPasswordChange) {
            if (!localVal) {
              await AsyncStorage.setItem('lastPasswordChangeLocal', data.lastPasswordChange);
            } else if (localVal !== data.lastPasswordChange) {
              console.log('🔄 Session expired: password changed on another device.');
              await AsyncStorage.removeItem('lastPasswordChangeLocal');
              await signOut(auth);
              setProfile(null);
              Toast.show({
                type: 'error',
                text1: 'Session Expired',
                text2: 'Password was changed from another device. Please log in again.',
              });
            }
          } else if (localVal) {
            await AsyncStorage.removeItem('lastPasswordChangeLocal');
          }
        } catch (err) {
          console.error('Error handling local password change sync:', err);
        }
      } else {
        console.warn('⚠️ No user document found in Firestore for uid:', user.uid);
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore snapshot listener error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, isProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use anywhere in the app
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}