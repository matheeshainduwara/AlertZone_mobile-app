import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';

import getExpoPushTokenAsync from 'expo-notifications/build/getExpoPushTokenAsync';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';

const isExpoGo = isRunningInExpoGo();

// Only configure notification behavior when running outside Expo Go
if (!isExpoGo) {
  try {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('⚠️ Failed to set notification handler:', e);
  }
}

/**
 * Registers the device for push notifications, retrieves the Expo Push Token,
 * and saves it to the user's Firestore profile document.
 * 
 * @param userId The authenticated user's ID
 * @returns The Expo Push Token string, or null if registration failed
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (isExpoGo) {
    console.log('ℹ️ Running in Expo Go. Standalone remote push notifications are disabled.');
    return null;
  }

  let token: string | null = null;

  try {
    // 1. Check and request notification permissions
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted!');
      return null;
    }

    // 2. Get the Expo Push Token using the project ID
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ?? 
      Constants.easConfig?.projectId;
      
    console.log('📱 Fetching Expo Push Token with Project ID:', projectId);

    if (!projectId) {
      console.warn(
        '⚠️ No Expo "projectId" found in app.json. Push notifications are disabled.\n' +
        'To enable push notifications:\n' +
        '1. Run "npm install -g eas-cli" (if not already installed)\n' +
        '2. Run "eas login" (to log into your Expo account)\n' +
        '3. Run "eas project:init" inside the mobile app folder to link/create a project.\n' +
        'This will automatically add the projectId to your app.json. Then reload the app.'
      );
      return null;
    }

    const tokenData = await getExpoPushTokenAsync({
      projectId,
    });
    
    token = tokenData.data;
    console.log('🔔 Expo Push Token retrieved:', token);

    // 3. Update the user's document in Firestore
    if (token && userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        fcmToken: token, // Stored as fcmToken as well for legacy backend queries
        updatedAt: new Date()
      });
      console.log('✅ Registered token in Firestore for user:', userId);
    }

    // 4. Setup Android notification channel
    if (Platform.OS === 'android') {
      await setNotificationChannelAsync('default', {
        name: 'default',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Removes the push token from the user's Firestore profile document (e.g. on logout).
 * 
 * @param userId The user's ID
 */
export async function unregisterPushNotificationsAsync(userId: string): Promise<void> {
  try {
    if (userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: null,
        fcmToken: null,
        updatedAt: new Date()
      });
      console.log('✅ Unregistered push token for user:', userId);
    }
  } catch (error) {
    console.error('❌ Error unregistering push notifications:', error);
  }
}
