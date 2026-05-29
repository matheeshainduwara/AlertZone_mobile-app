import { Platform, Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';

const isExpoGo = isRunningInExpoGo();

// Only configure notification behavior when running outside Expo Go
if (!isExpoGo) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
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
    const Notifications = require('expo-notifications');

    // 1. Check and request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted!');
      return null;
    }

    // 2. Setup Android notification channel FIRST (must exist before token fetch)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alertzone-alerts', {
        name: 'AlertZone Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#30A89C',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 3. Get the Expo Push Token using the project ID
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

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    token = tokenData.data;
    console.log('🔔 Expo Push Token retrieved:', token);

    // 4. Update the user's document in Firestore
    if (token && userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        fcmToken: token, // Stored as fcmToken as well for legacy backend queries
        updatedAt: new Date()
      });
      console.log('✅ Registered token in Firestore for user:', userId);
    }

  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    Alert.alert(
      'Push Registration Error',
      error instanceof Error ? error.message : String(error)
    );
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
