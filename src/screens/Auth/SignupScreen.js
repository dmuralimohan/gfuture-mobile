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
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius } from '../../theme';

const SignupScreen = ({ navigation }) => {
  const { signup, authLoading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState('customer');
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Invalid phone';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords don\'t match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const result = await signup({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role,
    });
    if (!result.success) {
      Alert.alert('Signup Failed', result.message);
    }
  };

  return (
    <LinearGradient colors={['#dbeafe', '#eff6ff', '#f0f4ff']} style={styles.flex}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>

          {/* Header */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the GFuture community and start earning
          </Text>

          {/* Role Toggle */}
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
              onPress={() => setRole('customer')}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={role === 'customer' ? Colors.textWhite : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleText,
                  role === 'customer' && styles.roleTextActive,
                ]}
              >
                Customer
              </Text>
            </Pressable>
            <Pressable
              style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
              onPress={() => setRole('provider')}
            >
              <Ionicons
                name="briefcase-outline"
                size={18}
                color={role === 'provider' ? Colors.textWhite : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.roleText,
                  role === 'provider' && styles.roleTextActive,
                ]}
              >
                Provider
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Full Name"
              value={form.name}
              onChangeText={(v) => update('name', v)}
              placeholder="John Doe"
              icon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name}
            />
            <InputField
              label="Email"
              inputRef={emailRef}
              value={form.email}
              onChangeText={(v) => update('email', v)}
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              error={errors.email}
            />
            <InputField
              label="Phone Number"
              inputRef={phoneRef}
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="+91 98765 43210"
              icon="call-outline"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.phone}
            />
            <InputField
              label="Password"
              inputRef={passwordRef}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="Min 6 characters"
              icon="lock-closed-outline"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              error={errors.password}
            />
            <InputField
              label="Confirm Password"
              inputRef={confirmRef}
              value={form.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              placeholder="Re-enter password"
              icon="shield-checkmark-outline"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              error={errors.confirmPassword}
            />

            <GradientButton
              title="CREATE ACCOUNT"
              onPress={handleSignup}
              loading={authLoading}
              size="large"
              style={styles.submitBtn}
            />
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xxl,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTextActive: {
    color: Colors.textWhite,
  },
  form: {},
  submitBtn: {
    width: '100%',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  loginLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default SignupScreen;
