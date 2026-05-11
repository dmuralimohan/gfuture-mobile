import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../theme';

const SupportScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const contactMethods = [
        {
            id: 1,
            icon: 'call',
            title: 'Call Us',
            value: '+91 1234 567 890',
            action: () => Linking.openURL('tel:+911234567890'),
        },
        {
            id: 2,
            icon: 'mail',
            title: 'Email',
            value: 'support@gfuture.com',
            action: () => Linking.openURL('mailto:support@gfuture.com'),
        },
        {
            id: 3,
            icon: 'chatbubble',
            title: 'Live Chat',
            value: 'Available 24/7',
            action: () => Alert.alert('Live Chat', 'Connecting to support...'),
        },
        {
            id: 4,
            icon: 'locate',
            title: 'Visit Us',
            value: '123 Main St, Tech City',
            action: () => Alert.alert('Visit Us', 'Directions opening...'),
        },
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
                <Text style={ styles.headerTitle }>Support</Text>
                <View style={ { width: 24 } } />
            </View>

            {/* Content */ }
            <ScrollView style={ styles.content } showsVerticalScrollIndicator={ false }>
                <Text style={ styles.subtitle }>Get in touch with our support team</Text>

                <View style={ styles.contactGrid }>
                    { contactMethods.map((method) => (
                        <TouchableOpacity
                            key={ method.id }
                            style={ styles.contactCard }
                            onPress={ method.action }
                        >
                            <View style={ styles.contactIconWrapper }>
                                <Ionicons
                                    name={ method.icon }
                                    size={ 28 }
                                    color={ Colors.primary }
                                />
                            </View>
                            <Text style={ styles.contactTitle }>{ method.title }</Text>
                            <Text style={ styles.contactValue } numberOfLines={ 2 }>{ method.value }</Text>
                        </TouchableOpacity>
                    )) }
                </View>

                <View style={ styles.timerSection }>
                    <Text style={ styles.timerTitle }>Response Time</Text>
                    <View style={ styles.timerRow }>
                        <Ionicons name="time" size={ 20 } color={ Colors.success } />
                        <Text style={ styles.timerText }>Average response: 5-15 minutes</Text>
                    </View>
                    <View style={ styles.timerRow }>
                        <Ionicons name="checkmark-circle" size={ 20 } color={ Colors.success } />
                        <Text style={ styles.timerText }>Resolution rate: 95%</Text>
                    </View>
                </View>

                <View style={ styles.hoursSection }>
                    <Text style={ styles.hoursTitle }>Support Hours</Text>
                    <View style={ styles.hoursList }>
                        <View style={ styles.hourRow }>
                            <Text style={ styles.dayText }>Monday - Friday</Text>
                            <Text style={ styles.timeText }>9:00 AM - 9:00 PM</Text>
                        </View>
                        <View style={ styles.hourRow }>
                            <Text style={ styles.dayText }>Saturday</Text>
                            <Text style={ styles.timeText }>10:00 AM - 6:00 PM</Text>
                        </View>
                        <View style={ styles.hourRow }>
                            <Text style={ styles.dayText }>Sunday</Text>
                            <Text style={ styles.timeText }>Emergency only</Text>
                        </View>
                    </View>
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
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    contactGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    contactCard: {
        width: '48%',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    contactIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primaryAlpha,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    contactValue: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    timerSection: {
        backgroundColor: Colors.successAlpha,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    timerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.success,
        marginBottom: Spacing.md,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    timerText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: Spacing.md,
    },
    hoursSection: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    hoursTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: Spacing.lg,
    },
    hoursList: {
        gap: Spacing.md,
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    timeText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    lastUpdated: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
    },
});

export default SupportScreen;
