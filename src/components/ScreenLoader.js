import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../theme';

const { width, height } = Dimensions.get('window');

const ScreenLoader = () => (
  <LinearGradient
    colors={Gradients.hero}
    style={styles.container}
  >
    <ActivityIndicator size="large" color={Colors.primary} />
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScreenLoader;
