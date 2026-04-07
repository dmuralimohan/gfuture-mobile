import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { useWishlist } from '../../context/WishlistContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const WishlistScreen = ({ navigation }) => {
  const { items, toggleWishlist } = useWishlist();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, Shadows.sm]}
      onPress={() => navigation.navigate('ProductDetail', { service: item })}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category || item.category_name}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.cardPrice}>₹{item.price?.toLocaleString('en-IN')}</Text>
          {item.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={Colors.star} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => toggleWishlist(item)}
      >
        <Ionicons name="heart" size={22} color={Colors.accentRed} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Wishlist" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={72} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on any product to save it here
            </Text>
          </View>
        }
      />
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
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: '#e5e7eb',
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});

export default WishlistScreen;
