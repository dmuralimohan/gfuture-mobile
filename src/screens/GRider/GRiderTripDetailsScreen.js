import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { useRide } from '../../context/RideContext';
import ScreenHeader from '../../components/ScreenHeader';

const GRiderTripDetailsScreen = ({ navigation, route }) => {
    const { rideId } = route.params;
    const insets = useSafeAreaInsets();
    const { fetchRideStatus, currentRide } = useRide();

    useEffect(() => {
        fetchRideStatus(rideId);
    }, [rideId]);

    const ride = currentRide;

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <ScreenHeader title="Trip Details" onBack={ () => navigation.goBack() } />

            <ScrollView
                contentContainerStyle={ [styles.content, { paddingBottom: insets.bottom + 20 }] }
            >
                {/* Ride ID */ }
                <View style={ styles.card }>
                    <Text style={ styles.cardTitle }>Ride Information</Text>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Ride ID</Text>
                        <Text style={ styles.value }>{ ride?.id || rideId }</Text>
                    </View>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Status</Text>
                        <View
                            style={ [
                                styles.statusBadge,
                                ride?.status === 'completed' && styles.statusCompleted,
                                ride?.status === 'cancelled' && styles.statusCancelled,
                                ride?.status === 'in_progress' && styles.statusProgress,
                            ] }
                        >
                            <Text
                                style={ [
                                    styles.statusText,
                                    ride?.status === 'completed' && { color: '#10b981' },
                                    ride?.status === 'cancelled' && { color: '#ef4444' },
                                    ride?.status === 'in_progress' && { color: Colors.primary },
                                ] }
                            >
                                { ride?.status?.replace('_', ' ')?.toUpperCase() || 'N/A' }
                            </Text>
                        </View>
                    </View>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Vehicle</Text>
                        <Text style={ styles.value }>
                            { ride?.vehicleType?.charAt(0).toUpperCase() + ride?.vehicleType?.slice(1) || 'N/A' }
                        </Text>
                    </View>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Distance</Text>
                        <Text style={ styles.value }>{ ride?.distanceKm ? `${ride.distanceKm} km` : 'N/A' }</Text>
                    </View>
                </View>

                {/* Locations */ }
                <View style={ styles.card }>
                    <Text style={ styles.cardTitle }>Route</Text>
                    <View style={ styles.routeRow }>
                        <View style={ styles.routeIndicator }>
                            <View style={ [styles.routeDot, { backgroundColor: '#10b981' }] } />
                            <View style={ styles.routeLineVert } />
                            <View style={ [styles.routeDot, { backgroundColor: '#ef4444' }] } />
                        </View>
                        <View style={ styles.routeAddresses }>
                            <View style={ styles.addressItem }>
                                <Text style={ styles.addressLabel }>Pickup</Text>
                                <Text style={ styles.addressValue }>{ ride?.pickupAddress || 'N/A' }</Text>
                            </View>
                            <View style={ styles.addressItem }>
                                <Text style={ styles.addressLabel }>Drop</Text>
                                <Text style={ styles.addressValue }>{ ride?.dropAddress || 'N/A' }</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Fare */ }
                <View style={ styles.card }>
                    <Text style={ styles.cardTitle }>Fare Breakdown</Text>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Estimated Fare</Text>
                        <Text style={ styles.value }>₹{ ride?.estimatedFare || '--' }</Text>
                    </View>
                    { ride?.finalFare && (
                        <View style={ styles.row }>
                            <Text style={ styles.label }>Final Fare</Text>
                            <Text style={ [styles.value, { fontWeight: '800' }] }>₹{ ride.finalFare }</Text>
                        </View>
                    ) }
                </View>

                {/* Rider */ }
                { ride?.rider && (
                    <View style={ styles.card }>
                        <Text style={ styles.cardTitle }>Rider</Text>
                        <View style={ styles.row }>
                            <Text style={ styles.label }>Name</Text>
                            <Text style={ styles.value }>{ ride.rider.name }</Text>
                        </View>
                        { ride.rider.vehicleNumber && (
                            <View style={ styles.row }>
                                <Text style={ styles.label }>Vehicle</Text>
                                <Text style={ styles.value }>{ ride.rider.vehicleNumber }</Text>
                            </View>
                        ) }
                        <View style={ styles.row }>
                            <Text style={ styles.label }>Rating</Text>
                            <View style={ { flexDirection: 'row', alignItems: 'center', gap: 4 } }>
                                <Text style={ styles.value }>{ ride.rider.rating || '4.5' }</Text>
                                <Ionicons name="star" size={ 14 } color={ Colors.star } />
                            </View>
                        </View>
                    </View>
                ) }

                {/* Timestamps */ }
                <View style={ styles.card }>
                    <Text style={ styles.cardTitle }>Timeline</Text>
                    <View style={ styles.row }>
                        <Text style={ styles.label }>Booked At</Text>
                        <Text style={ styles.value }>
                            { ride?.createdAt ? new Date(ride.createdAt).toLocaleString() : 'N/A' }
                        </Text>
                    </View>
                    { ride?.startedAt && (
                        <View style={ styles.row }>
                            <Text style={ styles.label }>Started At</Text>
                            <Text style={ styles.value }>{ new Date(ride.startedAt).toLocaleString() }</Text>
                        </View>
                    ) }
                    { ride?.completedAt && (
                        <View style={ styles.row }>
                            <Text style={ styles.label }>Completed At</Text>
                            <Text style={ styles.value }>{ new Date(ride.completedAt).toLocaleString() }</Text>
                        </View>
                    ) }
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
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    cardTitle: {
        ...Typography.h4,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    label: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
    },
    value: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
    },
    statusCompleted: {
        backgroundColor: '#ecfdf5',
    },
    statusCancelled: {
        backgroundColor: '#fef2f2',
    },
    statusProgress: {
        backgroundColor: '#eff6ff',
    },
    statusText: {
        ...Typography.labelSmall,
        color: Colors.primary,
    },

    // Route
    routeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    routeIndicator: {
        alignItems: 'center',
        paddingTop: 6,
    },
    routeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    routeLineVert: {
        width: 2,
        height: 40,
        backgroundColor: Colors.border,
        marginVertical: 4,
    },
    routeAddresses: {
        flex: 1,
        gap: Spacing.lg,
    },
    addressItem: {},
    addressLabel: {
        ...Typography.caption,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addressValue: {
        ...Typography.bodyMedium,
        color: Colors.textPrimary,
        marginTop: 2,
    },
});

export default GRiderTripDetailsScreen;
