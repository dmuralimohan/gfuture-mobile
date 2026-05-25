import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../theme';

const ProductCard = ({ item, onPress, style, columns = 2, horizontalPadding = Spacing.xl }) => {
  const { width } = useWindowDimensions();
  const safeColumns = Math.max(1, columns);
  const gutter = Spacing.lg;
  const totalHorizontal = horizontalPadding * 2 + gutter * (safeColumns - 1);
  const cardWidth = Math.max(160, (width - totalHorizontal) / safeColumns);

  return (
    <TouchableOpacity
      onPress={ onPress }
      activeOpacity={ 0.85 }
      style={ [styles.card, { width: cardWidth }, Shadows.md, style] }
    >
      <View style={ styles.imageContainer }>
        <Image
          source={ { uri: item.image } }
          style={ styles.image }
          contentFit="cover"
          placeholder={ { blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' } }
          transition={ 300 }
        />
        { item.rating && (
          <View style={ styles.ratingBadge }>
            <Ionicons name="star" size={ 10 } color={ Colors.star } />
            <Text style={ styles.ratingText }>{ item.rating }</Text>
          </View>
        ) }
      </View>
      <View style={ styles.content }>
        <Text style={ styles.name } numberOfLines={ 1 }>
          { item.name }
        </Text>
        <View style={ styles.bottomRow }>
          <Text style={ styles.price }>₹{ item.price?.toLocaleString('en-IN') }</Text>
          <TouchableOpacity
            onPress={ onPress }
            style={ styles.arrowBtn }
            hitSlop={ { top: 8, bottom: 8, left: 8, right: 8 } }
          >
            <Ionicons name="arrow-forward" size={ 16 } color={ Colors.textWhite } />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.33,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCard;
