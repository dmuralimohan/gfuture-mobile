import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';

const PrivacyScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

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
                <Text style={ styles.headerTitle }>Privacy Policy</Text>
                <View style={ { width: 24 } } />
            </View>

            {/* Content */ }
            <ScrollView style={ styles.content } showsVerticalScrollIndicator={ false }>
                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>1. Information We Collect</Text>
                    <Text style={ styles.sectionText }>
                        We collect information you provide directly to us such as name, email, phone number, address, and payment information when you register an account or place an order.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>2. How We Use Your Information</Text>
                    <Text style={ styles.sectionText }>
                        We use the information we collect to provide, maintain, and improve our services, process transactions, send transactional and promotional communications, and comply with legal obligations.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>3. Information Sharing</Text>
                    <Text style={ styles.sectionText }>
                        We do not share your personal information with third parties except as necessary to provide our services, comply with law, or with your explicit consent.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>4. Data Security</Text>
                    <Text style={ styles.sectionText }>
                        We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>5. Your Rights</Text>
                    <Text style={ styles.sectionText }>
                        You have the right to access, correct, or delete your personal information. Contact us at privacy@gfuture.com to exercise these rights.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>6. Changes to This Policy</Text>
                    <Text style={ styles.sectionText }>
                        We may update this privacy policy from time to time. We will notify you of any changes by updating the "Last Updated" date above.
                    </Text>
                </View>

                <Text style={ styles.lastUpdated }>Last Updated: May 11, 2026</Text>
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
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.md,
    },
    sectionText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    lastUpdated: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
});

export default PrivacyScreen;
