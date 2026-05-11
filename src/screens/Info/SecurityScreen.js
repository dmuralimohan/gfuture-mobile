import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';

const SecurityScreen = ({ navigation }) => {
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
                <Text style={ styles.headerTitle }>Security</Text>
                <View style={ { width: 24 } } />
            </View>

            {/* Content */ }
            <ScrollView style={ styles.content } showsVerticalScrollIndicator={ false }>
                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Account Security</Text>
                    <Text style={ styles.sectionText }>
                        Keep your account secure by using a strong password, enabling two-factor authentication, and never sharing your login credentials with anyone.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Payment Security</Text>
                    <Text style={ styles.sectionText }>
                        All payment transactions are encrypted and processed securely. We use industry-standard encryption protocols to protect your financial information.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Data Encryption</Text>
                    <Text style={ styles.sectionText }>
                        Your personal data is encrypted both in transit and at rest using SSL/TLS protocols and AES-256 encryption standards.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Two-Factor Authentication</Text>
                    <Text style={ styles.sectionText }>
                        Enable 2FA on your account to prevent unauthorized access. This requires a second verification method in addition to your password.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Reporting Security Issues</Text>
                    <Text style={ styles.sectionText }>
                        If you discover a security vulnerability, please contact our security team at security@gfuture.com. Do not publicly disclose the issue until we have had time to address it.
                    </Text>
                </View>

                <View style={ styles.section }>
                    <Text style={ styles.sectionTitle }>Session Management</Text>
                    <Text style={ styles.sectionText }>
                        Sessions automatically expire after 30 minutes of inactivity for security purposes. Always log out when using shared devices.
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

export default SecurityScreen;
