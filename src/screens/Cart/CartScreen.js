import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import GradientButton from '../../components/GradientButton';
import { useCart } from '../../context/CartContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const CartScreen = ({ navigation }) => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    platformFee,
    deliveryFee,
    total,
    totalItems,
  } = useCart();

  const renderCartItem = ({ item }) => (
    <View style={[styles.cartItem, Shadows.sm]}>
      <Image
        source={{ uri: item.image }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.selectedSize && (
          <Text style={styles.itemSize}>Size: {item.selectedSize}</Text>
        )}
        <Text style={styles.itemPrice}>
          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.cartKey, item.quantity - 1)}
        >
          <Ionicons name="remove" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.cartKey, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() =>
          Alert.alert('Remove Item', 'Remove this item from cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.cartKey) },
          ])
        }
      >
        <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Cart" />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>
            Browse our products and services to get started
          </Text>
          <GradientButton
            title="BROWSE NOW"
            onPress={() => navigation.navigate('HomeTab')}
            size="medium"
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Cart (${totalItems})`}
        rightIcon="trash-outline"
        onRightPress={() =>
          Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => { /* clearCart */ } },
          ])
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.cartKey}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{subtotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee (1.02%)</Text>
              <Text style={styles.summaryValue}>₹{platformFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <View style={styles.deliveryRow}>
                {deliveryFee === 0 && (
                  <Text style={styles.strikethrough}>₹49</Text>
                )}
                <Text
                  style={[
                    styles.summaryValue,
                    deliveryFee === 0 && styles.freeText,
                  ]}
                >
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        }
      />

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotal}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>
        <GradientButton
          title="CHECKOUT"
          onPress={() => navigation.navigate('Checkout')}
          size="medium"
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
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: '#e5e7eb',
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemSize: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: Spacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
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
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethrough: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  freeText: {
    color: Colors.success,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Bottom
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.backgroundPaper,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.md,
  },
  bottomLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xxl,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default CartScreen;
