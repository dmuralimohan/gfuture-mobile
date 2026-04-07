import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Linking,
    Alert,
    ScrollView,
} from 'react-native';
import OSMMapView from '../../components/OSMMapView';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { useRide } from '../../context/RideContext';

const STATUS_LABELS = {
    accepted: 'Rider is on the way',
    arriving: 'Rider is arriving',
    in_progress: 'Ride in progress',
    completed: 'Ride completed',
    cancelled: 'Ride cancelled',
};

const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };
const DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };

const GRiderTrackingScreen = ({ navigation, route }) => {
    const { rideId } = route.params;
    const insets = useSafeAreaInsets();
    const { fetchRideStatus, cancelRide, currentRide, rateRide } = useRide();
    const [ratingValue, setRatingValue] = useState(0);
    const [userLocation, setUserLocation] = useState(null);
    const mapRef = useRef(null);
    const pollRef = useRef(null);

    // Get location
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
                    setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                } else {
                    setUserLocation(DEFAULT_LOCATION);
                }
            } catch {
                setUserLocation(DEFAULT_LOCATION);
            }
        })();
    }, []);

    useEffect(() => {
        fetchRideStatus(rideId);
        pollRef.current = setInterval(() => fetchRideStatus(rideId), 5000);
        return () => clearInterval(pollRef.current);
    }, [rideId]);

    useEffect(() => {
        if (currentRide?.status === 'completed' || currentRide?.status === 'cancelled') {
            clearInterval(pollRef.current);
        }
    }, [currentRide?.status]);

    // Fit map to pickup and drop
    useEffect(() => {
        if (currentRide?.pickupLat && currentRide?.dropLat && mapRef.current) {
            const pickup = { latitude: currentRide.pickupLat, longitude: currentRide.pickupLng };
            const drop = { latitude: currentRide.dropLat, longitude: currentRide.dropLng };
            mapRef.current.fitToCoordinates([pickup, drop]);
        }
    }, [currentRide?.pickupLat]);

    const handleCall = () => {
        if (currentRide?.rider?.phone) Linking.openURL(`tel:${currentRide.rider.phone}`);
    };

    const handleCancel = () => {
        Alert.alert('Cancel Ride', 'Are you sure?', [
            { text: 'No' },
            {
                text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    try { await cancelRide(rideId, 'Customer cancelled'); navigation.popToTop(); }
                    catch { Alert.alert('Error', 'Could not cancel'); }
                }
            },
        ]);
    };

    const handleRate = async () => {
        if (ratingValue < 1) return;
        try { await rateRide(rideId, ratingValue); navigation.popToTop(); }
        catch { Alert.alert('Error', 'Could not submit rating'); }
    };

    const ride = currentRide;
    const rider = ride?.rider;
    const otp = ride?.otp;
    const status = ride?.status || 'accepted';
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';
    const showRating = isCompleted && !ride?.rating;

    const pickupMarker = ride?.pickupLat ? { latitude: ride.pickupLat, longitude: ride.pickupLng } : null;
    const dropMarker = ride?.dropLat ? { latitude: ride.dropLat, longitude: ride.dropLng } : null;
    const mapRegion = userLocation || pickupMarker || DEFAULT_LOCATION;

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ StyleSheet.absoluteFill } />

            {/* OpenStreetMap */ }
            <View style={ styles.mapContainer }>
                <OSMMapView
                    ref={ mapRef }
                    style={ StyleSheet.absoluteFill }
                    initialRegion={ { ...mapRegion, ...DELTA } }
                    showsUserLocation
                    userLocation={ userLocation }
                    markers={ [
                        ...(pickupMarker ? [{ id: 'pickup', ...pickupMarker, color: '#10b981', title: 'Pickup' }] : []),
                        ...(dropMarker ? [{ id: 'drop', ...dropMarker, color: '#ef4444', title: 'Drop' }] : []),
                    ] }
                    polyline={ pickupMarker && dropMarker ? [pickupMarker, dropMarker] : [] }
                />
                <Pressable style={ styles.locateBtn } onPress={ () => {
                    const loc = userLocation || pickupMarker || DEFAULT_LOCATION;
                    mapRef.current?.animateToRegion({ ...loc, ...DELTA }, 800);
                } }>
                    <Ionicons name="locate" size={ 24 } color={ Colors.primary } />
                </Pressable>
            </View>

            {/* Bottom Sheet - Scrollable to fix scroll issue */ }
            <ScrollView
                style={ styles.bottomSheet }
                contentContainerStyle={ { paddingBottom: insets.bottom + Spacing.xxl } }
                bounces={ false }
                showsVerticalScrollIndicator={ false }
                nestedScrollEnabled
            >
                <View style={ styles.dragHandle } />

                {/* OTP Section */ }
                { otp && !isCompleted && !isCancelled && (
                    <View style={ styles.otpSection }>
                        <Text style={ styles.otpLabel }>Start your order with PIN</Text>
                        <View style={ styles.otpDigits }>
                            { otp.split('').map((digit, i) => (
                                <View key={ i } style={ styles.otpBox }>
                                    <Text style={ styles.otpDigit }>{ digit }</Text>
                                </View>
                            )) }
                        </View>
                    </View>
                ) }

                <Text style={ styles.statusText }>{ STATUS_LABELS[status] || status }</Text>

                {/* Rider Info Card */ }
                { rider && (
                    <View style={ styles.riderCard }>
                        <View style={ styles.riderInfo }>
                            <View style={ { flex: 1 } }>
                                <Text style={ styles.rideIdText }>ID:{ rideId.replace('RIDE-', '') }</Text>
                                <Text style={ styles.vehicleType }>{ ride.vehicleType?.charAt(0).toUpperCase() + ride.vehicleType?.slice(1) }</Text>
                                <Text style={ styles.riderName }>{ rider.name }</Text>
                                { rider.vehicleNumber && <Text style={ styles.vehicleNumber }>{ rider.vehicleNumber }</Text> }
                            </View>
                            <View style={ styles.riderRight }>
                                <View style={ styles.riderAvatar }>
                                    { rider.profilePicture ? (
                                        <Image source={ { uri: rider.profilePicture } } style={ styles.avatarImage } />
                                    ) : (
                                        <Ionicons name="person" size={ 32 } color={ Colors.textMuted } />
                                    ) }
                                </View>
                                <View style={ styles.ratingBadge }>
                                    <Text style={ styles.ratingText }>{ rider.rating || '4.5' }</Text>
                                    <Ionicons name="star" size={ 12 } color={ Colors.star } />
                                </View>
                            </View>
                        </View>
                        { !isCompleted && !isCancelled && (
                            <Pressable onPress={ handleCall } style={ styles.callBtn }>
                                <View style={ styles.callBtnInner }>
                                    <Ionicons name="call" size={ 22 } color={ Colors.textPrimary } />
                                </View>
                            </Pressable>
                        ) }
                    </View>
                ) }

                {/* Trip summary */ }
                <View style={ styles.tripSummary }>
                    <View style={ styles.tripRow }>
                        <Text style={ styles.tripLabel }>Pickup From</Text>
                        <Pressable style={ styles.tripDetailsBtn } onPress={ () => navigation.navigate('GRiderTripDetails', { rideId }) }>
                            <Text style={ styles.tripDetailsBtnText }>Trip Details</Text>
                        </Pressable>
                    </View>
                    <Text style={ styles.tripAddress } numberOfLines={ 1 }>{ ride?.pickupAddress || 'Loading...' }</Text>
                </View>

                {/* Fare */ }
                { (ride?.estimatedFare || ride?.finalFare) && (
                    <View style={ styles.fareRow }>
                        <Text style={ styles.fareLabel }>{ isCompleted ? 'Final Fare' : 'Estimated Fare' }</Text>
                        <Text style={ styles.fareAmount }>₹{ ride.finalFare || ride.estimatedFare }</Text>
                    </View>
                ) }

                {/* Rating */ }
                { showRating && (
                    <View style={ styles.ratingSection }>
                        <Text style={ styles.ratingSectionTitle }>Rate your ride</Text>
                        <View style={ styles.stars }>
                            { [1, 2, 3, 4, 5].map((star) => (
                                <Pressable key={ star } onPress={ () => setRatingValue(star) }>
                                    <Ionicons name={ star <= ratingValue ? 'star' : 'star-outline' } size={ 36 } color={ star <= ratingValue ? Colors.star : Colors.textMuted } />
                                </Pressable>
                            )) }
                        </View>
                        <Pressable onPress={ handleRate } style={ ({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.9 }, ratingValue < 1 && { opacity: 0.5 }] }>
                            <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } style={ styles.rateBtnGradient }>
                                <Text style={ styles.rateBtnText }>Submit Rating</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                ) }

                {/* Cancel */ }
                { !isCompleted && !isCancelled && status !== 'in_progress' && (
                    <Pressable onPress={ handleCancel } style={ styles.cancelBtn }>
                        <Ionicons name="close-circle-outline" size={ 18 } color={ Colors.accentRed } />
                        <Text style={ styles.cancelBtnText }>Cancel Ride</Text>
                    </Pressable>
                ) }
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, margin: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    markerWrap: { alignItems: 'center', justifyContent: 'center' },
    locateBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '55%', ...Shadows.lg },
    dragHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
    otpSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    otpLabel: { ...Typography.bodyMedium, color: Colors.textSecondary, flex: 1 },
    otpDigits: { flexDirection: 'row', gap: 8 },
    otpBox: { width: 38, height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
    otpDigit: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
    statusText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
    riderCard: { backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
    riderInfo: { flexDirection: 'row', justifyContent: 'space-between' },
    rideIdText: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '800' },
    vehicleType: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
    riderName: { ...Typography.bodyMedium, color: Colors.textPrimary, marginTop: 4 },
    vehicleNumber: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
    riderRight: { alignItems: 'center' },
    riderAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.backgroundDefault, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 56, height: 56, borderRadius: 28 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    ratingText: { ...Typography.labelSmall, color: Colors.textPrimary },
    callBtn: { marginTop: Spacing.md },
    callBtnInner: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    tripSummary: { marginBottom: Spacing.md },
    tripRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tripLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
    tripDetailsBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.primary },
    tripDetailsBtnText: { ...Typography.labelSmall, color: Colors.primary },
    tripAddress: { ...Typography.h4, color: Colors.textPrimary, marginTop: 4 },
    fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, backgroundColor: Colors.backgroundInput, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
    fareLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
    fareAmount: { ...Typography.priceSmall, color: Colors.textPrimary },
    ratingSection: { alignItems: 'center', marginBottom: Spacing.lg },
    ratingSectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
    stars: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    rateBtn: { width: '100%', borderRadius: BorderRadius.full, overflow: 'hidden' },
    rateBtnGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: BorderRadius.full },
    rateBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700' },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
    cancelBtnText: { ...Typography.labelSmall, color: Colors.accentRed },
});

export default GRiderTrackingScreen;
