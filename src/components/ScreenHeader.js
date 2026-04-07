import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadows } from '../theme';

const ScreenHeader = ({
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightIcon2,
  onRight2Press,
  transparent = false,
  dark = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 8 },
        !transparent && styles.headerBg,
        !transparent && Shadows.sm,
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={dark ? Colors.textWhite : Colors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <Text
          style={[
            styles.title,
            dark && { color: Colors.textWhite },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.rightGroup}>
          {rightIcon2 && (
            <TouchableOpacity
              onPress={onRight2Press}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={rightIcon2}
                size={22}
                color={dark ? Colors.textWhite : Colors.textPrimary}
              />
            </TouchableOpacity>
          )}
          {rightIcon ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={rightIcon}
                size={22}
                color={dark ? Colors.textWhite : Colors.textPrimary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  headerBg: {
    backgroundColor: Colors.backgroundPaper,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default ScreenHeader;
