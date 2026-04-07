import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../../components/GradientButton';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

const SIZES = ['S', 'M', 'L'];

const ProductDetailScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const insets = useSafeAreaInsets();

  const [selectedSize, setSelectedSize] = useState('M');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const wishlisted = isInWishlist(service.id);

  const handleBuyNow = () => {
    addItem(service, selectedSize);
    navigation.navigate('Checkout');
  };

  const handleAddToCart = () => {
    addItem(service, selectedSize);
    navigation.navigate('CartTab');
  };

  const description = service.description || '';
  const shortDesc = description.length > 120 ? description.slice(0, 120) + '...' : description;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETAILS</Text>
        <TouchableOpacity
          onPress={() => toggleWishlist(service)}
          style={styles.headerBtn}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={wishlisted ? Colors.accentRed : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: service.image }}
            style={styles.productImage}
            contentFit="cover"
            transition={300}
          />
          {/* Image indicators */}
          <View style={styles.indicatorRow}>
            <View style={[styles.indicator, styles.indicatorActive]} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{service.name}</Text>
          <Text style={styles.productCategory}>
            {service.category_name || service.category || 'General'}
          </Text>

          {/* Rating */}
          {service.rating && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(service.rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={Colors.star}
                />
              ))}
              <Text style={styles.ratingValue}>{service.rating}</Text>
              {service.reviews && (
                <Text style={styles.reviewCount}>({service.reviews.toLocaleString()} reviews)</Text>
              )}
            </View>
          )}
        </View>

        {/* Description Card */}
        <View style={[styles.descCard, Shadows.sm]}>
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.descText}>
            {showFullDesc ? description : shortDesc}
          </Text>
          {description.length > 120 && (
            <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
              <Text style={styles.readMore}>
                {showFullDesc ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Includes */}
        {service.includes && service.includes.length > 0 && (
          <View style={styles.includesSection}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.includesList}>
              {(typeof service.includes === 'string'
                ? JSON.parse(service.includes)
                : service.includes
              ).map((item, idx) => (
                <View key={idx} style={styles.includeItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Size Selector */}
        <View style={styles.sizeSection}>
          <Text style={styles.sectionTitle}>Size</Text>
          <View style={styles.sizeRow}>
            {SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeBtn,
                  selectedSize === size && styles.sizeBtnActive,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === size && styles.sizeTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Details Row */}
        {(service.duration || service.warranty) && (
          <View style={styles.detailsRow}>
            {service.duration && (
              <View style={styles.detailCard}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{service.duration}</Text>
              </View>
            )}
            {service.warranty && (
              <View style={styles.detailCard}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
                <Text style={styles.detailLabel}>Warranty</Text>
                <Text style={styles.detailValue}>{service.warranty}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Price Bar */}
      <LinearGradient
        colors={['transparent', 'rgba(240,244,255,0.95)', Colors.backgroundDefault]}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>PRICE</Text>
          <Text style={styles.priceValue}>
            ₹{service.price?.toLocaleString('en-IN')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleBuyNow}
          activeOpacity={0.85}
          style={styles.buyBtn}
        >
          <LinearGradient
            colors={[Colors.primaryDark, '#1e293b']}
            style={styles.buyBtnGradient}
          >
            <Text style={styles.buyBtnText}>BUY NOW</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDefault,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    backgroundColor: Colors.backgroundPaper,
    ...Shadows.sm,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: width - 40,
    height: width * 0.65,
    marginHorizontal: 20,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  indicatorRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: Colors.textWhite,
    width: 20,
    borderRadius: 4,
  },
  infoSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Description
  descCard: {
    margin: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: '#f5f7ff',
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentOrange,
    marginTop: Spacing.sm,
  },

  // Includes
  includesSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  includesList: {
    gap: Spacing.sm,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  includeText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Size
  sizeSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.lg,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sizeBtn: {
    width: 64,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundPaper,
  },
  sizeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#eff4ff',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sizeTextActive: {
    color: Colors.primary,
  },

  // Details
  detailsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 12,
    marginBottom: Spacing.xl,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
    ...Shadows.sm,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  priceInfo: {},
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  buyBtn: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  buyBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: BorderRadius.xxl,
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
    letterSpacing: 1,
  },
});

export default ProductDetailScreen;
