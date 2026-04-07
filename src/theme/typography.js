import { StyleSheet, Platform } from 'react-native';

export const Typography = StyleSheet.create({
  // Display
  displayLarge: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 34,
  },

  // Headings
  h1: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  h5: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },

  // Labels
  labelLarge: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  // Caption
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Button
  button: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Price
  price: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  priceSmall: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
  full: 9999,
};

export const Shadows = Platform.select({
  ios: {
    sm: {
      shadowColor: '#0a1628',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    md: {
      shadowColor: '#0a1628',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    lg: {
      shadowColor: '#1a3af5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  },
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
  },
});
