import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, FlatList, Alert, AppState, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { rideService } from '../../services/endpoints';
import * as ws from '../../services/wsService';

const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };

const DriverDashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [rider, setRider] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [requests, setRequests] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(null);
    const locationWatcher = useRef(null);

    // Load rider profile
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await rideService.riderProfile();
            if (!data.registered) {
                navigation.replace('DriverRegister');
                return;
            }
            setRider(data.rider);
            setIsOnline(data.rider.isOnline);
            if (data.rider.isOnline) connectWs();
            // Check for active ride
            const { data: activeData } = await rideService.riderActive();
            if (activeData.ride) setActiveRide(activeData.ride);
        } catch (err) {
            if (err.response?.status === 404) {
                navigation.replace('DriverRegister');
            }
        } finally {
            setLoading(false);
        }
    };

    // Connect WebSocket
    const connectWs = async () => {
        try {
            const token = await SecureStore.getItemAsync('accessToken');
            if (token) ws.connect('rider', token);
        } catch { /* ignore */ }
    };

    // WebSocket event listeners
    useEffect(() => {
        const unsubs = [
            ws.on('NEW_RIDE_REQUEST', (msg) => {
                Vibration.vibrate([0, 500, 200, 500]);
                setRequests(prev => {
                    const exists = prev.find(r => r.id === msg.ride.id);
                    if (exists) return prev;
                    return [msg.ride, ...prev];
                });
            }),
            ws.on('RIDE_TAKEN', (msg) => {
                setRequests(prev => prev.filter(r => r.id !== msg.rideId));
            }),
            ws.on('RIDE_CANCELLED', (msg) => {
                setRequests(prev => prev.filter(r => r.id !== msg.rideId));
                if (activeRide?.id === msg.rideId) {
                    Alert.alert('Ride Cancelled', 'The customer cancelled the ride');
                    setActiveRide(null);
                }
            }),
            ws.on('CONNECTION_STATUS', (msg) => {
                if (!msg.connected && isOnline) {
                    // Try reconnect
                }
            }),
        ];
        return () => unsubs.forEach(fn => fn());
    }, [isOnline, activeRide]);

    // Location tracking when online
    useEffect(() => {
        if (isOnline) {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }
        return () => stopLocationTracking();
    }, [isOnline]);

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            locationWatcher.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 10000 },
                (loc) => {
                    ws.send('LOCATION_UPDATE', { lat: loc.coords.latitude, lng: loc.coords.longitude });
                }
            );
        } catch { /* ignore */ }
    };

    const stopLocationTracking = () => {
        if (locationWatcher.current) {
            locationWatcher.current.remove();
            locationWatcher.current = null;
        }
    };

    // Toggle online/offline
    const toggleOnline = async () => {
        const newStatus = !isOnline;
        try {
            let loc = DEFAULT_LOCATION;
            try {
                const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
                loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            } catch { /* use default */ }

            await rideService.riderToggleOnline({ online: newStatus, lat: loc.latitude, lng: loc.longitude });
            setIsOnline(newStatus);

            if (newStatus) {
                connectWs();
                // Fetch existing pending requests
                fetchRequests();
            } else {
                ws.send('GO_OFFLINE');
                ws.disconnect();
                setRequests([]);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not update status');
        }
    };

    // Fetch pending ride requests (REST fallback)
    const fetchRequests = async () => {
        try {
            const { data } = await rideService.riderRequests();
            setRequests(data.requests || []);
        } catch { /* ignore */ }
    };

    // Accept a ride
    const handleAccept = async (rideId) => {
        setAccepting(rideId);
        try {
            const { data } = await rideService.riderAccept(rideId);
            setActiveRide(data.ride);
            setRequests([]);
            navigation.navigate('DriverActiveRide', { rideId, ride: data.ride });
        } catch (err) {
            const msg = err.response?.data?.message || 'Could not accept ride';
            if (err.response?.status === 409) {
                setRequests(prev => prev.filter(r => r.id !== rideId));
            }
            Alert.alert('Error', msg);
        } finally {
            setAccepting(null);
        }
    };

    // Periodic request refresh when online
    useEffect(() => {
        if (!isOnline) return;
        const interval = setInterval(fetchRequests, 15000);
        return () => clearInterval(interval);
    }, [isOnline]);

    const renderRequest = ({ item }) => (
        <View style={ styles.requestCard }>
            <View style={ styles.requestHeader }>
                <MaterialCommunityIcons name="motorbike" size={ 24 } color={ Colors.primary } />
                <Text style={ styles.requestFare }>₹{ item.estimatedFare }</Text>
                <Text style={ styles.requestDist }>{ item.distanceKm } km</Text>
            </View>
            <View style={ styles.requestRoute }>
                <View style={ styles.routeRow }>
                    <View style={ [styles.routeDot, { backgroundColor: '#10b981' }] } />
                    <Text style={ styles.routeText } numberOfLines={ 1 }>{ item.pickupAddress }</Text>
                </View>
                <View style={ styles.routeLine } />
                <View style={ styles.routeRow }>
                    <View style={ [styles.routeDot, { backgroundColor: '#ef4444' }] } />
                    <Text style={ styles.routeText } numberOfLines={ 1 }>{ item.dropAddress }</Text>
                </View>
            </View>
            <Pressable
                onPress={ () => handleAccept(item.id) }
                disabled={ accepting === item.id }
                style={ ({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9 }] }
            >
                <LinearGradient colors={ ['#10b981', '#34d399'] } style={ styles.acceptBtnGradient }>
                    <Ionicons name="checkmark-circle" size={ 20 } color="#fff" />
                    <Text style={ styles.acceptBtnText }>{ accepting === item.id ? 'Accepting...' : 'Accept Ride' }</Text>
                </LinearGradient>
            </Pressable>
        </View>
    );

    if (loading) {
        return (
            <View style={ [styles.container, styles.center, { paddingTop: insets.top }] }>
                <Text style={ styles.loadingText }>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient colors={ isOnline ? ['#d1fae5', '#ecfdf5', '#fff'] : ['#f1f5f9', '#f8fafc', '#fff'] } style={ StyleSheet.absoluteFill } />

            {/* Header */ }
            <View style={ styles.header }>
                <Pressable onPress={ () => navigation.goBack() } style={ styles.headerBtn }>
                    <Ionicons name="arrow-back" size={ 22 } color={ Colors.textPrimary } />
                </Pressable>
                <Text style={ styles.headerTitle }>G-Rider Driver</Text>
                <Pressable onPress={ () => navigation.navigate('DriverHistory') } style={ styles.headerBtn }>
                    <Ionicons name="time-outline" size={ 22 } color={ Colors.textPrimary } />
                </Pressable>
            </View>

            {/* Stats */ }
            <View style={ styles.statsRow }>
                <View style={ styles.statCard }>
                    <Text style={ styles.statValue }>{ rider?.totalRides || 0 }</Text>
                    <Text style={ styles.statLabel }>Rides</Text>
                </View>
                <View style={ styles.statCard }>
                    <Text style={ styles.statValue }>⭐ { rider?.rating?.toFixed(1) || '4.5' }</Text>
                    <Text style={ styles.statLabel }>Rating</Text>
                </View>
                <View style={ styles.statCard }>
                    <Text style={ styles.statValue }>{ rider?.vehicleNumber || '--' }</Text>
                    <Text style={ styles.statLabel }>Vehicle</Text>
                </View>
            </View>

            {/* Online/Offline Toggle */ }
            <Pressable onPress={ toggleOnline } style={ styles.toggleWrap }>
                <View style={ [styles.toggleCard, isOnline && styles.toggleCardOnline] }>
                    <View style={ [styles.toggleIndicator, isOnline && styles.toggleIndicatorOnline] } />
                    <View style={ { flex: 1 } }>
                        <Text style={ [styles.toggleTitle, isOnline && styles.toggleTitleOnline] }>
                            { isOnline ? 'You are Online' : 'You are Offline' }
                        </Text>
                        <Text style={ styles.toggleSubtitle }>
                            { isOnline ? 'Receiving ride requests nearby' : 'Tap to go online and start earning' }
                        </Text>
                    </View>
                    <View style={ [styles.toggleSwitch, isOnline && styles.toggleSwitchOn] }>
                        <View style={ [styles.toggleThumb, isOnline && styles.toggleThumbOn] } />
                    </View>
                </View>
            </Pressable>

            {/* Active Ride Banner */ }
            { activeRide && (
                <Pressable
                    style={ styles.activeRideBanner }
                    onPress={ () => navigation.navigate('DriverActiveRide', { rideId: activeRide.id, ride: activeRide }) }
                >
                    <Ionicons name="navigate" size={ 24 } color="#fff" />
                    <View style={ { flex: 1, marginLeft: Spacing.sm } }>
                        <Text style={ styles.activeBannerTitle }>Active Ride</Text>
                        <Text style={ styles.activeBannerSub } numberOfLines={ 1 }>{ activeRide.dropAddress }</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={ 20 } color="#fff" />
                </Pressable>
            ) }

            {/* Ride Requests */ }
            { isOnline ? (
                <View style={ { flex: 1 } }>
                    <Text style={ styles.sectionTitle }>
                        { requests.length > 0 ? `Ride Requests (${requests.length})` : 'Waiting for ride requests...' }
                    </Text>
                    { requests.length > 0 ? (
                        <FlatList
                            data={ requests }
                            keyExtractor={ (item) => item.id }
                            renderItem={ renderRequest }
                            contentContainerStyle={ { paddingHorizontal: Spacing.lg, paddingBottom: 20 } }
                            showsVerticalScrollIndicator={ false }
                        />
                    ) : (
                        <View style={ styles.emptyWrap }>
                            <MaterialCommunityIcons name="map-marker-radius" size={ 64 } color={ Colors.textMuted } />
                            <Text style={ styles.emptyText }>No ride requests yet</Text>
                            <Text style={ styles.emptySubtext }>Stay online — requests will appear here</Text>
                        </View>
                    ) }
                </View>
            ) : (
                <View style={ [styles.emptyWrap, { flex: 1 }] }>
                    <MaterialCommunityIcons name="power-standby" size={ 80 } color={ Colors.textMuted } />
                    <Text style={ styles.emptyText }>Go online to receive rides</Text>
                </View>
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    loadingText: { ...Typography.bodyMedium, color: Colors.textSecondary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    headerTitle: { ...Typography.h3, color: Colors.textPrimary },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
    statValue: { ...Typography.labelLarge, color: Colors.textPrimary },
    statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
    toggleWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
    toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadows.md, borderWidth: 2, borderColor: Colors.border },
    toggleCardOnline: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    toggleIndicator: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.textMuted },
    toggleIndicatorOnline: { backgroundColor: '#10b981' },
    toggleTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
    toggleTitleOnline: { color: '#059669' },
    toggleSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
    toggleSwitch: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#e2e8f0', justifyContent: 'center', paddingHorizontal: 3 },
    toggleSwitchOn: { backgroundColor: '#10b981' },
    toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', ...Shadows.sm },
    toggleThumbOn: { alignSelf: 'flex-end' },
    activeRideBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
    activeBannerTitle: { ...Typography.labelMedium, color: '#fff', fontWeight: '700' },
    activeBannerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
    sectionTitle: { ...Typography.labelLarge, color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
    requestCard: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
    requestHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    requestFare: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
    requestDist: { ...Typography.labelMedium, color: Colors.textSecondary },
    requestRoute: { marginBottom: Spacing.md },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
    routeLine: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 4 },
    acceptBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
    acceptBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: Spacing.sm, borderRadius: BorderRadius.full },
    acceptBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700' },
    emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { ...Typography.bodyLarge, color: Colors.textSecondary, marginTop: Spacing.lg },
    emptySubtext: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: Spacing.xs },
});

export default DriverDashboardScreen;
