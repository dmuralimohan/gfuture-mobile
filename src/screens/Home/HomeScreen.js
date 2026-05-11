import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { serviceAPI, categoryService, walletService, offerService } from '../../services';
import { services as mockServices, categories as mockCategories } from '../../data/mockData';
import ProductCard from '../../components/ProductCard';
import { Colors, Spacing, BorderRadius, Shadows, Gradients } from '../../theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [offers, setOffers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Fetching location...');
  const [locationCoords, setLocationCoords] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getAll({ limit: 20 }),
        categoryService.getAll(),
      ]);
      setServices(servicesRes.data?.services || servicesRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch (e) {
      setServices(mockServices);
      setCategories(mockCategories);
    }
    // Fetch wallet & offers in background (non-blocking)
    try {
      const [walletRes, offersRes] = await Promise.all([
        walletService.getWallet().catch(() => null),
        offerService.getAll({ limit: 3 }).catch(() => null),
      ]);
      if (walletRes?.data) setWallet(walletRes.data.wallet);
      if (offersRes?.data) setOffers(offersRes.data.offers || offersRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initial location fetch
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationLabel('Location permission needed');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 8000,
        });

        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        setLocationCoords(coords);

        const [addr] = await Location.reverseGeocodeAsync(coords);
        const text = [addr?.subregion, addr?.city, addr?.region].filter(Boolean).join(', ');
        setLocationLabel(text || 'Current location');
      } catch {
        setLocationLabel('Current location');
      }
    })();
  }, []);

  // Update location every 30 seconds for real-time tracking
  useEffect(() => {
    const locationInterval = setInterval(async () => {
      try {
        const { status } = await Location.getPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        setLocationCoords(coords);

        // Update location label
        const [addr] = await Location.reverseGeocodeAsync(coords);
        const text = [addr?.subregion, addr?.city, addr?.region].filter(Boolean).join(', ');
        setLocationLabel(text || 'Current location');
      } catch (e) {
        // Silently fail on location update
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(locationInterval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Memoized filtered services to prevent unnecessary recalculations
  const filteredServices = useMemo(
    () => services.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [services, searchQuery],
  );

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  const categoryIcons = {
    'Appliance Repair & Service': 'construct',
    'Electrician, Plumber & Carpenter': 'flash',
    'Home Cleaning': 'sparkles',
    'Water Purifier': 'water',
    'Bathroom & Kitchen': 'home',
    'AC Service & Repair': 'snow',
    'Painting & Renovation': 'color-palette',
    'Pest Control': 'bug',
  };

  // Memoized header component to prevent keyboard from dismissing
  const renderHeader = useCallback(() => (
    <View>
      {/* Dark Header */ }
      <LinearGradient
        colors={ ['#0a1628', '#1e293b'] }
        style={ [styles.headerGradient, { paddingTop: insets.top + 12 }] }
      >
        {/* User Info Row */ }
        <View style={ styles.userRow }>
          <View style={ styles.userRowRight }>
            <View style={ styles.avatar }>
              <Text style={ styles.avatarText }>{ firstName[0] }</Text>
            </View>
            <View>
              <Text style={ styles.greeting }>Hi, { firstName }</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-down" size={ 20 } color={ Colors.textWhite } />
          </TouchableOpacity>
        </View>

        {/* Location */ }
        <TouchableOpacity style={ styles.locationRow }>
          <Text style={ styles.locationLabel }>LOCATION</Text>
          <View style={ styles.locationValueRow }>
            <Text style={ styles.locationValue } numberOfLines={ 1 }>{ locationLabel }</Text>
            <Ionicons name="chevron-down" size={ 16 } color={ Colors.textWhite } />
          </View>
        </TouchableOpacity>

        {/* Search Bar */ }
        <View style={ styles.searchRow }>
          <View style={ styles.searchBar }>
            <Ionicons name="search" size={ 20 } color={ Colors.textMuted } />
            <TextInput
              style={ styles.searchInput }
              placeholder="Search products, services..."
              placeholderTextColor={ Colors.textMuted }
              value={ searchQuery }
              onChangeText={ setSearchQuery }
            />
          </View>
          <TouchableOpacity style={ styles.filterBtn }>
            <Ionicons name="options" size={ 22 } color={ Colors.textWhite } />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories Horizontal */ }
      { categories.length > 0 && (
        <View style={ styles.categoriesSection }>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={ false }
            contentContainerStyle={ styles.categoriesScroll }
          >
            { categories.map((cat) => (
              <TouchableOpacity
                key={ cat.id }
                style={ styles.categoryChip }
                onPress={ () =>
                  navigation.navigate('Services', { categoryId: cat.id, categoryName: cat.name })
                }
              >
                <View style={ styles.categoryIcon }>
                  <Ionicons
                    name={ categoryIcons[cat.name] || 'grid' }
                    size={ 20 }
                    color={ Colors.primary }
                  />
                </View>
                <Text style={ styles.categoryName } numberOfLines={ 2 }>
                  { cat.name }
                </Text>
              </TouchableOpacity>
            )) }
          </ScrollView>
        </View>
      ) }
      {/* Promo Banner */ }
      <TouchableOpacity
        style={ styles.promoBanner }
        onPress={ () => navigation.navigate('Offers') }
        activeOpacity={ 0.9 }
      >
        <LinearGradient
          colors={ ['#6366f1', '#8b5cf6', '#a78bfa'] }
          start={ { x: 0, y: 0 } }
          end={ { x: 1, y: 0 } }
          style={ styles.promoBannerGradient }
        >
          <View style={ { flex: 1 } }>
            <Text style={ styles.promoTag }>LIMITED OFFER</Text>
            <Text style={ styles.promoTitle }>Get 20% OFF on your first service</Text>
            <Text style={ styles.promoSub }>Use code WELCOME20</Text>
          </View>
          <View style={ styles.promoCircle }>
            <Text style={ styles.promoPercent }>20%</Text>
            <Text style={ styles.promoOff }>OFF</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Action Cards */ }
      <View style={ styles.quickActions }>
        <TouchableOpacity
          style={ [styles.quickCard, { backgroundColor: '#eff6ff' }] }
          onPress={ () => navigation.navigate('Wallet') }
        >
          <View style={ [styles.quickIcon, { backgroundColor: '#3b82f6' }] }>
            <Ionicons name="wallet" size={ 18 } color="#fff" />
          </View>
          <Text style={ styles.quickLabel }>Wallet</Text>
          <Text style={ styles.quickValue }>
            ₹{ (wallet?.balance || 0).toLocaleString('en-IN') }
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={ [styles.quickCard, { backgroundColor: '#fef3c7' }] }
          onPress={ () => navigation.navigate('Wallet') }
        >
          <View style={ [styles.quickIcon, { backgroundColor: '#f59e0b' }] }>
            <Ionicons name="star" size={ 18 } color="#fff" />
          </View>
          <Text style={ styles.quickLabel }>Credits</Text>
          <Text style={ styles.quickValue }>{ wallet?.credit_points || 0 } pts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={ [styles.quickCard, { backgroundColor: '#f0fdf4' }] }
          onPress={ () => navigation.navigate('Offers') }
        >
          <View style={ [styles.quickIcon, { backgroundColor: '#22c55e' }] }>
            <Ionicons name="pricetag" size={ 18 } color="#fff" />
          </View>
          <Text style={ styles.quickLabel }>Offers</Text>
          <Text style={ styles.quickValue }>{ offers.length } deals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={ [styles.quickCard, { backgroundColor: '#fdf2f8' }] }
          onPress={ () => navigation.navigate('Plans') }
        >
          <View style={ [styles.quickIcon, { backgroundColor: '#ec4899' }] }>
            <Ionicons name="diamond" size={ 18 } color="#fff" />
          </View>
          <Text style={ styles.quickLabel }>Plans</Text>
          <Text style={ styles.quickValue }>Subscribe</Text>
        </TouchableOpacity>
      </View>

      {/* G-Rider Banner */ }
      <TouchableOpacity
        style={ styles.griderBanner }
        onPress={ () => navigation.navigate('GRiderIntro') }
        activeOpacity={ 0.9 }
      >
        <LinearGradient
          colors={ ['#0EA5E9', '#38BDF8'] }
          start={ { x: 0, y: 0 } }
          end={ { x: 1, y: 0 } }
          style={ styles.griderBannerGradient }
        >
          <View style={ { flex: 1 } }>
            <Text style={ styles.griderTag }>NEW</Text>
            <Text style={ styles.griderTitle }>G-Rider</Text>
            <Text style={ styles.griderSub }>Book a bike, auto or car ride instantly</Text>
          </View>
          <View style={ styles.griderIconWrap }>
            <Text style={ { fontSize: 40 } }>🛵</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      {/* GCourse Banner */ }
      <TouchableOpacity
        style={ styles.gcourseBanner }
        onPress={ () => navigation.navigate('CourseHub') }
        activeOpacity={ 0.9 }
      >
        <LinearGradient
          colors={ ['#111827', '#334155'] }
          start={ { x: 0, y: 0 } }
          end={ { x: 1, y: 1 } }
          style={ styles.gcourseBannerGradient }
        >
          <View style={ { flex: 1 } }>
            <Text style={ styles.gcourseTag }>{ user?.role === 'provider' ? 'PROVIDER HUB' : 'LEARN & JOIN' }</Text>
            <Text style={ styles.gcourseTitle }>GCourse</Text>
            <Text style={ styles.gcourseSub }>
              { user?.role === 'provider'
                ? 'Create courses, upload videos and notify enrolled learners.'
                : 'Explore live courses, download files and join sessions.' }
            </Text>
          </View>
          <View style={ styles.gcourseIconWrap }>
            <Ionicons name={ user?.role === 'provider' ? 'school' : 'play-circle' } size={ 34 } color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
      {/* Tab Switcher */ }
      <View style={ styles.tabRow }>
        <TouchableOpacity
          style={ [styles.tab, activeTab === 'products' && styles.tabActive] }
          onPress={ () => setActiveTab('products') }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === 'products' && styles.tabTextActive,
            ] }
          >
            PRODUCTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={ [styles.tab, activeTab === 'services' && styles.tabActive] }
          onPress={ () => setActiveTab('services') }
        >
          <Text
            style={ [
              styles.tabText,
              activeTab === 'services' && styles.tabTextActive,
            ] }
          >
            SERVICES
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [user, locationLabel, categories, wallet, offers, activeTab, navigation, categoryIcons, firstName]);

  return (
    <View style={ [styles.container, { backgroundColor: Colors.backgroundDefault }] }>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={ filteredServices }
        keyExtractor={ (item) => item.id.toString() }
        numColumns={ 2 }
        columnWrapperStyle={ styles.columnWrapper }
        ListHeaderComponent={ renderHeader }
        renderItem={ ({ item }) => (
          <ProductCard
            item={ item }
            onPress={ () => navigation.navigate('ProductDetail', { service: item }) }
          />
        ) }
        refreshControl={
          <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } />
        }
        contentContainerStyle={ styles.listContent }
        ListEmptyComponent={
          !loading && (
            <View style={ styles.emptyContainer }>
              <Ionicons name="cube-outline" size={ 64 } color={ Colors.textMuted } />
              <Text style={ styles.emptyText }>No items found</Text>
              <Text style={ styles.emptySubtext }>Pull down to refresh</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  columnWrapper: {
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },

  // Header
  headerGradient: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing.lg,
  },
  userRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  locationRow: {
    marginBottom: Spacing.lg,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  locationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.textWhite,
    fontSize: 14,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Categories
  categoriesSection: {
    paddingVertical: Spacing.lg,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  categoryChip: {
    alignItems: 'center',
    width: 72,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.backgroundPaper,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Shadows.sm,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  promoBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  promoTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  promoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  promoPercent: { fontSize: 18, fontWeight: '900', color: '#fff' },
  promoOff: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // Quick Action Cards
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // G Rider Banner
  griderBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  griderBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  griderTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  griderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  griderSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  griderIconWrap: {
    marginLeft: 'auto',
  },

  // GCourse Banner
  gcourseBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  gcourseBannerGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  gcourseTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  gcourseTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  gcourseSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    lineHeight: 16,
  },
  gcourseIconWrap: {
    marginLeft: 'auto',
  },

  // Tab Row
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default HomeScreen;
