import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import OSMMapView from '../../components/OSMMapView';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { useRide } from '../../context/RideContext';
import * as ws from '../../services/wsService';

const PROGRESS_SEGMENTS = 4;
const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };
const DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

const GRiderSearchingScreen = ({ navigation, route }) => {
    const { rideId } = route.params;
    const insets = useSafeAreaInsets();
    const { fetchRideStatus, cancelRide, currentRide } = useRide();
    const [activeSegment, setActiveSegment] = useState(0);
    const [userLocation, setUserLocation] = useState(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
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

    // Animate progress bar
    useEffect(() => {
        Animated.loop(
            Animated.timing(progressAnim, { toValue: PROGRESS_SEGMENTS, duration: 4000, easing: Easing.linear, useNativeDriver: false }),
        ).start();
        return () => progressAnim.stopAnimation();
    }, []);

    useEffect(() => {
        const listener = progressAnim.addListener(({ value }) => setActiveSegment(Math.floor(value) % PROGRESS_SEGMENTS));
        return () => progressAnim.removeListener(listener);
    }, []);

    // Poll for ride status
    useEffect(() => {
        const poll = async () => {
            try {
                const ride = await fetchRideStatus(rideId);
                if (ride.status === 'accepted' || ride.status === 'arriving') {
                    navigation.replace('GRiderTracking', { rideId });
                } else if (ride.status === 'cancelled') {
                    Alert.alert('Cancelled', 'The ride was cancelled');
                    navigation.goBack();
                }
            } catch { /* ignore */ }
        };
        poll();
        pollRef.current = setInterval(poll, 5000);
        return () => clearInterval(pollRef.current);
    }, [rideId]);

    // WebSocket: instant notification when rider accepts
    useEffect(() => {
        const unsub = ws.on('RIDE_ACCEPTED', (msg) => {
            if (msg.rideId === rideId) {
                clearInterval(pollRef.current);
                navigation.replace('GRiderTracking', { rideId });
            }
        });
        return unsub;
    }, [rideId]);

    const handleCancel = () => {
        Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
            { text: 'No' },
            {
                text: 'Yes, Cancel', style: 'destructive',
                onPress: async () => {
                    try { await cancelRide(rideId, 'Customer cancelled while searching'); navigation.goBack(); }
                    catch { Alert.alert('Error', 'Could not cancel ride'); }
                },
            },
        ]);
    };

    const mapRegion = userLocation || (currentRide?.pickupLat ? { latitude: currentRide.pickupLat, longitude: currentRide.pickupLng } : DEFAULT_LOCATION);

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
                    markers={ [] }
                />
                <Pressable style={ styles.locateBtn } onPress={ () => {
                    const loc = userLocation || DEFAULT_LOCATION;
                    mapRef.current?.animateToRegion({ ...loc, ...DELTA }, 800);
                } }>
                    <Ionicons name="locate" size={ 24 } color={ Colors.primary } />
                </Pressable>
            </View>

            {/* Bottom Sheet */ }
            <View style={ [styles.bottomSheet, { paddingBottom: insets.bottom + Spacing.lg }] }>
                <View style={ styles.dragHandle } />
                <View style={ styles.headerRow }>
                    <View>
                        <Text style={ styles.lookingText }>Looking for your</Text>
                        <Text style={ styles.riderText }>Rider</Text>
                    </View>
                    <Pressable onPress={ () => navigation.navigate('GRiderTripDetails', { rideId }) } style={ styles.tripDetailsBtn }>
                        <Text style={ styles.tripDetailsBtnText }>Trip Details</Text>
                    </Pressable>
                </View>

                {/* Progress bar */ }
                <View style={ styles.progressContainer }>
                    { Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
                        <View key={ i } style={ [styles.progressSegment, i <= activeSegment && styles.progressSegmentActive] } />
                    )) }
                </View>

                <View style={ styles.tipContainer }>
                    <Ionicons name="information-circle-outline" size={ 20 } color={ Colors.textSecondary } />
                    <Text style={ styles.tipText }>We're matching you with the nearest rider. This usually takes less than a minute.</Text>
                </View>

                <Pressable onPress={ handleCancel } style={ styles.cancelBtn }>
                    <Ionicons name="close-circle-outline" size={ 20 } color={ Colors.accentRed } />
                    <Text style={ styles.cancelBtnText }>Cancel Ride</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, margin: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    userDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(14,165,233,0.2)', alignItems: 'center', justifyContent: 'center' },
    userDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0EA5E9' },
    locateBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, ...Shadows.lg },
    dragHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xl },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    lookingText: { ...Typography.bodyLarge, color: Colors.textSecondary },
    riderText: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '800' },
    tripDetailsBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
    tripDetailsBtnText: { ...Typography.labelMedium, color: Colors.textPrimary },
    progressContainer: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
    progressSegment: { flex: 1, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2 },
    progressSegmentActive: { backgroundColor: Colors.primary },
    tipContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.backgroundInput, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
    tipText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
    cancelBtnText: { ...Typography.labelMedium, color: Colors.accentRed },
});

export default GRiderSearchingScreen;
