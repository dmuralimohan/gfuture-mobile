import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { offerService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

const OffersScreen = ({ navigation }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOffers = useCallback(async () => {
        try {
            const { data } = await offerService.getAll();
            setOffers(data.offers || []);
        } catch (e) {
            setOffers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOffers();
    };

    const OFFER_COLORS = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
    ];

    const renderOffer = ({ item, index }) => {
        const gradientColors = OFFER_COLORS[index % OFFER_COLORS.length];

        return (
            <TouchableOpacity style={ [styles.offerCard, Shadows.md] } activeOpacity={ 0.9 }>
                <LinearGradient
                    colors={ gradientColors }
                    start={ { x: 0, y: 0 } }
                    end={ { x: 1, y: 1 } }
                    style={ styles.offerGradient }
                >
                    { item.badge ? (
                        <View style={ styles.badge }>
                            <Text style={ styles.badgeText }>{ item.badge }</Text>
                        </View>
                    ) : null }

                    <View style={ styles.offerContent }>
                        <View style={ styles.offerLeft }>
                            <Text style={ styles.offerTitle }>{ item.title }</Text>
                            <Text style={ styles.offerDesc } numberOfLines={ 2 }>
                                { item.description }
                            </Text>

                            { item.code && (
                                <View style={ styles.codeContainer }>
                                    <View style={ styles.codeBadge }>
                                        <Text style={ styles.codeText }>{ item.code }</Text>
                                    </View>
                                    <Text style={ styles.tapToCopy }>Tap to copy</Text>
                                </View>
                            ) }
                        </View>

                        <View style={ styles.offerRight }>
                            { item.discount_percent > 0 && (
                                <View style={ styles.discountCircle }>
                                    <Text style={ styles.discountValue }>{ item.discount_percent }%</Text>
                                    <Text style={ styles.discountLabel }>OFF</Text>
                                </View>
                            ) }
                            { item.discount_flat > 0 && item.discount_percent === 0 && (
                                <View style={ styles.discountCircle }>
                                    <Text style={ styles.discountValue }>₹{ item.discount_flat }</Text>
                                    <Text style={ styles.discountLabel }>OFF</Text>
                                </View>
                            ) }
                        </View>
                    </View>

                    { item.valid_until && (
                        <View style={ styles.validRow }>
                            <Ionicons name="time-outline" size={ 14 } color="rgba(255,255,255,0.7)" />
                            <Text style={ styles.validText }>
                                Valid until { new Date(item.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
                            </Text>
                        </View>
                    ) }
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={ styles.container }>
            <ScreenHeader title="Offers & Deals" onBack={ () => navigation.goBack() } />

            { loading ? (
                <ActivityIndicator size="large" color={ Colors.primary } style={ { marginTop: 40 } } />
            ) : (
                <FlatList
                    data={ offers }
                    keyExtractor={ (item) => item.id.toString() }
                    renderItem={ renderOffer }
                    refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
                    contentContainerStyle={ styles.listContent }
                    ListEmptyComponent={
                        <View style={ styles.emptyContainer }>
                            <Ionicons name="pricetag-outline" size={ 64 } color={ Colors.textMuted } />
                            <Text style={ styles.emptyTitle }>No offers right now</Text>
                            <Text style={ styles.emptySubtext }>Check back soon for amazing deals!</Text>
                        </View>
                    }
                />
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    listContent: { padding: Spacing.xl, paddingBottom: 100 },

    offerCard: {
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
    },
    offerGradient: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        minHeight: 160,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
        marginBottom: Spacing.md,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textWhite,
        letterSpacing: 1.5,
    },
    offerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerLeft: { flex: 1, paddingRight: Spacing.md },
    offerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textWhite,
        marginBottom: 6,
    },
    offerDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
        marginBottom: Spacing.md,
    },
    codeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    codeBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderStyle: 'dashed',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: BorderRadius.sm,
    },
    codeText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textWhite,
        letterSpacing: 2,
    },
    tapToCopy: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    offerRight: { alignItems: 'center' },
    discountCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    discountValue: { fontSize: 18, fontWeight: '900', color: Colors.textWhite },
    discountLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
    validRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
    },
    validText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.lg },
    emptySubtext: { fontSize: 14, color: Colors.textMuted, marginTop: Spacing.sm },
});

export default OffersScreen;
