import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { useRide } from '../../context/RideContext';
import ScreenHeader from '../../components/ScreenHeader';

const STATUS_COLORS = {
    completed: '#10b981',
    cancelled: '#ef4444',
    in_progress: Colors.primary,
    searching: Colors.accentOrange,
    accepted: Colors.accentCyan,
};

const VEHICLE_ICONS = {
    bike: 'motorbike',
    auto: 'rickshaw',
    car: 'car',
};

const GRiderHistoryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { rideHistory, fetchHistory } = useRide();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory().catch(() => { });
        setRefreshing(false);
    };

    const renderRide = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
        return (
            <Pressable
                style={ styles.rideCard }
                onPress={ () => navigation.navigate('GRiderTripDetails', { rideId: item.id }) }
            >
                <View style={ styles.rideHeader }>
                    <MaterialCommunityIcons
                        name={ VEHICLE_ICONS[item.vehicleType] || 'motorbike' }
                        size={ 24 }
                        color={ Colors.textPrimary }
                    />
                    <View style={ styles.rideHeaderText }>
                        <Text style={ styles.rideId }>{ item.id }</Text>
                        <Text style={ styles.rideDate }>
                            { new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            }) }
                        </Text>
                    </View>
                    <View style={ [styles.statusBadge, { backgroundColor: statusColor + '15' }] }>
                        <Text style={ [styles.statusText, { color: statusColor }] }>
                            { item.status.replace('_', ' ') }
                        </Text>
                    </View>
                </View>

                <View style={ styles.rideRoute }>
                    <View style={ styles.routeIndicator }>
                        <View style={ [styles.routeDot, { backgroundColor: '#10b981' }] } />
                        <View style={ styles.routeLineV } />
                        <View style={ [styles.routeDot, { backgroundColor: '#ef4444' }] } />
                    </View>
                    <View style={ styles.routeTexts }>
                        <Text style={ styles.routeAddress } numberOfLines={ 1 }>
                            { item.pickupAddress }
                        </Text>
                        <Text style={ styles.routeAddress } numberOfLines={ 1 }>
                            { item.dropAddress }
                        </Text>
                    </View>
                </View>

                <View style={ styles.rideFoot }>
                    <Text style={ styles.rideDist }>{ item.distanceKm } km</Text>
                    <Text style={ styles.rideFare }>
                        ₹{ item.finalFare || item.estimatedFare }
                    </Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <ScreenHeader title="Ride History" onBack={ () => navigation.goBack() } />

            <FlatList
                data={ rideHistory }
                keyExtractor={ (item) => item.id }
                renderItem={ renderRide }
                contentContainerStyle={ [
                    styles.listContent,
                    { paddingBottom: insets.bottom + 20 },
                ] }
                refreshControl={
                    <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } />
                }
                ListEmptyComponent={
                    <View style={ styles.emptyContainer }>
                        <MaterialCommunityIcons name="motorbike" size={ 64 } color={ Colors.textMuted } />
                        <Text style={ styles.emptyTitle }>No rides yet</Text>
                        <Text style={ styles.emptySubtitle }>
                            Book your first G-Rider trip!
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDefault,
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    rideCard: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    rideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    rideHeaderText: {
        flex: 1,
    },
    rideId: {
        ...Typography.labelMedium,
        color: Colors.textPrimary,
    },
    rideDate: {
        ...Typography.caption,
        color: Colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        ...Typography.labelSmall,
        textTransform: 'capitalize',
    },

    rideRoute: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    routeIndicator: {
        alignItems: 'center',
        paddingTop: 4,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeLineV: {
        width: 2,
        height: 20,
        backgroundColor: Colors.border,
        marginVertical: 2,
    },
    routeTexts: {
        flex: 1,
        justifyContent: 'space-between',
    },
    routeAddress: {
        ...Typography.bodySmall,
        color: Colors.textPrimary,
    },

    rideFoot: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.sm,
    },
    rideDist: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
    },
    rideFare: {
        ...Typography.priceSmall,
        color: Colors.textPrimary,
    },

    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginTop: Spacing.lg,
    },
    emptySubtitle: {
        ...Typography.bodyMedium,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
});

export default GRiderHistoryScreen;
