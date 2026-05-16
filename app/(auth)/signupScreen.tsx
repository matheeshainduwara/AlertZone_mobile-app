import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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

// Firebase Imports
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';


export default function RegisterScreen() {
  const router = useRouter();
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Form Data States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Refs for keyboard "Next" flow
  const emailRef        = useRef<TextInput>(null);
  const phoneRef        = useRef<TextInput>(null);
  const passwordRef     = useRef<TextInput>(null);
  const confirmPassRef  = useRef<TextInput>(null);

const validatePassword = (password:string) => {
  let isValidPassword= true;

  // Minimum 8 characters
  if (!/.{8,}/.test(password)) {
    Toast.show({
      type: "error",
      text1: "Password too short",
      text2: "Password must be at least 8 characters long.",
    });
    isValidPassword= false;
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    Toast.show({
      type: "error",
      text1: "Missing Uppercase",
      text2: "Password must contain at least one uppercase letter.",
    });
    isValidPassword= false;
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    Toast.show({
      type: "error",
      text1: "Missing Number",
      text2: "Password must contain at least one number.",
    });
    isValidPassword= false;
  }

  return isValidPassword;
};

  const handleSignUp = async () => {
    if (!fullName || !email || !phone || !password) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in all fields to join AlertZone.' });
      return;
    }
    if (!validatePassword(password)) {
        // If invalid, stop further execution
        return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Password Error', text2: 'Passwords do not match.' });
      setConfirmPassword('');
      return;
    }
    if (!agreeTerms) {
      Toast.show({ type: 'error', text1: 'Terms Required', text2: 'You must agree to the Terms of Services to proceed.' });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phoneNumber: phone,
        role: 'citizen', 
        createdAt: new Date().toISOString(),
        uid: user.uid,
        status: 'active',
        isVerified: false
      });

      console.log("✅ Citizen Registered & Verification Link Sent");
      Toast.show({ type: 'success', text1: 'Registration Successful', text2: "Verify your email" });
      setLoading(false);
      setIsSuccessModalVisible(true);

    } catch (error: any) {
      console.error("❌ Firebase Error:", error.code);
      setLoading(false);
      
      let message = "An error occurred during sign up.";
      if (error.code === 'auth/email-already-in-use')  message = "This email is already in use.";
      if (error.code === 'auth/invalid-email')         message = "Please enter a valid email address.";
      if (error.code === 'auth/weak-password')         message = "Password should be at least 6 characters.";

      Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: message });
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
        >
          <View className="flex-1 px-8 pt-12 pb-10 justify-center">
            
            {/* Header */}
            <View className="items-center mb-6">
              <Image source={require('../../assets/images/iconAlerZone-Bg-none.png')} className="w-20 h-20" resizeMode="contain" />
              <Text className="text-white text-3xl font-bold mt-4">Create Account</Text>
              <Text className="text-gray-400 mt-1">Get started with AlertZone.</Text>
            </View>

            {/* Inputs Section */}
            <View className="space-y-2">
              {/* Full Name */}
              <View className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center">
                    <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                    <Ionicons name="person-outline" size={20} color="#30A89C" />
                  </View>

                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Full Name:</Text>
                  <TextInput
                    placeholder="John Snow"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Email */}
              <View className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3">
                  <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                      <Ionicons name="mail-outline" size={20} color="#30A89C" />
                  </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">E-mail:</Text>
                  <TextInput
                    ref={emailRef}
                    placeholder="john@email.com"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Phone */}
              <View className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3">
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                    <Ionicons name="call-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Phone Number:</Text>
                  <TextInput
                    ref={phoneRef}
                    placeholder="+94 7X XXX XXXX"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Password */}
              <View className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3">
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                    <Ionicons name="call-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Password:</Text>
                  <TextInput
                    ref={passwordRef}
                    placeholder="••••••••••••"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPassRef.current?.focus()}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#30A89C" />
                </Pressable>
              </View>

              {/* Confirm Password */}
                <View className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3">
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1 ">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Confirm Password:</Text>
                  <TextInput
                    ref={confirmPassRef}
                    placeholder="••••••••••••"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                   <Ionicons name={showConfirmPassword ? "eye-outline": "eye-off-outline"} size={20} color="#30A89C" />
                </Pressable>
              </View>
            </View>


            <View className="mt-2 px-1">
                <Text className="text-gray-400 text-sm">
                    Password must be at least 8 characters long, include an uppercase letter and a number.
                </Text>
            </View>

            {/* Terms Checkbox */}
            <View className="flex-row items-center mt-4 px-1">
              <Pressable
                className={`w-5 h-5 rounded border ${agreeTerms ? 'bg-[#30A89C] border-[#30A89C]' : 'border-gray-500'} items-center justify-center`}
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                {agreeTerms && <Ionicons name="checkmark" size={14} color="white" />}
              </Pressable>
              <Text className="text-gray-400 ml-2 text-sm">
                I agree to the <Text className="text-[#30A89C] font-bold">Terms of Services</Text>
              </Text>
            </View>

            {/* Primary Action Buttons */}
            <View className="mt-6">
              <Pressable
                className={`p-4 rounded-full shadow-lg items-center ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#122D36" /> : <Text className="text-[#122D36] text-center font-bold text-lg">Sign Up</Text>}
              </Pressable>

              <Text className="text-gray-500 text-center my-4">or sign up with</Text>

              <Pressable className="bg-[#1E3A44] border border-[#2D4F5C] p-4 rounded-2xl flex-row justify-center items-center active:opacity-80">
                <Ionicons name="logo-google" size={20} color="white" />
                <Text className="text-white font-semibold ml-3">Continue with Google</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-400">Already have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/loginScreen")} className='active:opacity-70'>
                <Text className="text-[#4CC2D1] font-bold">Log In</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- SUCCESS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSuccessModalVisible}
      >
        {/* Replaced BlurView with simple View to fix ViewManager crash */}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <View className="bg-[#1E3A44] border border-[#30A89C] rounded-3xl p-8 w-full items-center shadow-2xl">
            
            <View className="bg-[#30A89C]/20 p-5 rounded-full mb-6">
              <Ionicons name="mail-unread-outline" size={60} color="#4CC2D1" />
            </View>

            <Text className="text-white text-2xl font-bold text-center">
              Verify Your Email
            </Text>
            
            <Text className="text-gray-300 text-center mt-4 leading-6">
              A verification link has been sent to:{"\n"}
              <Text className="text-[#4CC2D1] font-bold">{email}</Text>
            </Text>

            <Text className="text-gray-400 text-xs text-center mt-6 italic">
              Please check your inbox (and spam folder) before logging in.
            </Text>

            <View className="space-y-3 mb-6 active:opacity-70">
              <Pressable 
                className="border border-gray-500 p-4 rounded-xl mt-3 mb-3"
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.replace("/(auth)/loginScreen");
                }}
              >
                <Text className="text-gray-300 text-center font-medium">
                  Proceed to Login
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}