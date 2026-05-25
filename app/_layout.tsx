import { AuthProvider } from "@/config/authConfig";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message"; // <-- import Toast
import { toastConfig } from "../config/toastConfig"; // make sure this matches the exported name
import "../global.css";
import { useNotifications } from "../hooks/useNotifications";

function AppContent() {
  const insets = useSafeAreaInsets();
  useNotifications(); // Initialize notification listeners inside the AuthProvider context

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast
        config={toastConfig}
        topOffset={
          Platform.OS === "ios" ? insets.top + 0 : 50
        }
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}