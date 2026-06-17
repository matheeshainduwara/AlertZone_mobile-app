import Toast, {
  BaseToast,
  ErrorToast,
  BaseToastProps,
} from "react-native-toast-message";
import { useTheme } from "./themeContext";

export const toastConfig = {
  success: (props: BaseToastProps) => {
    const { colors, isDark } = useTheme();
    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: colors.successText,
          backgroundColor: colors.card,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 0,
          minHeight: 70,
          maxHeight: 100,
          marginHorizontal: 0,
          width: 'auto',
          maxWidth: '90%',
          alignSelf: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.textSecondary,
          flex: 1,
        }}
        text2Props={{
          numberOfLines: 0,
        }}
      />
    );
  },

  error: (props: BaseToastProps) => {
    const { colors, isDark } = useTheme();
    return (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: colors.dangerText,
          backgroundColor: colors.card,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 0,
          minHeight: 70,
          maxHeight: 100,
          marginHorizontal: 0,
          width: 'auto',
          maxWidth: '90%',
          alignSelf: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.border,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: "bold",
          color: colors.text,
        }}
        text2Style={{
          fontSize: 13,
          color: colors.textSecondary,
          flex: 1,
        }}
        text2Props={{
          numberOfLines: 0,
        }}
      />
    );
  },
};