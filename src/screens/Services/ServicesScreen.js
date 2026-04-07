import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import ProductCard from '../../components/ProductCard';
import { serviceAPI } from '../../services';
import { Colors, Spacing, BorderRadius } from '../../theme';

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Price Low', value: 'price-low' },
  { label: 'Price High', value: 'price-high' },
  { label: 'Rating', value: 'rating' },
];

const ServicesScreen = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params || {};
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchServices = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        const params = { page: pageNum, limit: 20, sort };
        if (categoryId) params.category = categoryId;
        const { data } = await serviceAPI.getAll(params);
        const newServices = data.services || [];
        setServices((prev) => (reset ? newServices : [...prev, ...newServices]));
        setHasMore(pageNum < (data.totalPages || 1));
      } catch (e) {
        setServices([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryId, sort],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchServices(1, true);
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchServices(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchServices(nextPage);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={categoryName || 'Services'}
        onBack={() => navigation.goBack()}
      />

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
            onPress={() => setSort(opt.value)}
          >
            <Text
              style={[
                styles.sortText,
                sort === opt.value && styles.sortTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => navigation.navigate('ProductDetail', { service: item })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              style={{ marginVertical: 20 }}
              color={Colors.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No services found</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDefault,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundPaper,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortTextActive: {
    color: Colors.textWhite,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
});

export default ServicesScreen;
