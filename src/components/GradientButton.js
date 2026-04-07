import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Shadows } from '../theme';

const GradientButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'outline' | 'ghost'
  size = 'large', // 'small' | 'medium' | 'large'
  icon,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          styles[`size_${size}`],
          styles.outline,
          isDisabled && styles.disabled,
          pressed && !isDisabled && { opacity: 0.7 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon}
            <Text
              style={[
                styles.text,
                styles[`text_${size}`],
                styles.outlineText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.ghostBase,
          pressed && !isDisabled && { opacity: 0.6 },
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {icon}
          <Text style={[styles.ghostText, textStyle]}>{title}</Text>
        </View>
      </Pressable>
    );
  }

  // Primary variant — gradient button
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? ['#94a3b8', '#cbd5e1']
            : [Colors.primaryGradientStart, Colors.primaryGradientEnd]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.base,
          styles[`size_${size}`],
          styles.gradient,
        ]}
        pointerEvents="none"
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon}
            <Text
              style={[styles.text, styles[`text_${size}`], styles.primaryText, textStyle]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xxl,
  },
  gradient: {
    borderRadius: BorderRadius.xxl,
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    minHeight: 56,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  text_small: { fontSize: 13 },
  text_medium: { fontSize: 14 },
  text_large: { fontSize: 16, textTransform: 'uppercase' },
  primaryText: {
    color: Colors.textWhite,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostBase: {
    padding: 8,
  },
  ghostText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
