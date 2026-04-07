import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

const GRiderIntroScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient
                colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] }
                style={ StyleSheet.absoluteFill }
            />

            {/* Close button */ }
            <Pressable
                style={ styles.closeBtn }
                onPress={ () => navigation.goBack() }
                hitSlop={ 12 }
            >
                <View style={ styles.closeBtnInner }>
                    <Ionicons name="close" size={ 22 } color={ Colors.textPrimary } />
                </View>
            </Pressable>

            {/* Hero Image */ }
            <View style={ styles.heroContainer }>
                <View style={ styles.imageWrapper }>
                    <Ionicons name="bicycle" size={ 120 } color={ Colors.accentOrange } />
                    <View style={ styles.scooterOverlay }>
                        <Text style={ styles.scooterEmoji }>🛵</Text>
                    </View>
                </View>
            </View>

            {/* Content */ }
            <View style={ styles.content }>
                <Text style={ styles.subtitle }>Now introducing</Text>
                <Text style={ styles.title }>G-Rider</Text>
                <Text style={ styles.description }>
                    You can now travel with ease
                </Text>
            </View>

            {/* CTA Button */ }
            <View style={ [styles.ctaContainer, { paddingBottom: insets.bottom + 20 }] }>
                <Pressable
                    onPress={ () => navigation.replace('GRiderHome') }
                    style={ ({ pressed }) => [
                        styles.ctaBtn,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                    ] }
                >
                    <LinearGradient
                        colors={ ['#0EA5E9', '#38BDF8'] }
                        start={ { x: 0, y: 0 } }
                        end={ { x: 1, y: 0 } }
                        style={ styles.ctaGradient }
                    >
                        <Text style={ styles.ctaText }>Get Started</Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    imageWrapper: {
        width: 260,
        height: 260,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scooterOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 20,
    },
    scooterEmoji: {
        fontSize: 60,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.xxxl,
    },
    subtitle: {
        ...Typography.bodyLarge,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    description: {
        ...Typography.bodyLarge,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    ctaContainer: {
        paddingHorizontal: Spacing.xxl,
    },
    ctaBtn: {
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    ctaGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.full,
    },
    ctaText: {
        ...Typography.labelLarge,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default GRiderIntroScreen;
