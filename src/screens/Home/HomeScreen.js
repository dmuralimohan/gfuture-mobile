import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
  TextInput,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { serviceAPI, categoryService, walletService, offerService } from '../../services';
import { services as mockServices, categories as mockCategories } from '../../data/mockData';
import ProductCard from '../../components/ProductCard';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const resolveCategoryIconName = (iconName) => {
  const iconKey = String(iconName || '').trim();
  if (!iconKey) return 'help-outline';

  const kebabCase = iconKey
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

  if (MaterialIcons.glyphMap[kebabCase]) return kebabCase;
  if (MaterialIcons.glyphMap[iconKey]) return iconKey;
  return 'help-outline';
};

const CATEGORY_PALETTE = [
  { iconBg: '#e0f2fe', iconColor: '#0369a1' },
  { iconBg: '#dcfce7', iconColor: '#166534' },
  { iconBg: '#fef9c3', iconColor: '#a16207' },
  { iconBg: '#ffe4e6', iconColor: '#be123c' },
  { iconBg: '#ede9fe', iconColor: '#5b21b6' },
  { iconBg: '#ffedd5', iconColor: '#c2410c' },
  { iconBg: '#dbeafe', iconColor: '#1d4ed8' },
  { iconBg: '#fce7f3', iconColor: '#be185d' },
];

// Stable SearchBar — module-level so it NEVER remounts (keyboard stays open)
const SearchBar = memo(({
  value,
  suggestions,
  showSuggestions,
  onChangeText,
  onSubmit,
  onClear,
  onSelectSuggestion,
  onFocus,
  onBlur,
}) => (
  <View>
    <View style={ styles.searchBar }>
      <Ionicons name="search" size={ 18 } color="#9ca3af" />
      <TextInput
        style={ styles.searchInput }
        placeholder="Search services, products..."
        placeholderTextColor="#9ca3af"
        value={ value }
        onChangeText={ onChangeText }
        onSubmitEditing={ onSubmit }
        onFocus={ onFocus }
        onBlur={ onBlur }
        returnKeyType="search"
        autoCorrect={ false }
        autoCapitalize="none"
      />
      { value.length > 0 && (
        <TouchableOpacity onPress={ onClear } hitSlop={ { top: 8, bottom: 8, left: 8, right: 8 } }>
          <Ionicons name="close-circle" size={ 18 } color="#9ca3af" />
        </TouchableOpacity>
      ) }
    </View>
    { showSuggestions && suggestions.length > 0 && (
      <View style={ styles.suggestionCard }>
        { suggestions.map((item) => (
          <TouchableOpacity
            key={ item.id }
            style={ styles.suggestionRow }
            onPress={ () => onSelectSuggestion(item.name) }
          >
            <Ionicons name="search-outline" size={ 15 } color={ Colors.textSecondary } />
            <Text style={ styles.suggestionText } numberOfLines={ 1 }>{ item.name }</Text>
            <Ionicons name="arrow-up-back" size={ 14 } color="#d1d5db" style={ { marginLeft: 'auto' } } />
          </TouchableOpacity>
        )) }
      </View>
    ) }
  </View>
));

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('products');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [offers, setOffers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Fetching location...');

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getAll({ limit: 20 }),
        categoryService.getAll(),
      ]);
      setServices(servicesRes.data?.services || servicesRes.data || []);
      setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
    } catch {
      setServices(mockServices);
      setCategories(mockCategories);
    }
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

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLocationLabel('Location permission needed'); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 8000 });
        const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationLabel([addr?.subregion, addr?.city, addr?.region].filter(Boolean).join(', ') || 'Current location');
      } catch { setLocationLabel('Current location'); }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { status } = await Location.getPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocationLabel([addr?.subregion, addr?.city, addr?.region].filter(Boolean).join(', ') || 'Current location');
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const isSmall = width < 360;
  const hPad = isSmall ? Spacing.lg : Spacing.xl;
  const listColumns = width < 360 ? 1 : width < 900 ? 2 : 3;
  const catCols = 4;
  const catGap = 12;
  const catCardWidth = useMemo(
    () => (width - hPad * 2 - catGap * (catCols - 1)) / catCols,
    [width, hPad, catGap, catCols],
  );
  const quickGap = width < 360 ? 6 : 8;
  const isCompactQuick = width < 380;
  const quickCardWidth = useMemo(() => {
    const per = 4;
    return (width - hPad * 2 - quickGap * (per - 1)) / per;
  }, [width, hPad, quickGap]);

  const firstName = user?.name?.split(' ')[0] || 'Guest';
  const profileImageUri = user?.profile_picture || user?.profile_image || user?.avatar || user?.photo || null;

  const applySearchQuery = useCallback((q) => setAppliedQuery(q), []);

  const handleSearchTextChange = useCallback((text) => {
    setSearchQuery(text);
    if (!text.trim()) setAppliedQuery('');
  }, []);

  const handleSuggestionSelect = useCallback((name) => {
    setSearchQuery(name);
    setAppliedQuery(name);
    setIsSearchFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setAppliedQuery('');
    setIsSearchFocused(true);
  }, []);

  const handleSearchSubmit = useCallback(() => applySearchQuery(searchQuery), [searchQuery, applySearchQuery]);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const starts = services.filter((s) => s.name.toLowerCase().startsWith(q));
    const contains = services.filter((s) => s.name.toLowerCase().includes(q) && !s.name.toLowerCase().startsWith(q));
    return [...starts, ...contains].slice(0, 6);
  }, [services, searchQuery]);

  const popularSuggestions = useMemo(() => services.slice(0, 6), [services]);

  const displaySuggestions = useMemo(() => {
    if (searchQuery.trim()) return searchSuggestions;
    return popularSuggestions;
  }, [searchQuery, searchSuggestions, popularSuggestions]);

  const filteredServices = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, appliedQuery]);

  const filteredByTab = useMemo(() => {
    return activeTab === 'services'
      ? filteredServices
      : filteredServices.filter((s) => s.price <= 2000 || s.category_id === 1);
  }, [filteredServices, activeTab]);

  const renderListHeader = useCallback(() => (
    <View>
      { categories.length > 0 && (
        <View style={ styles.section }>
          <Text style={ styles.sectionTitle }>Our Services</Text>
          <View style={ [styles.catGrid, { paddingHorizontal: hPad }] }>
            { categories.map((cat, i) => {
              const p = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
              const isRowEnd = (i + 1) % catCols === 0;
              return (
                <TouchableOpacity
                  key={ cat.id }
                  style={ [styles.catChip, { width: catCardWidth, marginRight: isRowEnd ? 0 : catGap }] }
                  onPress={ () => navigation.navigate('Services', { categoryId: cat.id, categoryName: cat.name }) }
                >
                  <View style={ [styles.catIcon, { backgroundColor: p.iconBg }] }>
                    <MaterialIcons name={ resolveCategoryIconName(cat.icon) } size={ 22 } color={ p.iconColor } />
                  </View>
                  <Text style={ styles.catName } numberOfLines={ 1 } ellipsizeMode="tail">{ cat.name }</Text>
                </TouchableOpacity>
              );
            }) }
          </View>
        </View>
      ) }

      <TouchableOpacity style={ styles.banner } onPress={ () => navigation.navigate('Offers') } activeOpacity={ 0.9 }>
        <LinearGradient colors={ ['#6366f1', '#8b5cf6', '#a78bfa'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.bannerGradient }>
          <View style={ { flex: 1 } }>
            <Text style={ styles.bannerTag }>LIMITED OFFER</Text>
            <Text style={ styles.bannerTitle }>Get 20% OFF on your first service</Text>
            <Text style={ styles.bannerSub }>Use code WELCOME20</Text>
          </View>
          <View style={ styles.bannerBadge }>
            <Text style={ styles.bannerBadgeBig }>20%</Text>
            <Text style={ styles.bannerBadgeSmall }>OFF</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={ [styles.quickActions, { paddingHorizontal: hPad, gap: quickGap }] }>
        { [
          { bg: '#eff6ff', iconBg: '#3b82f6', icon: 'wallet', label: 'Wallet', value: `\u20b9${(wallet?.balance || 0).toLocaleString('en-IN')}`, nav: 'Wallet' },
          { bg: '#fef3c7', iconBg: '#f59e0b', icon: 'star', label: 'Credits', value: `${wallet?.credit_points || 0} pts`, nav: 'Wallet' },
          { bg: '#f0fdf4', iconBg: '#22c55e', icon: 'pricetag', label: 'Offers', value: `${offers.length} deals`, nav: 'Offers' },
          { bg: '#fdf2f8', iconBg: '#ec4899', icon: 'diamond', label: 'Plans', value: 'Subscribe now', nav: 'Plans' },
        ].map((q) => (
          <TouchableOpacity
            key={ q.label }
            style={ [
              styles.quickCard,
              {
                backgroundColor: q.bg,
                width: quickCardWidth,
                minHeight: isCompactQuick ? 82 : 96,
                paddingVertical: isCompactQuick ? 10 : Spacing.md,
                paddingHorizontal: isCompactQuick ? 6 : Spacing.sm,
              },
            ] }
            onPress={ () => navigation.navigate(q.nav) }
          >
            <View style={ [styles.quickIcon, { backgroundColor: q.iconBg }] }>
              <Ionicons name={ q.icon } size={ isCompactQuick ? 16 : 18 } color="#fff" />
            </View>
            <Text style={ [styles.quickLabel, isCompactQuick && styles.quickLabelCompact] } numberOfLines={ 1 } adjustsFontSizeToFit minimumFontScale={ 0.85 }>{ q.label }</Text>
            <Text style={ [styles.quickValue, isCompactQuick && styles.quickValueCompact] } numberOfLines={ 1 } adjustsFontSizeToFit minimumFontScale={ 0.75 }>{ q.value }</Text>
          </TouchableOpacity>
        )) }
      </View>

      <TouchableOpacity style={ styles.banner } onPress={ () => navigation.navigate('GRiderIntro') } activeOpacity={ 0.9 }>
        <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.bannerGradient }>
          <View style={ { flex: 1 } }>
            <Text style={ styles.bannerTag }>NEW</Text>
            <Text style={ styles.bannerTitle }>G-Rider</Text>
            <Text style={ styles.bannerSub }>Book a bike, auto or car ride instantly</Text>
          </View>
          <Text style={ { fontSize: 44 } }>🛵</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={ styles.banner } onPress={ () => navigation.navigate('CourseHub') } activeOpacity={ 0.9 }>
        <LinearGradient colors={ ['#111827', '#334155'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 1 } } style={ styles.bannerGradient }>
          <View style={ { flex: 1 } }>
            <Text style={ [styles.bannerTag, { color: Colors.primary }] }>{ user?.role === 'provider' ? 'PROVIDER HUB' : 'LEARN & JOIN' }</Text>
            <Text style={ styles.bannerTitle }>GCourse</Text>
            <Text style={ styles.bannerSub }>{ user?.role === 'provider' ? 'Create courses, upload videos and notify learners.' : 'Explore live courses, download files and join sessions.' }</Text>
          </View>
          <Ionicons name={ user?.role === 'provider' ? 'school' : 'play-circle' } size={ 40 } color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={ [styles.tabRow, { marginHorizontal: hPad }] }>
        { ['products', 'services'].map((tab) => (
          <TouchableOpacity key={ tab } style={ [styles.tab, activeTab === tab && styles.tabActive] } onPress={ () => setActiveTab(tab) }>
            <Text style={ [styles.tabText, activeTab === tab && styles.tabTextActive] }>{ tab.toUpperCase() }</Text>
          </TouchableOpacity>
        )) }
      </View>
    </View>
  ), [categories, wallet, offers, activeTab, navigation, user, hPad, catCardWidth, catCols, catGap, quickCardWidth]);

  return (
    <View style={ styles.container }>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sticky gradient header — stays on screen while list scrolls */ }
      <LinearGradient colors={ ['#0a1628', '#162040'] } style={ [styles.stickyHeader, { paddingTop: insets.top + 8 }] }>
        {/* Row 1: brand + avatar */ }
        <View style={ styles.headerRow }>
          <View style={ styles.appName }>
            <Text style={ styles.appNameText }>GFuture</Text>
            <View style={ styles.appNameDot } />
          </View>
          <View style={ styles.headerRight }>
            <TouchableOpacity style={ styles.notifBtn } onPress={ () => navigation.navigate('NotificationsTab') }>
              <Ionicons name="notifications-outline" size={ 22 } color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={ styles.avatarWrap } onPress={ () => navigation.navigate('ProfileTab') } activeOpacity={ 0.8 }>
              { profileImageUri ? (
                <Image source={ { uri: profileImageUri } } style={ styles.avatarImg } contentFit="cover" />
              ) : (
                <Text style={ styles.avatarLetter }>{ firstName[0] }</Text>
              ) }
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: greeting + location */ }
        <View style={ styles.locationRow }>
          <Text style={ styles.greetingText }>Hello, { firstName } 👋</Text>
          <View style={ styles.locationValueRow }>
            <Ionicons name="location-sharp" size={ 13 } color={ Colors.primary } />
            <Text style={ styles.locationValue } numberOfLines={ 1 }>{ locationLabel }</Text>
          </View>
        </View>

        {/* Row 3: stable search bar */ }
        <SearchBar
          value={ searchQuery }
          suggestions={ displaySuggestions }
          showSuggestions={ isSearchFocused }
          onChangeText={ handleSearchTextChange }
          onSubmit={ handleSearchSubmit }
          onClear={ handleSearchClear }
          onSelectSuggestion={ handleSuggestionSelect }
          onFocus={ () => setIsSearchFocused(true) }
          onBlur={ () => setTimeout(() => setIsSearchFocused(false), 120) }
        />
      </LinearGradient>

      {/* Scrollable product/service list */ }
      <FlatList
        data={ filteredByTab }
        key={ `grid-${listColumns}` }
        keyExtractor={ (item) => item.id.toString() }
        numColumns={ listColumns }
        columnWrapperStyle={ listColumns > 1 ? [styles.columnWrapper, { paddingHorizontal: hPad }] : null }
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ renderListHeader }
        renderItem={ ({ item }) => (
          <ProductCard
            item={ item }
            columns={ listColumns }
            horizontalPadding={ hPad }
            onPress={ () => navigation.navigate('ProductDetail', { service: item }) }
          />
        ) }
        refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
        contentContainerStyle={ styles.listContent }
        ListEmptyComponent={
          !loading && (
            <View style={ styles.emptyBox }>
              <Ionicons name="cube-outline" size={ 64 } color={ Colors.textMuted } />
              <Text style={ styles.emptyText }>No items found</Text>
              <Text style={ styles.emptySubText }>Pull down to refresh</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  listContent: { paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },

  // Sticky Header
  stickyHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  appName: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  appNameText: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  appNameDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Location
  locationRow: { marginBottom: 12 },
  greetingText: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  locationValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationValue: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500', flex: 1 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl || 24,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  suggestionCard: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 999,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },

  // Sections
  section: { paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl, marginBottom: 12, letterSpacing: 0.3,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  catChip: { alignItems: 'center', marginBottom: 12 },
  catIcon: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  catName: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', lineHeight: 14, width: '100%' },

  // Banners
  banner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: 18, overflow: 'hidden' },
  bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, borderRadius: 18 },
  bannerTag: { fontSize: 10, fontWeight: '800', color: '#fbbf24', letterSpacing: 1.5, marginBottom: 4 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500', lineHeight: 17 },
  bannerBadge: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  bannerBadgeBig: { fontSize: 18, fontWeight: '900', color: '#fff' },
  bannerBadgeSmall: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 14,
    gap: 5,
    minHeight: 96,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  quickLabelCompact: {
    fontSize: 10,
  },
  quickValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    width: '100%',
  },
  quickValueCompact: {
    fontSize: 11,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row', marginBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: Spacing.lg, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  tabTextActive: { color: Colors.primary },

  // Empty State
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubText: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm },
});

export default HomeScreen;
