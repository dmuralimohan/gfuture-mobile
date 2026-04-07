import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import GradientButton from '../../components/GradientButton';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { orderService, walletService, offerService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows, Gradients } from '../../theme';

const CheckoutScreen = ({ navigation }) => {
  const { items, subtotal, platformFee, deliveryFee, total, clearCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [useWalletPay, setUseWalletPay] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [address, setAddress] = useState({
    street: '123, Main Street',
    detail: 'kodaikanal',
  });
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await walletService.getWallet();
      setWallet(data.wallet);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const creditDiscount = useCredits ? Math.min((wallet?.credit_points || 0) * 0.5, total) : 0;
  const walletCanCover = (wallet?.balance || 0) >= (total - discount - creditDiscount);
  const finalTotal = Math.max(0, total - discount - creditDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await offerService.apply(couponCode.trim(), subtotal);
      setDiscount(data.discount || 0);
      Alert.alert('Coupon Applied!', `You saved ₹${data.discount}`);
    } catch (e) {
      Alert.alert('Invalid Coupon', e.response?.data?.message || 'Coupon is not valid');
    }
  };

  const handleOrder = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first.');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        serviceId: item.id,
        quantity: item.quantity,
      }));

      await orderService.create({
        items: orderItems,
        address,
        note,
      });

      await clearCart();
      Alert.alert(
        'Order Placed! 🎉',
        'Your order has been placed successfully.',
        [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }],
      );
    } catch (e) {
      Alert.alert(
        'Order Failed',
        e.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ styles.container }>
      <ScreenHeader
        title="ORDER"
        onBack={ () => navigation.goBack() }
        rightIcon="heart-outline"
      />

      <ScrollView
        showsVerticalScrollIndicator={ false }
        contentContainerStyle={ styles.scrollContent }
      >
        {/* Delivery Tab */ }
        <View style={ styles.deliveryTab }>
          <TouchableOpacity style={ [styles.tab, styles.tabActive] }>
            <Text style={ styles.tabActiveText }>Deliver</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address Card */ }
        <View style={ [styles.addressCard, Shadows.sm] }>
          <Text style={ styles.sectionTitle }>Delivery Address</Text>
          <Text style={ styles.addressMain }>{ address.street }</Text>
          <Text style={ styles.addressDetail }>{ address.detail }</Text>
          <View style={ styles.addressActions }>
            <TouchableOpacity style={ styles.actionChip }>
              <Ionicons name="create-outline" size={ 16 } color={ Colors.textSecondary } />
              <Text style={ styles.actionChipText }>Edit Address</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ styles.actionChip }
              onPress={ () => setShowNote(!showNote) }
            >
              <Ionicons name="document-text-outline" size={ 16 } color={ Colors.textSecondary } />
              <Text style={ styles.actionChipText }>Add Note</Text>
            </TouchableOpacity>
          </View>

          { showNote && (
            <TextInput
              style={ styles.noteInput }
              placeholder="Add delivery instructions..."
              placeholderTextColor={ Colors.textMuted }
              value={ note }
              onChangeText={ setNote }
              multiline
            />
          ) }

          <View style={ styles.divider } />

          {/* Cart Items */ }
          { items.map((item) => (
            <View key={ item.cartKey } style={ styles.orderItem }>
              <Image
                source={ { uri: item.image } }
                style={ styles.orderImage }
                contentFit="cover"
              />
              <View style={ styles.orderInfo }>
                <Text style={ styles.orderName } numberOfLines={ 1 }>
                  { item.name }
                </Text>
                <Text style={ styles.orderMeta }>
                  { item.selectedSize ? `${item.selectedSize} • ` : '' }
                  { item.duration || 'Standard' }
                </Text>
              </View>
              <View style={ styles.orderQty }>
                <TouchableOpacity
                  style={ styles.qtyBtn }
                  onPress={ () => updateQuantity(item.cartKey, item.quantity - 1) }
                >
                  <Ionicons name="remove" size={ 14 } color={ Colors.textSecondary } />
                </TouchableOpacity>
                <Text style={ styles.qtyText }>{ item.quantity }</Text>
                <TouchableOpacity
                  style={ styles.qtyBtn }
                  onPress={ () => updateQuantity(item.cartKey, item.quantity + 1) }
                >
                  <Ionicons name="add" size={ 14 } color={ Colors.primary } />
                </TouchableOpacity>
              </View>
            </View>
          )) }
        </View>

        {/* Coupon / Discount */ }
        <View style={ [styles.couponCard, Shadows.sm] }>
          <View style={ styles.couponRow }>
            <Ionicons name="pricetag" size={ 20 } color={ Colors.accentOrange } />
            <TextInput
              style={ styles.couponInput }
              placeholder="Enter coupon code"
              placeholderTextColor={ Colors.textMuted }
              value={ couponCode }
              onChangeText={ setCouponCode }
              autoCapitalize="characters"
            />
            <TouchableOpacity style={ styles.applyBtn } onPress={ handleApplyCoupon }>
              <Text style={ styles.applyBtnText }>APPLY</Text>
            </TouchableOpacity>
          </View>
          { discount > 0 && (
            <View style={ styles.couponApplied }>
              <Ionicons name="checkmark-circle" size={ 16 } color={ Colors.success } />
              <Text style={ styles.couponAppliedText }>You save ₹{ discount }!</Text>
            </View>
          ) }
        </View>

        {/* Wallet Payment Option */ }
        { wallet && (
          <View style={ [styles.walletPayCard, Shadows.sm] }>
            <View style={ styles.walletPayHeader }>
              <LinearGradient
                colors={ ['#1a3af5', '#6366f1'] }
                style={ styles.walletPayIcon }
              >
                <Ionicons name="wallet" size={ 18 } color="#fff" />
              </LinearGradient>
              <View style={ { flex: 1 } }>
                <Text style={ styles.walletPayTitle }>Pay with Wallet</Text>
                <Text style={ styles.walletPayBalance }>
                  Balance: ₹{ (wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
                </Text>
              </View>
              <Switch
                value={ useWalletPay }
                onValueChange={ setUseWalletPay }
                trackColor={ { false: '#e5e7eb', true: Colors.primaryLight } }
                thumbColor={ useWalletPay ? Colors.primary : '#f4f4f5' }
              />
            </View>

            { useWalletPay && wallet.credit_points > 0 && (
              <View style={ styles.creditsToggle }>
                <View style={ styles.creditsInfo }>
                  <Ionicons name="star" size={ 16 } color={ Colors.accentOrange } />
                  <Text style={ styles.creditsLabel }>
                    Use { wallet.credit_points } credit points (−₹{ (wallet.credit_points * 0.5).toFixed(2) })
                  </Text>
                </View>
                <Switch
                  value={ useCredits }
                  onValueChange={ setUseCredits }
                  trackColor={ { false: '#e5e7eb', true: '#fbbf24' } }
                  thumbColor={ useCredits ? Colors.accentOrange : '#f4f4f5' }
                />
              </View>
            ) }

            { useWalletPay && !walletCanCover && (
              <View style={ styles.walletWarning }>
                <Ionicons name="alert-circle" size={ 14 } color={ Colors.accentOrange } />
                <Text style={ styles.walletWarningText }>
                  Insufficient wallet balance. Remaining will be charged via other payment.
                </Text>
              </View>
            ) }
          </View>
        ) }

        {/* Payment Summary */ }
        <View style={ [styles.paymentSummary, Shadows.sm] }>
          <Text style={ [styles.sectionTitle, { marginBottom: Spacing.lg }] }>
            Payment Summary
          </Text>
          <View style={ styles.summaryRow }>
            <Text style={ styles.summaryLabel }>Price</Text>
            <Text style={ styles.summaryValue }>
              ₹{ subtotal.toLocaleString('en-IN') }
            </Text>
          </View>
          <View style={ styles.summaryRow }>
            <Text style={ styles.summaryLabel }>Delivery Fee</Text>
            <View style={ styles.deliveryPriceRow }>
              { deliveryFee === 0 && (
                <Text style={ styles.strikethrough }>₹49</Text>
              ) }
              <Text style={ styles.summaryValue }>
                { deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}` }
              </Text>
            </View>
          </View>
          <View style={ styles.summaryRow }>
            <Text style={ styles.summaryLabel }>Platform Fee</Text>
            <Text style={ styles.summaryValue }>₹{ platformFee.toFixed(2) }</Text>
          </View>
          { discount > 0 && (
            <View style={ styles.summaryRow }>
              <Text style={ [styles.summaryLabel, { color: Colors.success }] }>Coupon Discount</Text>
              <Text style={ [styles.summaryValue, { color: Colors.success }] }>−₹{ discount }</Text>
            </View>
          ) }
          { creditDiscount > 0 && (
            <View style={ styles.summaryRow }>
              <Text style={ [styles.summaryLabel, { color: Colors.accentOrange }] }>Credit Points</Text>
              <Text style={ [styles.summaryValue, { color: Colors.accentOrange }] }>−₹{ creditDiscount.toFixed(2) }</Text>
            </View>
          ) }
          <View style={ [styles.summaryRow, styles.totalRow] }>
            <Text style={ styles.totalLabel }>Total</Text>
            <Text style={ styles.totalValue }>₹{ finalTotal.toLocaleString('en-IN') }</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */ }
      <View style={ [styles.bottomBar, Shadows.lg] }>
        <View style={ styles.paymentMethod }>
          <Ionicons
            name={ useWalletPay ? 'wallet' : 'wallet-outline' }
            size={ 24 }
            color={ useWalletPay ? Colors.primary : Colors.textSecondary }
          />
          <View>
            <Text style={ styles.payMethodLabel }>
              { useWalletPay ? 'Wallet Payment' : 'Cash/Pay Online' }
            </Text>
            <Text style={ styles.payMethodAmount }>
              ₹{ finalTotal.toLocaleString('en-IN') }
            </Text>
          </View>
          { (discount > 0 || creditDiscount > 0) && (
            <View style={ styles.savedBadge }>
              <Text style={ styles.savedBadgeText }>
                Saved ₹{ (discount + creditDiscount).toFixed(0) }
              </Text>
            </View>
          ) }
        </View>
        <GradientButton
          title={ useWalletPay ? 'PAY WITH WALLET' : 'ORDER' }
          onPress={ handleOrder }
          loading={ loading }
          size="large"
          style={ styles.orderBtn }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDefault,
  },
  scrollContent: {
    paddingBottom: 200,
  },

  // Delivery tab
  deliveryTab: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  tab: {
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundPaper,
    alignItems: 'center',
  },
  tabActive: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: '#eff4ff',
  },
  tabActiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Address
  addressCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  addressMain: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  noteInput: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 60,
    marginBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },

  // Order items
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ffcccc',
  },
  orderImage: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: '#e5e7eb',
  },
  orderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  orderName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orderQty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Coupon & Wallet
  couponCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  couponInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  couponAppliedText: { fontSize: 13, fontWeight: '600', color: Colors.success },

  walletPayCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  walletPayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletPayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletPayTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  walletPayBalance: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  creditsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderLight,
  },
  creditsInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  creditsLabel: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  walletWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  walletWarningText: { fontSize: 11, color: '#92400e', flex: 1 },

  // Payment Summary
  paymentSummary: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deliveryPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethrough: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.success },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundPaper,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: 36,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  payMethodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  payMethodAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.success,
  },
  savedBadge: {
    marginLeft: 'auto',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  savedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  orderBtn: {
    width: '100%',
  },
});

export default CheckoutScreen;
