import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFromStorage, setIsPasswordFromStorage] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Pre-fill email/password if Remember Me was previously saved
  useEffect(() => {
    AsyncStorage.getItem('rememberMeData').then((json) => {
      if (json) {
        try {
          const data = JSON.parse(json);
          setEmail(data.email || '');
          setPassword(data.password || '');
          setRememberMe(true);
          if (data.password) setIsPasswordFromStorage(true);
        } catch (e) {
          // Fallback if it was just a string (old format)
          setEmail(json);
          setRememberMe(true);
        }
      }
    });
  }, []);

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

       // 2. Save or clear Remember Me
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMeData', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberMeData');
      }

      // 3. Fetch user profile from Firestore to get their name for the welcome toast
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${userData.fullName}! 👋`,
        });

       // 5. Navigate to home after a short delay so user sees the toast

        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1000);

      } else {
        // Auth worked but no Firestore profile — navigate anyway
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });
        setTimeout(() => {
          router.replace('/(tabs)/home');
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
              <Text className="text-white text-3xl font-bold mt-4">Welcome Back!</Text>
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
              <Pressable 
                className={`p-4 rounded-full shadow-lg items-center active:opacity-70 ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#122D36" />
                ) : (
                  <Text className="text-[#122D36] text-center font-bold text-lg">Log In</Text>
                )}
              </Pressable>

              <Text className="text-gray-500 text-center my-6">or Log in with</Text>

              <Pressable className="bg-[#1E3A44] border border-[#2D4F5C] p-4 rounded-2xl flex-row justify-center items-center active:opacity-80">
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
    </LinearGradient>
  );
}