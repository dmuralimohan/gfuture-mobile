import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '../../components/GradientButton';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { reviewCommentsByService } from '../../data/mockData';
import { serviceAPI } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [commentInput, setCommentInput] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [postingReview, setPostingReview] = useState(false);

  const seedReviews = useMemo(() => {
    const source = reviewCommentsByService[service.id] || [];
    return source;
  }, [service.id]);
  const [reviews, setReviews] = useState(seedReviews);
  const wishlisted = isInWishlist(service.id);

  const handleBuyNow = () => {
    addItem(service);
    navigation.navigate('Checkout');
  };

  const handleAddToCart = () => {
    addItem(service);
    navigation.navigate('CartTab');
  };

  const description = service.description || '';
  const shortDesc = description.length > 120 ? description.slice(0, 120) + '...' : description;

  useEffect(() => {
    let mounted = true;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data } = await serviceAPI.getReviews(service.id);
        if (!mounted) return;

        const normalized = (data.reviews || []).map((item) => ({
          id: item.id,
          user: item.user?.name || 'User',
          rating: Number(item.rating || 0),
          date: (item.created_at || '').slice(0, 10),
          comment: item.comment || '',
        }));

        if (normalized.length > 0) {
          setReviews(normalized);
        } else {
          setReviews(seedReviews);
        }
      } catch {
        if (mounted) setReviews(seedReviews);
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    };

    fetchReviews();
    return () => {
      mounted = false;
    };
  }, [service.id, seedReviews]);

  const handleAddReview = () => {
    const content = commentInput.trim();
    if (!content) {
      Alert.alert('Add Comment', 'Please type your review comment first.');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to post a review.');
      return;
    }

    (async () => {
      setPostingReview(true);
      try {
        const { data } = await serviceAPI.addReview(service.id, {
          rating: selectedRating,
          comment: content,
        });

        const serverReview = data.review;
        const normalized = {
          id: serverReview.id,
          user: serverReview.user?.name || 'You',
          rating: Number(serverReview.rating || selectedRating),
          date: (serverReview.created_at || new Date().toISOString()).slice(0, 10),
          comment: serverReview.comment || content,
        };

        setReviews((prev) => [normalized, ...prev]);
        setCommentInput('');
        setSelectedRating(5);
      } catch (err) {
        Alert.alert('Unable to Post', err?.response?.data?.message || 'Please try again.');
      } finally {
        setPostingReview(false);
      }
    })();
  };

  return (
    <View style={ styles.container }>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Header */ }
      <View style={ [styles.header, { paddingTop: insets.top + 8 }] }>
        <TouchableOpacity
          onPress={ () => navigation.goBack() }
          style={ styles.headerBtn }
        >
          <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
        </TouchableOpacity>
        <Text style={ styles.headerTitle }>DETAILS</Text>
        <TouchableOpacity
          onPress={ () => toggleWishlist(service) }
          style={ styles.headerBtn }
        >
          <Ionicons
            name={ wishlisted ? 'heart' : 'heart-outline' }
            size={ 24 }
            color={ wishlisted ? Colors.accentRed : Colors.textPrimary }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={ false }
        contentContainerStyle={ styles.scrollContent }
      >
        {/* Product Image */ }
        <View style={ styles.imageContainer }>
          <Image
            source={ { uri: service.image } }
            style={ styles.productImage }
            contentFit="cover"
            transition={ 300 }
          />
          {/* Image indicators */ }
          <View style={ styles.indicatorRow }>
            <View style={ [styles.indicator, styles.indicatorActive] } />
            <View style={ styles.indicator } />
            <View style={ styles.indicator } />
          </View>
        </View>

        {/* Product Info */ }
        <View style={ styles.infoSection }>
          <Text style={ styles.productName }>{ service.name }</Text>
          <Text style={ styles.productCategory }>
            { service.category_name || service.category || 'General' }
          </Text>

          {/* Rating */ }
          { service.rating && (
            <View style={ styles.ratingRow }>
              { [1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={ star }
                  name={ star <= Math.floor(service.rating) ? 'star' : 'star-outline' }
                  size={ 16 }
                  color={ Colors.star }
                />
              )) }
              <Text style={ styles.ratingValue }>{ service.rating }</Text>
              { service.reviews && (
                <Text style={ styles.reviewCount }>({ service.reviews.toLocaleString() } reviews)</Text>
              ) }
            </View>
          ) }
        </View>

        {/* Details / Reviews Switcher */ }
        <View style={ styles.tabRow }>
          <TouchableOpacity
            style={ [styles.tabBtn, activeTab === 'details' && styles.tabBtnActive] }
            onPress={ () => setActiveTab('details') }
          >
            <Text style={ [styles.tabBtnText, activeTab === 'details' && styles.tabBtnTextActive] }>DETAILS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ [styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive] }
            onPress={ () => setActiveTab('reviews') }
          >
            <Text style={ [styles.tabBtnText, activeTab === 'reviews' && styles.tabBtnTextActive] }>
              REVIEWS ({ reviews.length })
            </Text>
          </TouchableOpacity>
        </View>

        { activeTab === 'details' ? (
          <>
            {/* Description Card */ }
            <View style={ [styles.descCard, Shadows.sm] }>
              <Text style={ styles.descTitle }>Description</Text>
              <Text style={ styles.descText }>
                { showFullDesc ? description : shortDesc }
              </Text>
              { description.length > 120 && (
                <TouchableOpacity onPress={ () => setShowFullDesc(!showFullDesc) }>
                  <Text style={ styles.readMore }>
                    { showFullDesc ? 'Show Less' : 'Read More' }
                  </Text>
                </TouchableOpacity>
              ) }
            </View>

            {/* Includes */ }
            { service.includes && service.includes.length > 0 && (
              <View style={ styles.includesSection }>
                <Text style={ styles.sectionTitle }>What's Included</Text>
                <View style={ styles.includesList }>
                  { (typeof service.includes === 'string'
                    ? JSON.parse(service.includes)
                    : service.includes
                  ).map((item, idx) => (
                    <View key={ idx } style={ styles.includeItem }>
                      <Ionicons name="checkmark-circle" size={ 18 } color={ Colors.success } />
                      <Text style={ styles.includeText }>{ item }</Text>
                    </View>
                  )) }
                </View>
              </View>
            ) }


            {/* Details Row */ }
            { (service.duration || service.warranty) && (
              <View style={ styles.detailsRow }>
                { service.duration && (
                  <View style={ styles.detailCard }>
                    <Ionicons name="time-outline" size={ 20 } color={ Colors.primary } />
                    <Text style={ styles.detailLabel }>Duration</Text>
                    <Text style={ styles.detailValue }>{ service.duration }</Text>
                  </View>
                ) }
                { service.warranty && (
                  <View style={ styles.detailCard }>
                    <Ionicons name="shield-checkmark-outline" size={ 20 } color={ Colors.success } />
                    <Text style={ styles.detailLabel }>Warranty</Text>
                    <Text style={ styles.detailValue }>{ service.warranty }</Text>
                  </View>
                ) }
              </View>
            ) }
          </>
        ) : (
          <View style={ styles.reviewsSection }>
            <Text style={ styles.sectionTitle }>Customer Comments</Text>

            <View style={ styles.commentComposer }>
              <View style={ styles.commentInputWrap }>
                <View style={ styles.ratingSelector }>
                  { [1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={ `rate-${star}` }
                      onPress={ () => setSelectedRating(star) }
                      hitSlop={ { top: 8, bottom: 8, left: 8, right: 8 } }
                    >
                      <Ionicons
                        name={ star <= selectedRating ? 'star' : 'star-outline' }
                        size={ 20 }
                        color={ Colors.star }
                      />
                    </TouchableOpacity>
                  )) }
                </View>
                <TextInput
                  value={ commentInput }
                  onChangeText={ setCommentInput }
                  placeholder="Write your review..."
                  placeholderTextColor={ Colors.textMuted }
                  style={ styles.commentInput }
                  multiline
                />
              </View>
              <TouchableOpacity
                style={ [styles.postBtn, postingReview && styles.postBtnDisabled] }
                onPress={ handleAddReview }
                disabled={ postingReview }
              >
                <Text style={ styles.postBtnText }>{ postingReview ? 'Posting...' : 'Post' }</Text>
              </TouchableOpacity>
            </View>

            { loadingReviews ? (
              <View style={ styles.emptyReviews }>
                <Text style={ styles.emptyReviewsText }>Loading comments...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={ styles.emptyReviews }>
                <Ionicons name="chatbubble-ellipses-outline" size={ 28 } color={ Colors.textMuted } />
                <Text style={ styles.emptyReviewsText }>No comments yet. Be the first to review.</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={ review.id } style={ styles.reviewCard }>
                  <View style={ styles.reviewHeader }>
                    <Text style={ styles.reviewUser }>{ review.user }</Text>
                    <Text style={ styles.reviewDate }>{ review.date }</Text>
                  </View>
                  <View style={ styles.reviewStars }>
                    { [1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={ `${review.id}-${star}` }
                        name={ star <= review.rating ? 'star' : 'star-outline' }
                        size={ 14 }
                        color={ Colors.star }
                      />
                    )) }
                  </View>
                  <Text style={ styles.reviewComment }>{ review.comment }</Text>
                </View>
              ))
            ) }
          </View>
        ) }

        <View style={ { height: 120 } } />
      </ScrollView>

      {/* Bottom Price Bar */ }
      <LinearGradient
        colors={ ['transparent', 'rgba(240,244,255,0.95)', Colors.backgroundDefault] }
        style={ [styles.bottomBar, { paddingBottom: insets.bottom + 12 }] }
      >
        <View style={ styles.priceInfo }>
          <Text style={ styles.priceLabel }>PRICE</Text>
          <Text style={ styles.priceValue }>
            ₹{ service.price?.toLocaleString('en-IN') }
          </Text>
        </View>
        <TouchableOpacity
          onPress={ handleBuyNow }
          activeOpacity={ 0.85 }
          style={ styles.buyBtn }
        >
          <LinearGradient
            colors={ [Colors.primaryDark, '#1e293b'] }
            style={ styles.buyBtnGradient }
          >
            <Text style={ styles.buyBtnText }>BUY NOW</Text>
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  tabBtnTextActive: {
    color: Colors.primary,
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


  // Details
  detailsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 12,
    marginBottom: Spacing.xl,
  },
  reviewsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  commentComposer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  commentInputWrap: {
    backgroundColor: Colors.backgroundPaper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  commentInput: {
    minHeight: 44,
    maxHeight: 120,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  postBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  postBtnDisabled: {
    opacity: 0.7,
  },
  reviewCard: {
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  emptyReviewsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
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
