import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, Alert, Linking, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import OSMMapView from '../../components/OSMMapView';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { rideService } from '../../services/endpoints';
import * as ws from '../../services/wsService';

const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };
const DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };

const DriverActiveRideScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);
    const { rideId } = route.params;
    const [ride, setRide] = useState(route.params.ride || null);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        fetchRide();
        getLocation();
        const unsub = ws.on('RIDE_CANCELLED', (msg) => {
            if (msg.rideId === rideId) {
                Alert.alert('Ride Cancelled', 'The customer cancelled this ride', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        });
        return unsub;
    }, []);

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
            setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
            setUserLocation(DEFAULT_LOCATION);
        }
    };

    const fetchRide = async () => {
        try {
            const { data } = await rideService.getById(rideId);
            setRide(data.ride);
        } catch { /* ignore */ }
    };

    const handleStartRide = async () => {
        if (!otp.trim() || otp.length !== 4) {
            Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP from customer');
            return;
        }
        setLoading(true);
        try {
            await rideService.start(rideId, otp.trim());
            setRide(prev => ({ ...prev, status: 'in_progress' }));
            Alert.alert('Ride Started', 'Navigate to drop location');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Could not start ride');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteRide = async () => {
        Alert.alert('Complete Ride', 'Have you reached the destination?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Complete', onPress: async () => {
                    setLoading(true);
                    try {
                        const { data } = await rideService.complete(rideId);
                        Alert.alert('Ride Completed!', `Fare: ₹${data.finalFare}`, [
                            { text: 'OK', onPress: () => navigation.goBack() },
                        ]);
                    } catch (err) {
                        Alert.alert('Error', err.response?.data?.message || 'Could not complete ride');
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const handleCancelRide = () => {
        Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    try {
                        await rideService.cancel(rideId, 'Cancelled by rider');
                        navigation.goBack();
                    } catch { /* ignore */ }
                },
            },
        ]);
    };

    const callCustomer = () => {
        if (ride?.customerPhone) {
            Linking.openURL(`tel:${ride.customerPhone}`);
        }
    };

    const pickup = ride ? { latitude: ride.pickupLat, longitude: ride.pickupLng } : null;
    const drop = ride ? { latitude: ride.dropLat, longitude: ride.dropLng } : null;
    const mapCenter = pickup || userLocation || DEFAULT_LOCATION;

    const isAccepted = ride?.status === 'accepted' || ride?.status === 'arriving';
    const isInProgress = ride?.status === 'in_progress';

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ StyleSheet.absoluteFill } />

            {/* Map */ }
            <View style={ styles.mapContainer }>
                <OSMMapView
                    ref={ mapRef }
                    style={ StyleSheet.absoluteFill }
                    initialRegion={ { ...mapCenter, ...DELTA } }
                    showsUserLocation
                    userLocation={ userLocation }
                    markers={ [
                        ...(pickup ? [{ id: 'pickup', ...pickup, color: '#10b981', title: 'Pickup' }] : []),
                        ...(drop ? [{ id: 'drop', ...drop, color: '#ef4444', title: 'Drop' }] : []),
                    ] }
                    polyline={ pickup && drop ? [pickup, drop] : [] }
                />
                <Pressable style={ styles.backBtn } onPress={ () => navigation.goBack() }>
                    <Ionicons name="arrow-back" size={ 22 } color={ Colors.textPrimary } />
                </Pressable>
            </View>

            {/* Bottom Panel */ }
            <View style={ styles.panel }>
                <View style={ styles.dragHandle } />

                {/* Ride Info */ }
                <View style={ styles.rideInfo }>
                    <View style={ styles.routeRow }>
                        <View style={ [styles.routeDot, { backgroundColor: '#10b981' }] } />
                        <Text style={ styles.routeText } numberOfLines={ 1 }>{ ride?.pickupAddress || 'Loading...' }</Text>
                    </View>
                    <View style={ styles.routeLineVert } />
                    <View style={ styles.routeRow }>
                        <View style={ [styles.routeDot, { backgroundColor: '#ef4444' }] } />
                        <Text style={ styles.routeText } numberOfLines={ 1 }>{ ride?.dropAddress || '' }</Text>
                    </View>
                </View>

                <View style={ styles.fareRow }>
                    <Text style={ styles.fareLabel }>Estimated Fare</Text>
                    <Text style={ styles.fareValue }>₹{ ride?.estimatedFare || '--' }</Text>
                    <Text style={ styles.distLabel }>{ ride?.distanceKm } km</Text>
                </View>

                {/* Customer Actions */ }
                { ride?.customerPhone && (
                    <Pressable onPress={ callCustomer } style={ styles.callBtn }>
                        <Ionicons name="call" size={ 18 } color={ Colors.primary } />
                        <Text style={ styles.callBtnText }>Call Customer</Text>
                    </Pressable>
                ) }

                {/* OTP + Start (when accepted) */ }
                { isAccepted && (
                    <View style={ styles.otpSection }>
                        <Text style={ styles.otpLabel }>Enter OTP from customer to start ride</Text>
                        <TextInput
                            style={ styles.otpInput }
                            placeholder="4-digit OTP"
                            placeholderTextColor={ Colors.textMuted }
                            value={ otp }
                            onChangeText={ setOtp }
                            keyboardType="number-pad"
                            maxLength={ 4 }
                        />
                        <Pressable
                            onPress={ handleStartRide }
                            disabled={ loading }
                            style={ ({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }] }
                        >
                            <LinearGradient colors={ ['#10b981', '#34d399'] } style={ styles.actionBtnGradient }>
                                <Ionicons name="play-circle" size={ 20 } color="#fff" />
                                <Text style={ styles.actionBtnText }>{ loading ? 'Starting...' : 'Start Ride' }</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                ) }

                {/* Complete (when in progress) */ }
                { isInProgress && (
                    <Pressable
                        onPress={ handleCompleteRide }
                        disabled={ loading }
                        style={ ({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }] }
                    >
                        <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } style={ styles.actionBtnGradient }>
                            <Ionicons name="checkmark-circle" size={ 20 } color="#fff" />
                            <Text style={ styles.actionBtnText }>{ loading ? 'Completing...' : 'Complete Ride' }</Text>
                        </LinearGradient>
                    </Pressable>
                ) }

                {/* Cancel */ }
                { (isAccepted || isInProgress) && (
                    <Pressable onPress={ handleCancelRide } style={ styles.cancelBtn }>
                        <Text style={ styles.cancelBtnText }>Cancel Ride</Text>
                    </Pressable>
                ) }
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, margin: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    backBtn: { position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    panel: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl, ...Shadows.lg },
    dragHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
    rideInfo: { marginBottom: Spacing.md },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
    routeLineVert: { width: 2, height: 14, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 2 },
    fareRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, backgroundColor: '#f0fdf4', borderRadius: BorderRadius.md, padding: Spacing.md },
    fareLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
    fareValue: { ...Typography.h3, color: '#059669', flex: 1 },
    distLabel: { ...Typography.labelMedium, color: Colors.textSecondary },
    callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
    callBtnText: { ...Typography.labelMedium, color: Colors.primary },
    otpSection: { marginBottom: Spacing.sm },
    otpLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
    otpInput: { backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, ...Typography.h3, color: Colors.textPrimary, textAlign: 'center', letterSpacing: 8, marginBottom: Spacing.md },
    actionBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.sm },
    actionBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: Spacing.sm, borderRadius: BorderRadius.full },
    actionBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700' },
    cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
    cancelBtnText: { ...Typography.bodySmall, color: '#ef4444', fontWeight: '600' },
});

export default DriverActiveRideScreen;
