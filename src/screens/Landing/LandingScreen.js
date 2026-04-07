import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '../../components/GradientButton';
import { Colors, Gradients, Spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(40)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] }
      style={ styles.container }
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Logo */ }
      <Animated.View
        style={ [
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ] }
      >
        <Image
          source={ require('../../../assets/logo.png') }
          style={ styles.logoImage }
          contentFit="contain"
          transition={ 300 }
        />
      </Animated.View>

      {/* Headline */ }
      <Animated.View
        style={ [
          styles.headlineContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ] }
      >
        <Text style={ styles.headlineBold }>SHARED</Text>
        <Text style={ styles.headlineBold }>GROWTH.</Text>
        <Text style={ styles.headlineBlue }>COLLECTIVE</Text>
        <Text style={ styles.headlineCyan }>WEALTH.</Text>
      </Animated.View>

      {/* Subtitle */ }
      <Animated.View style={ [styles.subtitleContainer, { opacity: subtitleOpacity }] }>
        <Text style={ styles.subtitle }>
          Buy trusted products. Access verified services. Build long-term income
          through a community-driven revenue sharing ecosystem.
        </Text>
      </Animated.View>

      {/* CTA Button */ }
      <Animated.View
        style={ [
          styles.ctaContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ] }
      >
        <GradientButton
          title="GET STARTED"
          onPress={ () => navigation.navigate('Login') }
          size="large"
          style={ styles.ctaButton }
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 106,
  },
  headlineContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  headlineBold: {
    fontSize: 46,
    fontWeight: '900',
    color: Colors.primaryDark,
    letterSpacing: -1,
    lineHeight: 52,
    fontStyle: 'italic',
  },
  headlineBlue: {
    fontSize: 46,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
    lineHeight: 52,
    fontStyle: 'italic',
  },
  headlineCyan: {
    fontSize: 46,
    fontWeight: '900',
    color: '#06b6d4',
    letterSpacing: -1,
    lineHeight: 52,
    fontStyle: 'italic',
  },
  subtitleContainer: {
    paddingHorizontal: Spacing.sm,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ctaButton: {
    width: '85%',
  },
});

export default LandingScreen;
