import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';

const HelpScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [expandedFaq, setExpandedFaq] = useState(null);

    const faqs = [
        {
            id: 1,
            question: 'How do I place an order?',
            answer: 'Browse services or products, select items, proceed to checkout, and complete payment. You\'ll receive a confirmation immediately.'
        },
        {
            id: 2,
            question: 'Can I cancel my order?',
            answer: 'You can cancel orders before the service provider accepts. Go to Orders, select the order, and tap Cancel.'
        },
        {
            id: 3,
            question: 'What payment methods are accepted?',
            answer: 'We accept credit/debit cards, UPI, digital wallets, and bank transfers. All payments are secured with encryption.'
        },
        {
            id: 4,
            question: 'How do I track my order?',
            answer: 'Once assigned, you can track real-time location of the service provider or delivery partner in the app.'
        },
        {
            id: 5,
            question: 'What is the refund policy?',
            answer: 'Refunds are processed within 5-7 business days. Contact support for refund requests after service completion.'
        },
    ];

    const toggleFaq = (id) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

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
                <Text style={ styles.headerTitle }>Help & FAQs</Text>
                <View style={ { width: 24 } } />
            </View>

            {/* Content */ }
            <ScrollView style={ styles.content } showsVerticalScrollIndicator={ false }>
                <Text style={ styles.sectionTitle }>Frequently Asked Questions</Text>

                { faqs.map((faq) => (
                    <TouchableOpacity
                        key={ faq.id }
                        style={ styles.faqItem }
                        onPress={ () => toggleFaq(faq.id) }
                    >
                        <View style={ styles.faqHeader }>
                            <Text style={ styles.faqQuestion }>{ faq.question }</Text>
                            <Ionicons
                                name={ expandedFaq === faq.id ? 'chevron-up' : 'chevron-down' }
                                size={ 20 }
                                color={ Colors.primary }
                            />
                        </View>
                        { expandedFaq === faq.id && (
                            <Text style={ styles.faqAnswer }>{ faq.answer }</Text>
                        ) }
                    </TouchableOpacity>
                )) }

                <View style={ styles.contactSection }>
                    <Text style={ styles.contactTitle }>Still Need Help?</Text>
                    <Text style={ styles.contactText }>
                        Visit our Support Center or contact our team
                    </Text>
                    <TouchableOpacity
                        style={ styles.supportBtn }
                        onPress={ () => navigation.navigate('Support') }
                    >
                        <Text style={ styles.supportBtnText }>Contact Support</Text>
                        <Ionicons name="chevron-forward" size={ 16 } color={ Colors.textWhite } />
                    </TouchableOpacity>
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.lg,
    },
    faqItem: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
        marginRight: Spacing.md,
    },
    faqAnswer: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginTop: Spacing.md,
    },
    contactSection: {
        backgroundColor: Colors.primaryAlpha,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.xl,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.md,
    },
    contactText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    supportBtn: {
        marginTop: Spacing.lg,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.round,
    },
    supportBtnText: {
        color: Colors.textWhite,
        fontSize: 13,
        fontWeight: '700',
    },
    lastUpdated: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
});

export default HelpScreen;
