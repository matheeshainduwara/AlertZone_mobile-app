import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../config/authConfig';
import { registerForPushNotificationsAsync } from '../services/notification.service';
import { isRunningInExpoGo } from 'expo';

import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';

const isExpoGo = isRunningInExpoGo();

/**
 * Hook to manage notification setup, registration, and action handling.
 * To be called in the root layout of the app.
 */
export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Bypasses OS push notification setup when running inside Expo Go client
    if (isExpoGo) {
      console.log('ℹ️ Running in Expo Go. OS push notification listeners are skipped.');
      return;
    }

    if (user?.uid) {
      registerForPushNotificationsAsync(user.uid);
    }

    // 2. Listen for notifications that are received while the app is open
    notificationListener.current = addNotificationReceivedListener(
      (notification: any) => {
        console.log('📬 Foreground Notification Received:', notification);
      }
    );

    // 3. Listen for when user taps on or interacts with a notification
    responseListener.current = addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data;
        console.log('🖱️ Notification Action Response Tapped:', data);

        if (data && data.reportId) {
          const { reportId, latitude, longitude } = data;
          
          if (latitude && longitude) {
            console.log(`🗺️ Navigating to Map tab: Report ${reportId} @ [${latitude}, ${longitude}]`);
            router.push(`/(tabs)/map?id=${reportId}&lat=${latitude}&lng=${longitude}` as any);
          } else {
            console.log(`🗺️ Navigating to Map tab: Report ${reportId} (no coordinates)`);
            router.push(`/(tabs)/map?id=${reportId}` as any);
          }
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.uid]);
}
