import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../theme';

const LoginScreen = ({ navigation }) => {
  const { login, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const passwordRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
    // Navigation handled by AuthContext → AppNavigator
  };

  return (
    <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ styles.flex }>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
        style={ styles.flex }
      >
        <ScrollView
          contentContainerStyle={ styles.scrollContent }
          showsVerticalScrollIndicator={ false }
          keyboardShouldPersistTaps="always"
        >
          {/* Back button */ }
          <Pressable
            onPress={ () => navigation.goBack() }
            style={ styles.backBtn }
          >
            <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
          </Pressable>

          {/* Logo */ }
          <View style={ styles.logoContainer }>
            <Image
              source={ require('../../../assets/logo-header.jpg') }
              style={ styles.logoImage }
              contentFit="contain"
              transition={ 300 }
            />
          </View>

          {/* Title */ }
          <Text style={ styles.title }>Welcome Back</Text>
          <Text style={ styles.subtitle }>Sign in to continue your journey</Text>

          {/* Form */ }
          <View style={ styles.form }>
            <InputField
              label="Email Address"
              value={ email }
              onChangeText={ setEmail }
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={ false }
              returnKeyType="next"
              onSubmitEditing={ () => passwordRef.current?.focus() }
              error={ errors.email }
            />
            <InputField
              label="Password"
              inputRef={ passwordRef }
              value={ password }
              onChangeText={ setPassword }
              placeholder="Enter your password"
              icon="lock-closed-outline"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              autoCorrect={ false }
              returnKeyType="done"
              onSubmitEditing={ handleLogin }
              error={ errors.password }
            />

            <Pressable style={ styles.forgotBtn } onPress={ () => navigation.navigate('ForgotPassword') }>
              <Text style={ styles.forgotText }>Forgot Password?</Text>
            </Pressable>

            <GradientButton
              title="SIGN IN"
              onPress={ handleLogin }
              loading={ authLoading }
              size="large"
              style={ styles.submitBtn }
            />

            {/* Divider */ }
            <View style={ styles.divider }>
              <View style={ styles.dividerLine } />
              <Text style={ styles.dividerText }>or</Text>
              <View style={ styles.dividerLine } />
            </View>

            {/* Social Login */ }
            <View style={ styles.socialRow }>
              <Pressable style={ styles.socialBtn }>
                <Ionicons name="logo-google" size={ 22 } color="#ea4335" />
              </Pressable>
              <Pressable style={ styles.socialBtn }>
                <Ionicons name="logo-apple" size={ 22 } color={ Colors.textPrimary } />
              </Pressable>
              <Pressable style={ styles.socialBtn }>
                <Ionicons name="call-outline" size={ 22 } color={ Colors.primary } />
              </Pressable>
            </View>
          </View>

          {/* Sign up link */ }
          <View style={ styles.signupRow }>
            <Text style={ styles.signupLabel }>Don't have an account? </Text>
            <Pressable onPress={ () => navigation.navigate('Signup') }>
              <Text style={ styles.signupLink }>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoImage: {
    width: 220,
    height: 147,
    borderRadius: BorderRadius.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: {},
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xxl,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  submitBtn: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: Spacing.xxxl,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundPaper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default LoginScreen;
