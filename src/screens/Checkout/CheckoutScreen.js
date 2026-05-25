import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../components/ScreenHeader';
import GradientButton from '../../components/GradientButton';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { orderService, walletService, offerService, paymentService } from '../../services';
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
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayPayment, setRazorpayPayment] = useState(null);
  const [webviewLoading, setWebviewLoading] = useState(true);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiPayment, setUpiPayment] = useState(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const pollTimerRef = useRef(null);
  const pollAttemptRef = useRef(0);

  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await walletService.getWallet();
      setWallet(data.wallet);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const stopPaymentPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollAttemptRef.current = 0;
    setPaymentPolling(false);
  }, []);

  const finalizePaidOrder = useCallback(async () => {
    await clearCart();
    setShowRazorpayModal(false);
    setRazorpayPayment(null);
    setShowUpiModal(false);
    setUpiPayment(null);
    stopPaymentPolling();
    Alert.alert('Payment Successful', 'Your payment is verified and order is confirmed.', [
      { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
    ]);
  }, [clearCart, navigation, stopPaymentPolling]);

  const checkPaymentStatus = useCallback(async (paymentId, manual = false) => {
    if (!paymentId) return;

    try {
      const { data } = await paymentService.pollStatus(paymentId);
      const status = data?.payment?.status;

      if (status === 'completed') {
        await finalizePaidOrder();
        return;
      }

      if (status === 'failed') {
        stopPaymentPolling();
        setShowUpiModal(false);
        setUpiPayment(null);
        Alert.alert('Payment Failed', 'Payment failed. Please try again from Orders.');
        return;
      }

      if (manual) {
        Alert.alert('Payment Pending', 'We have not received confirmation yet. Please wait a few seconds and try again.');
      }
    } catch {
      if (manual) {
        Alert.alert('Unable to Check', 'Could not fetch payment status right now. Please try again.');
      }
    }
  }, [finalizePaidOrder, stopPaymentPolling]);

  const startPaymentPolling = useCallback((paymentId) => {
    if (!paymentId) return;
    stopPaymentPolling();

    setPaymentPolling(true);
    pollAttemptRef.current = 0;

    pollTimerRef.current = setInterval(() => {
      pollAttemptRef.current += 1;
      checkPaymentStatus(paymentId);

      // Stop polling after ~5 minutes. User can continue from Orders.
      if (pollAttemptRef.current >= 75) {
        stopPaymentPolling();
      }
    }, 4000);
  }, [checkPaymentStatus, stopPaymentPolling]);

  useEffect(() => () => stopPaymentPolling(), [stopPaymentPolling]);

  const creditDiscount = useCredits ? Math.min((wallet?.credit_points || 0) * 0.5, total) : 0;
  const walletCanCover = (wallet?.balance || 0) >= (total - discount - creditDiscount);
  const finalTotal = Math.max(0, total - discount - creditDiscount);

  const buildRazorpayHtml = (payment) => {
    const amountPaise = Math.round((payment?.amount || 0) * 100);
    const razorpayPublicKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || payment?.razorpayKeyId || '';
    const escapedName = JSON.stringify(payment?.customerName || 'GFuture Customer');
    const escapedEmail = JSON.stringify(payment?.customerEmail || '');
    const escapedPhone = JSON.stringify(payment?.customerPhone || '');

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
            }
          </style>
        </head>
        <body>
          <div>Opening secure payment...</div>
          <script>
            (function () {
              var options = {
                key: ${JSON.stringify(razorpayPublicKey)},
                amount: ${amountPaise},
                currency: 'INR',
                name: 'GFuture',
                description: 'Order Payment',
                order_id: ${JSON.stringify(payment?.razorpayOrderId || '')},
                prefill: {
                  name: ${escapedName},
                  email: ${escapedEmail},
                  contact: ${escapedPhone}
                },
                notes: {
                  internal_payment_id: ${JSON.stringify(payment?.id || '')}
                },
                theme: {
                  color: '#1a3af5'
                },
                modal: {
                  ondismiss: function () {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
                  }
                },
                handler: function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'success',
                    payload: response
                  }));
                }
              };

              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'failed',
                  payload: response && response.error ? response.error : {}
                }));
              });
              rzp.open();
            })();
          </script>
        </body>
      </html>
    `;
  };

  const closeRazorpayModalWithWebhookTracking = useCallback((reason = 'dismiss') => {
    const currentPaymentId = razorpayPayment?.id;

    setShowRazorpayModal(false);
    setRazorpayPayment(null);

    if (currentPaymentId) {
      startPaymentPolling(currentPaymentId);
      Alert.alert(
        'Payment Processing',
        'We are checking payment status with Razorpay webhook. You can also track this in Orders.',
      );
      return;
    }

    if (reason === 'failed') {
      Alert.alert('Payment Failed', 'Transaction failed. Please try again.');
      return;
    }

    Alert.alert('Payment Cancelled', 'You can complete payment later from your Orders.');
  }, [razorpayPayment, startPaymentPolling]);

  const handleRazorpayMessage = async (event) => {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data || '{}');
    } catch {
      return;
    }

    if (message.type === 'dismiss') {
      closeRazorpayModalWithWebhookTracking('dismiss');
      return;
    }

    if (message.type === 'failed') {
      closeRazorpayModalWithWebhookTracking('failed');
      return;
    }

    if (message.type === 'success' && razorpayPayment?.id) {
      setLoading(true);
      try {
        const payload = message.payload || {};
        await paymentService.verify({
          paymentId: razorpayPayment.id,
          razorpay_order_id: payload.razorpay_order_id,
          razorpay_payment_id: payload.razorpay_payment_id,
          razorpay_signature: payload.razorpay_signature,
        });

        await finalizePaidOrder();
      } catch (e) {
        closeRazorpayModalWithWebhookTracking('verify_error');
      } finally {
        setLoading(false);
      }
    }
  };

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

      const orderRes = await orderService.create({
        items: orderItems,
        address,
        note,
      });

      const orderId = orderRes?.data?.order?.id;
      if (!orderId) {
        throw new Error('Order ID missing in response');
      }

      if (useWalletPay && walletCanCover) {
        await walletService.pay(orderId, useCredits);
        await clearCart();
        Alert.alert('Payment Successful', 'Paid using wallet and order confirmed.', [
          { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
        ]);
        return;
      }

      const paymentRes = await paymentService.initiate(orderId);
      const payment = paymentRes?.data?.payment;

      if (!payment) {
        throw new Error('Payment initiation failed');
      }

      const razorpayPublicKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || payment.razorpayKeyId;
      if (payment.method === 'razorpay' && payment.razorpayOrderId && razorpayPublicKey) {
        setRazorpayPayment(payment);
        setWebviewLoading(true);
        setShowRazorpayModal(true);
        return;
      }

      if (payment.method === 'upi' && payment.id) {
        setUpiPayment(payment);
        setShowUpiModal(true);
        startPaymentPolling(payment.id);
        return;
      }

      Alert.alert(
        'Payment Initiated',
        'Razorpay is not configured, so fallback payment is enabled. You can complete this payment from your Orders.',
        [{ text: 'Go to Orders', onPress: () => navigation.navigate('Orders') }],
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

      <Modal
        visible={ showRazorpayModal }
        animationType="slide"
        transparent={ false }
        onRequestClose={ () => closeRazorpayModalWithWebhookTracking('dismiss') }
      >
        <View style={ styles.razorpayContainer }>
          <View style={ styles.razorpayHeader }>
            <Text style={ styles.razorpayTitle }>Secure Payment</Text>
            <TouchableOpacity onPress={ () => closeRazorpayModalWithWebhookTracking('dismiss') }>
              <Ionicons name="close" size={ 22 } color={ Colors.textPrimary } />
            </TouchableOpacity>
          </View>

          { razorpayPayment && (
            <WebView
              originWhitelist={ ['*'] }
              source={ { html: buildRazorpayHtml(razorpayPayment) } }
              onMessage={ handleRazorpayMessage }
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onLoadStart={ () => setWebviewLoading(true) }
              onLoadEnd={ () => setWebviewLoading(false) }
            />
          ) }

          { webviewLoading && (
            <View style={ styles.razorpayLoader }>
              <ActivityIndicator size="large" color={ Colors.primary } />
            </View>
          ) }
        </View>
      </Modal>

      <Modal
        visible={ showUpiModal }
        animationType="slide"
        transparent={ false }
        onRequestClose={ () => {
          setShowUpiModal(false);
          stopPaymentPolling();
        } }
      >
        <View style={ styles.upiContainer }>
          <View style={ styles.razorpayHeader }>
            <Text style={ styles.razorpayTitle }>Scan & Pay (UPI)</Text>
            <TouchableOpacity
              onPress={ () => {
                setShowUpiModal(false);
                stopPaymentPolling();
              } }
            >
              <Ionicons name="close" size={ 22 } color={ Colors.textPrimary } />
            </TouchableOpacity>
          </View>

          <View style={ styles.upiBody }>
            <Text style={ styles.upiAmount }>₹{ Number(upiPayment?.amount || 0).toLocaleString('en-IN') }</Text>
            <Text style={ styles.upiSubtitle }>Scan this QR in any UPI app and complete payment</Text>

            { upiPayment?.qrCode ? (
              <Image
                source={ { uri: upiPayment.qrCode } }
                style={ styles.upiQr }
                contentFit="contain"
              />
            ) : (
              <View style={ [styles.upiQr, styles.upiQrPlaceholder] }>
                <Text style={ styles.upiPlaceholderText }>QR unavailable</Text>
              </View>
            ) }

            <TouchableOpacity
              style={ styles.upiOpenAppBtn }
              onPress={ async () => {
                try {
                  if (upiPayment?.upiLink) {
                    await Linking.openURL(upiPayment.upiLink);
                  }
                } catch {
                  Alert.alert('No UPI App', 'No UPI app found. Please scan the QR code manually.');
                }
              } }
            >
              <Text style={ styles.upiOpenAppBtnText }>Open UPI App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={ styles.upiCheckBtn }
              onPress={ () => checkPaymentStatus(upiPayment?.id, true) }
            >
              <Text style={ styles.upiCheckBtnText }>I Have Paid, Check Status</Text>
            </TouchableOpacity>

            <View style={ styles.pollInfoRow }>
              { paymentPolling && <ActivityIndicator size="small" color={ Colors.primary } /> }
              <Text style={ styles.pollInfoText }>
                { paymentPolling
                  ? 'Waiting for payment confirmation...'
                  : 'Auto-check paused. You can still check manually.' }
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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

  // Razorpay Modal
  razorpayContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPaper,
  },
  razorpayHeader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  razorpayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  razorpayLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  // UPI modal
  upiContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundPaper,
  },
  upiBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  upiAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  upiSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  upiQr: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  upiQrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiPlaceholderText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  upiOpenAppBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  upiOpenAppBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  upiCheckBtn: {
    width: '100%',
    backgroundColor: '#eef2ff',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upiCheckBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pollInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
  },
  pollInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default CheckoutScreen;
