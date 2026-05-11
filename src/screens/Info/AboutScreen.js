import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../theme';

const AboutScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const features = [
        { icon: 'shield-checkmark', title: 'Verified Professionals', desc: 'All providers are vetted for quality' },
        { icon: 'pricetag', title: 'Best Prices', desc: 'Get competitive pricing & discounts' },
        { icon: 'car', title: 'Fast Delivery', desc: '24/7 availability across your city' },
        { icon: 'star', title: 'Quality Service', desc: 'Rating-based professional selection' },
    ];

    const social = [
        { icon: 'logo-facebook', url: 'https://facebook.com/gfuture' },
        { icon: 'logo-twitter', url: 'https://twitter.com/gfuture' },
        { icon: 'logo-instagram', url: 'https://instagram.com/gfuture' },
        { icon: 'logo-linkedin', url: 'https://linkedin.com/company/gfuture' },
    ];

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            {/* Header */ }
            <View style={ styles.header }>
                <Ionicons
                    name="arrow-back"
                    size={ 24 }
                    color={ Colors.primary }
                    onPress={ () => navigation.goBack() }
                />
                <Text style={ styles.headerTitle }>About GFuture</Text>
                <View style={ { width: 24 } } />
            </View>

            {/* Content */ }
            <ScrollView style={ styles.content } showsVerticalScrollIndicator={ false }>
                {/* Hero Section */ }
                <LinearGradient
                    colors={ ['#6366f1', '#8b5cf6'] }
                    start={ { x: 0, y: 0 } }
                    end={ { x: 1, y: 1 } }
                    style={ styles.heroSection }
                >
                    <Text style={ styles.appName }>GFuture</Text>
                    <Text style={ styles.tagline }>Your trusted on-demand service platform</Text>
                    <Text style={ styles.version }>Version 1.0.0</Text>
                </LinearGradient>

                {/* About Section */ }
                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>About Us</Text>
                    <Text style={ styles.sectionText }>
                        GFuture is a comprehensive on-demand service platform connecting customers with verified professionals for home services, courier delivery, ride-sharing, and online learning.
                    </Text>
                    <Text style={ styles.sectionText }>
                        Founded in 2024, we're committed to providing reliable, affordable, and accessible services to millions of users across our platform.
                    </Text>
                </View>

                {/* Features */ }
                <View style={ styles.featuresSection }>
                    <Text style={ styles.sectionTitle }>Why Choose GFuture?</Text>
                    { features.map((feature, idx) => (
                        <View key={ idx } style={ styles.featureItem }>
                            <View style={ styles.featureIcon }>
                                <Ionicons name={ feature.icon } size={ 24 } color={ Colors.primary } />
                            </View>
                            <View style={ styles.featureContent }>
                                <Text style={ styles.featureTitle }>{ feature.title }</Text>
                                <Text style={ styles.featureDesc }>{ feature.desc }</Text>
                            </View>
                        </View>
                    )) }
                </View>

                {/* Legal */ }
                <View style={ styles.legalSection }>
                    <Text style={ styles.sectionTitle }>Legal</Text>
                    <TouchableOpacity
                        style={ styles.legalLink }
                        onPress={ () => navigation.navigate('Privacy') }
                    >
                        <Text style={ styles.legalText }>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={ 18 } color={ Colors.primary } />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ styles.legalLink }
                        onPress={ () => navigation.navigate('Security') }
                    >
                        <Text style={ styles.legalText }>Security</Text>
                        <Ionicons name="chevron-forward" size={ 18 } color={ Colors.primary } />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={ styles.legalLink }
                        onPress={ () => Linking.openURL('https://gfuture.com/terms') }
                    >
                        <Text style={ styles.legalText }>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={ 18 } color={ Colors.primary } />
                    </TouchableOpacity>
                </View>

                {/* Social */ }
                <View style={ styles.socialSection }>
                    <Text style={ styles.sectionTitle }>Follow Us</Text>
                    <View style={ styles.socialGrid }>
                        { social.map((s, idx) => (
                            <TouchableOpacity
                                key={ idx }
                                style={ styles.socialIcon }
                                onPress={ () => Linking.openURL(s.url) }
                            >
                                <Ionicons name={ s.icon } size={ 28 } color={ Colors.primary } />
                            </TouchableOpacity>
                        )) }
                    </View>
                </View>

                {/* Footer */ }
                <View style={ styles.footerSection }>
                    <Text style={ styles.footerText }>© 2024 GFuture. All rights reserved.</Text>
                    <Text style={ styles.footerContact }>Email: info@gfuture.com</Text>
                    <Text style={ styles.footerContact }>Website: www.gfuture.com</Text>
                    <Text style={ styles.footerCopyright }>Made with ❤️ in India</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDefault,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    heroSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xxl,
        alignItems: 'center',
    },
    appName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        marginBottom: Spacing.md,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: Spacing.md,
    },
    version: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    section: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.lg,
    },
    sectionText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    featuresSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryAlpha,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    featureDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    legalSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    legalLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    legalText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
    socialSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    socialGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primaryAlpha,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerSection: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: Spacing.md,
    },
    footerContact: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    footerCopyright: {
        fontSize: 12,
        color: Colors.primary,
        marginTop: Spacing.md,
        fontWeight: '600',
    },
});

export default AboutScreen;
