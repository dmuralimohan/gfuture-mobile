import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows, Gradients } from '../../theme';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'wallet-outline', label: 'Wallet & Credits', route: 'Wallet', color: Colors.success },
      { icon: 'receipt-outline', label: 'My Orders', route: 'Orders', color: Colors.primary },
      { icon: 'pricetag-outline', label: 'Offers & Deals', route: 'Offers', color: Colors.accentOrange },
      { icon: 'layers-outline', label: 'Plans & Pricing', route: 'Plans', color: Colors.accentCyan },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: 'card-outline', label: 'Payment Methods', route: null, color: Colors.accentPink },
      { icon: 'location-outline', label: 'Addresses', route: null, color: Colors.accentGreen },
      { icon: 'notifications-outline', label: 'Notifications', route: 'NotificationsTab', color: Colors.accentOrange },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'shield-checkmark-outline', label: 'Privacy & Security', route: null, color: Colors.primary },
      { icon: 'help-circle-outline', label: 'Help & Support', route: null, color: Colors.accentCyan },
      { icon: 'information-circle-outline', label: 'About GFuture', route: null, color: Colors.textSecondary },
    ],
  },
];

const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, logout, updateProfile, authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Sync form with user data when it loads or changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await walletService.getWallet();
      setWallet(data.wallet);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handleSave = async () => {
    const result = await updateProfile(form);
    if (result.success) {
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={ [styles.container, styles.centerContent] }>
        <Ionicons name="person-circle-outline" size={ 80 } color={ Colors.textMuted } />
        <Text style={ styles.signInTitle }>Sign in to view profile</Text>
        <GradientButton
          title="SIGN IN"
          onPress={ () => navigation.navigate('Login') }
          size="medium"
          style={ { marginTop: Spacing.xl } }
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={ styles.container }
      showsVerticalScrollIndicator={ false }
      contentContainerStyle={ { paddingBottom: 120 } }
    >
      {/* Profile Header */ }
      <LinearGradient
        colors={ Gradients.primary }
        style={ [styles.profileHeader, { paddingTop: insets.top + 20 }] }
      >
        <View style={ styles.avatarLarge }>
          <Text style={ styles.avatarLargeText }>
            { user?.name?.[0]?.toUpperCase() || 'U' }
          </Text>
        </View>
        <Text style={ styles.profileName }>{ user?.name }</Text>
        <Text style={ styles.profileEmail }>{ user?.email }</Text>
        <View style={ styles.roleBadge }>
          <Ionicons
            name={ user?.role === 'provider' ? 'briefcase' : 'person' }
            size={ 14 }
            color={ Colors.textWhite }
          />
          <Text style={ styles.roleText }>
            { user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) }
          </Text>
        </View>
      </LinearGradient>

      {/* Wallet Quick View */ }
      <TouchableOpacity
        style={ [styles.walletPreview, Shadows.md] }
        onPress={ () => navigation.navigate('Wallet') }
        activeOpacity={ 0.85 }
      >
        <View style={ styles.walletLeft }>
          <View style={ styles.walletIconBg }>
            <Ionicons name="wallet" size={ 22 } color={ Colors.primary } />
          </View>
          <View>
            <Text style={ styles.walletLabel }>Wallet Balance</Text>
            <Text style={ styles.walletAmount }>
              ₹{ (wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
            </Text>
          </View>
        </View>
        <View style={ styles.walletRight }>
          <View style={ styles.creditsSmall }>
            <Ionicons name="star" size={ 14 } color={ Colors.accentOrange } />
            <Text style={ styles.creditsSmallText }>{ wallet?.credit_points || 0 } pts</Text>
          </View>
          <Ionicons name="chevron-forward" size={ 18 } color={ Colors.textMuted } />
        </View>
      </TouchableOpacity>

      {/* Edit Profile */ }
      <View style={ styles.section }>
        <View style={ styles.sectionHeader }>
          <Text style={ styles.sectionTitle }>Personal Information</Text>
          <TouchableOpacity onPress={ () => setEditing(!editing) }>
            <Text style={ styles.editBtn }>{ editing ? 'Cancel' : 'Edit' }</Text>
          </TouchableOpacity>
        </View>

        { editing ? (
          <View>
            <InputField
              label="Name"
              value={ form.name }
              onChangeText={ (v) => setForm((p) => ({ ...p, name: v })) }
              icon="person-outline"
              autoCapitalize="words"
            />
            <InputField
              label="Email"
              value={ form.email }
              onChangeText={ (v) => setForm((p) => ({ ...p, email: v })) }
              icon="mail-outline"
              keyboardType="email-address"
            />
            <InputField
              label="Phone"
              value={ form.phone }
              onChangeText={ (v) => setForm((p) => ({ ...p, phone: v })) }
              icon="call-outline"
              keyboardType="phone-pad"
            />
            <GradientButton
              title="SAVE CHANGES"
              onPress={ handleSave }
              loading={ authLoading }
              size="medium"
              style={ { marginTop: Spacing.md } }
            />
          </View>
        ) : (
          <View style={ styles.infoRows }>
            <InfoRow icon="person-outline" label="Name" value={ user?.name } />
            <InfoRow icon="mail-outline" label="Email" value={ user?.email } />
            <InfoRow icon="call-outline" label="Phone" value={ user?.phone } />
          </View>
        ) }
      </View>

      {/* Menu Sections */ }
      { MENU_SECTIONS.map((section, sIdx) => (
        <View key={ sIdx } style={ styles.section }>
          <Text style={ styles.menuSectionTitle }>{ section.title }</Text>
          { section.items.map((item, index) => (
            <TouchableOpacity
              key={ index }
              style={ styles.menuItem }
              onPress={ () => item.route && navigation.navigate(item.route) }
            >
              <View style={ styles.menuItemLeft }>
                <View style={ [styles.menuIcon, { backgroundColor: `${item.color}15` }] }>
                  <Ionicons name={ item.icon } size={ 20 } color={ item.color } />
                </View>
                <Text style={ styles.menuLabel }>{ item.label }</Text>
              </View>
              <Ionicons name="chevron-forward" size={ 18 } color={ Colors.textMuted } />
            </TouchableOpacity>
          )) }
        </View>
      )) }

      {/* Logout */ }
      <View style={ styles.section }>
        <TouchableOpacity style={ styles.logoutBtn } onPress={ handleLogout }>
          <Ionicons name="log-out-outline" size={ 22 } color={ Colors.accentRed } />
          <Text style={ styles.logoutText }>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={ styles.version }>GFuture v1.0.0</Text>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={ styles.infoRow }>
    <Ionicons name={ icon } size={ 18 } color={ Colors.textMuted } />
    <View style={ styles.infoContent }>
      <Text style={ styles.infoLabel }>{ label }</Text>
      <Text style={ styles.infoValue }>{ value || '—' }</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDefault,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textWhite,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textWhite,
  },

  // Wallet Preview
  walletPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    marginTop: -20,
    padding: Spacing.lg,
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  walletAmount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  walletRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creditsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  creditsSmallText: { fontSize: 12, fontWeight: '700', color: '#92400e' },

  // Section
  section: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Info rows
  infoRows: {
    gap: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },

  // Menu
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentRed,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
});

export default ProfileScreen;
