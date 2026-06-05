import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../config/authConfig';

let GoogleSignin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  console.warn('⚠️ Google Sign-In not available in this environment');
}

export default function LoginScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFromStorage, setIsPasswordFromStorage] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  const passwordRef = useRef<TextInput>(null);

  // Pre-fill email if Remember Me was previously saved & securely purge legacy password data
  useEffect(() => {
    // Purge old format containing passwords if present
    AsyncStorage.getItem('rememberMeData').then((json) => {
      if (json) {
        try {
          const data = JSON.parse(json);
          if (data.email) {
            setEmail(data.email);
            setRememberMe(true);
            AsyncStorage.setItem('rememberMeEmail', data.email);
          }
        } catch (e) {
          setEmail(json);
          setRememberMe(true);
          AsyncStorage.setItem('rememberMeEmail', json);
        }
        AsyncStorage.removeItem('rememberMeData');
      }
    });

    // Load new secure format
    AsyncStorage.getItem('rememberMeEmail').then((val) => {
      if (val) {
        setEmail(val);
        setRememberMe(true);
      }
    });
  }, []);

  // Biometrics availability check
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricEnrolled(enrolled);
      }
      
      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');
      if (storedCreds) {
        setHasBiometricSetup(true);
        // Automatically prompt biometrics if it was previously configured
        setTimeout(() => {
          handleBiometricAuth();
        }, 800);
      }
    })();
  }, []);

  // Configure Google Sign-In
  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: '52846862990-munbgn67do5e6v9ehr20d3edclao5m6g.apps.googleusercontent.com',
        offlineAccess: true,
      });
    }
  }, []);

  // Securely request biometric validation and sign in
  const handleBiometricAuth = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return;

      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');
      if (!storedCreds) return;

      const { email: savedEmail, password: savedPassword } = JSON.parse(storedCreds);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to AlertZone',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLoading(true);
        setEmail(savedEmail);
        setPassword(savedPassword);

        const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        const uid = userCredential.user.uid;
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.lastPasswordChange) {
            await AsyncStorage.setItem('lastPasswordChangeLocal', userData.lastPasswordChange);
          } else {
            await AsyncStorage.removeItem('lastPasswordChangeLocal');
          }
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: `Welcome, ${userData.fullName}!`,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome!',
          });
        }
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Biometrics auth error:', error);
      Toast.show({
        type: 'error',
        text1: 'Biometrics Failed',
        text2: 'Could not log in using biometrics. Please enter password.',
      });
      setLoading(false);
    }
  };

  // Check and prompt to enable biometric login
  const navigateToHomeWithBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');

      if (compatible && enrolled && !storedCreds) {
        setPendingCredentials({ email, password });
        setShowBiometricPrompt(true);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch {
      router.replace('/(tabs)/home');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
         Toast.show({
        type: 'error',
        text1: 'Incomplete Details',
        text2: 'Email and password are required to continue.',
         });
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

       // 2. Save or clear Remember Me (only storing email for security)
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMeEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMeEmail');
      }

      // 3. Fetch user profile from Firestore to get their name for the welcome toast
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.lastPasswordChange) {
          await AsyncStorage.setItem('lastPasswordChangeLocal', userData.lastPasswordChange);
        } else {
          await AsyncStorage.removeItem('lastPasswordChangeLocal');
        }

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${userData.fullName}! 👋`,
        });

        setTimeout(() => {
          navigateToHomeWithBiometrics();
        }, 1000);

      } else {
        // Auth worked but no Firestore profile — navigate anyway
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });
        setTimeout(() => {
          navigateToHomeWithBiometrics();
        }, 1000);
      }

    } catch (error: any) {
        console.error('❌ Login Error:', error.code);

      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/network-request-failed') errorMessage = 'Network error. Check your connection.';
      if (error.code === 'auth/too-many-requests')      errorMessage = 'Too many attempts. Try again later.';
      if (error.code === 'auth/user-disabled')          errorMessage = 'This account has been disabled.';

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });

        setPassword('');
        setRememberMe(false);

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GoogleSignin) {
      Toast.show({
        type: 'error',
        text1: 'Not Supported in Expo Go',
        text2: 'Please test this on the compiled native APK build.',
      });
      return;
    }
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token found from Google Sign-In');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Fetch user profile from Firestore to see if it is complete
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let isProfileComplete = false;
      if (userDoc.exists()) {
        const userData = userDoc.data();
        isProfileComplete = !!(
          userData.fullName &&
          userData.phoneNumber &&
          userData.nic &&
          userData.province &&
          userData.district &&
          userData.localGovernmentArea
        );
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${userData.fullName}! 👋`,
        });
      } else {
        // First-time Google user: initialize a partial user document
        await setDoc(doc(db, 'users', user.uid), {
          fullName: user.displayName || '',
          email: user.email || '',
          phoneNumber: '',
          role: 'citizen',
          createdAt: new Date().toISOString(),
          uid: user.uid,
          status: 'active',
          isVerified: false,
          nic: '',
          province: '',
          district: '',
          localGovernmentArea: '',
          level: 1,
          contributionPoints: 0,
          reportsValidated: 0,
        });
        Toast.show({
          type: 'success',
          text1: 'Google Auth Successful',
          text2: 'Please complete your profile details.',
        });
      }

      // Refresh the context profile details
      await refreshProfile();

      setTimeout(() => {
        if (isProfileComplete) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/completeProfile' as any);
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Google Auth Error:', error);
      let errorMessage = 'Could not authenticate with Google.';
      if (error.code === '12501' || error.message?.includes('developer error')) {
        errorMessage = 'Developer config error. Check SHA-1 / package name.';
      } else if (error.message?.includes('Sign in cancelled') || error.code === '12502') {
        errorMessage = 'Sign in was cancelled.';
      } else if (error.code === '7') {
        errorMessage = 'Network error. Please try again.';
      }

      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">

      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View className="flex-1 px-8 pt-20 pb-10 justify-center">
            
            {/* 1. Logo Section */}
            <View className="items-center mb-8">
              <Image 
                source={require('../../assets/images/iconAlerZone-Bg-none.png')} 
                className="w-24 h-24"
                resizeMode="contain"
              />
              <Text className="text-white text-3xl font-bold mt-4">Welcome!</Text>
              <Text className="text-gray-400 text-center mt-2">
                Log in to continue making your{"\n"}community safer.
              </Text>
            </View>

            {/* 2. Input Fields */}
            <View className="space-y-4">
            {/* Email Field */}
            <View className={`bg-[#1E3A44] border rounded-2xl flex-row items-center p-1 ${
                isEmailFocused ? "border-[#4CC2D1]" : "border-[#2D4F5C]"
        }`}>
                <View className="px-3 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="mail-outline" size={20} color="#30A89C" />
                </View>
                <View className="flex-1 px-3 py-2">
                   <Text className="text-gray-400 text-xs p-0 m-0">E-mail:</Text>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 m-0"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                 />
                </View>
             </View>

                  {/* Password Field */}
              <View className={`bg-[#1E3A44] border rounded-2xl flex-row items-center p-1 mt-4 ${
                isPasswordFocused ? "border-[#4CC2D1]" : "border-[#2D4F5C]"
                 }`}>
                <View className="px-3 py-3 border-r border-[#2D4F5C] justify-center items-center">
                   <Ionicons name="lock-closed-outline" size={20} color="#30A89C" />
                </View>
                <View className="flex-1 px-3 py-2">
                  <Text className="text-gray-400 text-xs p-0 m-0">Password:</Text>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter your password"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 m-0"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={password}
                    onChangeText={(val) => {
                      if (isPasswordFromStorage) {
                        // Security: If user modifies a stored password, clear it completely
                        // so they cannot backspace and reveal a partial stored password.
                        setPassword('');
                        setIsPasswordFromStorage(false);
                      } else {
                        setPassword(val);
                      }
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <Pressable 
                  onPress={() => {
                    if (isPasswordFromStorage) {
                      Toast.show({
                        type: 'info',
                        text1: 'Password Hidden',
                        text2: 'Type to reveal your password.',
                      });
                      return;
                    }
                    setShowPassword(!showPassword);
                  }} 
                  className="px-3"
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={isPasswordFromStorage ? "#2D4F5C" : "#30A89C"}
                  />
                </Pressable>
              </View>
            </View>

            {/* 3. Remember Me & Forgot Password */}
            <View className="flex-row justify-between items-center mt-4 px-1">
              <Pressable 
                className="flex-row items-center" 
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View className={`w-5 h-5 rounded border ${rememberMe ? 'bg-[#30A89C] border-[#30A89C]' : 'border-gray-500'} items-center justify-center`}>
                     {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-400 ml-2">Remember me</Text>
              </Pressable>
              
              <Pressable
                  onPress={() => router.push("/(auth)/passwordReset")}
                className="active:opacity-70"
              >
                <Text className="text-[#4CC2D1]">Forgot Password?</Text>
              </Pressable>
            </View>

            {/* 4. Action Buttons */}
            <View className="mt-8">
              <View className="flex-row gap-3 items-center">
                <Pressable 
                  className={`flex-1 p-4 rounded-full shadow-lg items-center active:opacity-70 ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#122D36" />
                  ) : (
                    <Text className="text-[#122D36] text-center font-bold text-lg">Log In</Text>
                  )}
                </Pressable>

                {isBiometricSupported && isBiometricEnrolled && hasBiometricSetup && (
                  <Pressable
                    onPress={handleBiometricAuth}
                    className="w-14 h-14 rounded-full bg-[#1E3A44] border border-[#2D4F5C] items-center justify-center active:opacity-80"
                  >
                    <Ionicons name="finger-print" size={26} color="#4CC2D1" />
                  </Pressable>
                )}
              </View>

              <Text className="text-gray-500 text-center my-6">or Log in with</Text>

              <Pressable 
                onPress={handleGoogleLogin}
                disabled={loading}
                className={`bg-[#1E3A44] border border-[#2D4F5C] p-4 rounded-2xl flex-row justify-center items-center active:opacity-80 ${loading ? 'opacity-50' : ''}`}
              >
                <Ionicons name="logo-google" size={20} color="white" className="mr-3" />
                <Text className="text-white font-semibold ml-2">Log In with Google</Text>
              </Pressable>
            </View>

            {/* 5. Footer */}
            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-400">Don't have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/signupScreen")} className="active:opacity-70">
                <Text className="text-[#4CC2D1] font-bold">Create Account</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Visual Custom Biometric Prompt Dialog */}
      <Modal visible={showBiometricPrompt} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View className="bg-[#111E27] w-full max-w-sm rounded-3xl p-6 border border-[#2D4F5C] items-center"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 20 }}
          >
            <View className="w-16 h-16 rounded-full bg-[#1E3A44] items-center justify-center mb-4 border border-[#4CC2D1]/30">
              <Ionicons name="finger-print" size={32} color="#4CC2D1" />
            </View>
            <Text className="text-white text-xl font-bold text-center mb-2">Enable Biometrics</Text>
            <Text className="text-gray-400 text-sm text-center leading-5 mb-6">
              Would you like to log in quickly using Face ID or Fingerprint next time?
            </Text>
            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowBiometricPrompt(false);
                  router.replace('/(tabs)/home');
                }}
                className="flex-1 py-3.5 bg-[#1E3A44] border border-[#2D4F5C] rounded-xl items-center active:opacity-75"
              >
                <Text className="text-gray-400 font-semibold text-sm">Maybe Later</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (pendingCredentials) {
                    await SecureStore.setItemAsync(
                      'biometricCredentials',
                      JSON.stringify(pendingCredentials)
                    );
                    setHasBiometricSetup(true);
                  }
                  setShowBiometricPrompt(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Biometrics Enabled!',
                    text2: 'Fingerprint / Face ID setup complete.',
                  });
                  setTimeout(() => {
                    router.replace('/(tabs)/home');
                  }, 800);
                }}
                className="flex-1 py-3.5 bg-[#4CC2D1] rounded-xl items-center active:opacity-75"
              >
                <Text className="text-[#071318] font-bold text-sm">Enable</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}