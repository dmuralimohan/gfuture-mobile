import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Dimensions,
    Platform,
    Animated,
    Alert,
    Keyboard,
} from 'react-native';
import OSMMapView from '../../components/OSMMapView';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { useRide } from '../../context/RideContext';

const { width, height } = Dimensions.get('window');

const VEHICLE_TYPES = [
    { id: 'bike', label: 'Bike', icon: 'motorbike', description: 'Affordable, fast', eta: '3-5 min' },
];

const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };
const DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

const GRiderHomeScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { getEstimate, estimates, loading, bookRide } = useRide();
    const mapRef = useRef(null);

    const [currentLocation, setCurrentLocation] = useState(null);
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState('bike');
    const [distanceKm, setDistanceKm] = useState(null);
    const [showVehicles, setShowVehicles] = useState(false);

    const sheetAnim = useRef(new Animated.Value(0)).current;
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Track keyboard show/hide to shrink map
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // Apply confirmed addresses from ConfirmPickup screen
    useEffect(() => {
        if (route.params?.confirmedPickup) setPickupAddress(route.params.confirmedPickup);
        if (route.params?.confirmedDrop) setDropAddress(route.params.confirmedDrop);
    }, [route.params]);

    // Get current location on mount
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location permission is needed for G-Rider');
                    setCurrentLocation(DEFAULT_LOCATION);
                    setPickupCoords(DEFAULT_LOCATION);
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
                const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                setCurrentLocation(coords);
                setPickupCoords(coords);
                try {
                    const [addr] = await Location.reverseGeocodeAsync(coords);
                    if (addr) {
                        const parts = [addr.name, addr.street, addr.district, addr.city].filter(Boolean);
                        if (parts.length) setPickupAddress(parts.join(', '));
                    }
                } catch { /* geocode fail ok */ }
            } catch {
                setCurrentLocation(DEFAULT_LOCATION);
                setPickupCoords(DEFAULT_LOCATION);
                setPickupAddress('Hyderabad Central');
            }
        })();
    }, []);

    useEffect(() => {
        if (showVehicles) {
            Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
        }
    }, [showVehicles]);

    const goToCurrentLocation = useCallback(async () => {
        const loc = currentLocation || pickupCoords || DEFAULT_LOCATION;
        mapRef.current?.animateToRegion({ ...loc, ...DELTA }, 800);
        setPickupCoords(loc);
        try {
            const [addr] = await Location.reverseGeocodeAsync(loc);
            if (addr) {
                const parts = [addr.name, addr.street, addr.district, addr.city].filter(Boolean);
                if (parts.length) setPickupAddress(parts.join(', '));
            }
        } catch {
            if (!pickupAddress) setPickupAddress('Current Location');
        }
    }, [currentLocation, pickupCoords, pickupAddress]);

    const calcDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const handleSearch = async () => {
        if (!pickupAddress.trim() || !dropAddress.trim()) {
            Alert.alert('Missing Info', 'Please enter both pickup and drop locations');
            return;
        }
        let drop = dropCoords;
        if (!drop) {
            try {
                const results = await Location.geocodeAsync(dropAddress);
                if (results.length > 0) {
                    drop = { latitude: results[0].latitude, longitude: results[0].longitude };
                    setDropCoords(drop);
                }
            } catch { /* ignore */ }
        }
        if (!drop) {
            const pickup = pickupCoords || currentLocation || DEFAULT_LOCATION;
            drop = { latitude: pickup.latitude + 0.03, longitude: pickup.longitude + 0.02 };
            setDropCoords(drop);
        }
        const pickup = pickupCoords || currentLocation || DEFAULT_LOCATION;
        const dist = Math.max(1, Math.round(calcDistance(pickup.latitude, pickup.longitude, drop.latitude, drop.longitude) * 10) / 10);
        setDistanceKm(dist);
        mapRef.current?.fitToCoordinates([pickup, drop]);
        try {
            await getEstimate(selectedVehicle, dist);
            setShowVehicles(true);
        } catch {
            Alert.alert('Error', 'Could not get fare estimate');
        }
    };

    const handleBookRide = async () => {
        const pickup = pickupCoords || currentLocation || DEFAULT_LOCATION;
        const drop = dropCoords || { latitude: pickup.latitude + 0.03, longitude: pickup.longitude + 0.02 };
        try {
            const ride = await bookRide({
                vehicleType: selectedVehicle, pickupAddress, pickupLat: pickup.latitude, pickupLng: pickup.longitude,
                dropAddress, dropLat: drop.latitude, dropLng: drop.longitude, distanceKm,
            });
            navigation.navigate('GRiderSearching', { rideId: ride.id });
        } catch (err) {
            const msg = err.response?.data?.message || 'Booking failed';
            if (err.response?.status === 409) navigation.navigate('GRiderTracking', { rideId: err.response.data.rideId });
            else Alert.alert('Error', msg);
        }
    };

    const selectedEstimate = estimates?.estimates?.[selectedVehicle];
    const mapRegion = currentLocation || pickupCoords || DEFAULT_LOCATION;

    const TAB_BAR_HEIGHT = 65 + insets.bottom;

    return (
        <View style={ [styles.container, { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT }] }>
            <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ StyleSheet.absoluteFill } />

            {/* Header with Driver Mode */ }
            <View style={ styles.topBar }>
                <Text style={ styles.topBarTitle }>G-Rider</Text>
                <Pressable onPress={ () => navigation.navigate('DriverRegister') } style={ styles.driverModeBtn }>
                    <MaterialCommunityIcons name="steering" size={ 16 } color={ Colors.primary } />
                    <Text style={ styles.driverModeBtnText }>Driver Mode</Text>
                </Pressable>
            </View>

            {/* OpenStreetMap */ }
            <View style={ [styles.mapContainer, keyboardVisible && styles.mapContainerSmall] }>
                <OSMMapView
                    ref={ mapRef }
                    style={ StyleSheet.absoluteFill }
                    initialRegion={ { ...mapRegion, ...DELTA } }
                    showsUserLocation
                    userLocation={ currentLocation }
                    markers={ [
                        ...(pickupCoords ? [{ id: 'pickup', ...pickupCoords, color: '#10b981', title: 'Pickup' }] : []),
                        ...(dropCoords ? [{ id: 'drop', ...dropCoords, color: '#ef4444', title: 'Drop' }] : []),
                    ] }
                    polyline={ pickupCoords && dropCoords ? [pickupCoords, dropCoords] : [] }
                />

                {/* Floating labels */ }
                { pickupAddress ? (
                    <View style={ [styles.mapLabel, styles.mapLabelTop] }>
                        <Text style={ styles.mapLabelText } numberOfLines={ 1 }>{ pickupAddress }</Text>
                        <Ionicons name="pencil" size={ 14 } color={ Colors.textSecondary } />
                    </View>
                ) : null }
                { dropAddress && dropCoords ? (
                    <View style={ [styles.mapLabel, styles.mapLabelBottom] }>
                        <Text style={ styles.mapLabelText } numberOfLines={ 1 }>{ dropAddress }</Text>
                        <Ionicons name="pencil" size={ 14 } color={ Colors.textSecondary } />
                    </View>
                ) : null }

                {/* Locate me */ }
                <Pressable style={ styles.locateBtn } onPress={ goToCurrentLocation }>
                    <Ionicons name="locate" size={ 24 } color={ Colors.primary } />
                </Pressable>
            </View>

            {/* Bottom Sheet */ }
            <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={ false }
                contentContainerStyle={ styles.sheetScrollContent }
            >
                { !showVehicles ? (
                    <View style={ styles.bottomSheet }>
                        <View style={ styles.dragHandle } />
                        <Text style={ styles.sheetTitle }>Where are you going?</Text>
                        <View style={ styles.locationRow }>
                            <View style={ [styles.dot, { backgroundColor: '#10b981' }] } />
                            <View style={ styles.locationInputWrapper }>
                                <TextInput style={ styles.locationInput } placeholder="Enter pickup location" placeholderTextColor={ Colors.textMuted } value={ pickupAddress } onChangeText={ setPickupAddress } />
                            </View>
                        </View>
                        <View style={ styles.connector }><View style={ styles.connectorLine } /></View>
                        <View style={ styles.locationRow }>
                            <View style={ [styles.dot, { backgroundColor: '#ef4444' }] } />
                            <View style={ styles.locationInputWrapper }>
                                <TextInput style={ styles.locationInput } placeholder="Enter drop location" placeholderTextColor={ Colors.textMuted } value={ dropAddress } onChangeText={ setDropAddress } />
                            </View>
                        </View>
                        <Pressable onPress={ handleSearch } disabled={ loading } style={ ({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }] }>
                            <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.searchBtnGradient }>
                                <Ionicons name="search" size={ 18 } color="#fff" />
                                <Text style={ styles.searchBtnText }>{ loading ? 'Finding routes...' : 'Find Rides' }</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                ) : (
                    <Animated.View style={ [styles.vehicleSheet, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }] }>
                        <View style={ styles.dragHandle } />
                        <View style={ styles.addressSummary }>
                            <Ionicons name="location" size={ 20 } color="#10b981" />
                            <Text style={ styles.addressSummaryText } numberOfLines={ 1 }>{ pickupAddress }</Text>
                            <Ionicons name="arrow-forward" size={ 16 } color={ Colors.textMuted } />
                            <Ionicons name="location" size={ 20 } color="#ef4444" />
                            <Text style={ styles.addressSummaryText } numberOfLines={ 1 }>{ dropAddress }</Text>
                        </View>
                        { distanceKm && <Text style={ styles.distanceText }>Distance: { distanceKm } km</Text> }
                        <View style={ styles.vehicleListCenter }>
                            { VEHICLE_TYPES.map((veh) => {
                                const isSelected = selectedVehicle === veh.id;
                                const fare = estimates?.estimates?.[veh.id];
                                return (
                                    <Pressable key={ veh.id } onPress={ () => setSelectedVehicle(veh.id) } style={ [styles.vehicleCard, isSelected && styles.vehicleCardSelected] }>
                                        <MaterialCommunityIcons name={ veh.icon } size={ 36 } color={ isSelected ? Colors.primary : Colors.textSecondary } />
                                        <Text style={ [styles.vehicleLabel, isSelected && styles.vehicleLabelSelected] }>{ veh.label }</Text>
                                        <Text style={ styles.vehicleEta }>{ veh.eta }</Text>
                                        { fare != null && <Text style={ [styles.vehicleFare, isSelected && styles.vehicleFareSelected] }>₹{ fare }</Text> }
                                        <Text style={ styles.vehicleDesc }>{ veh.description }</Text>
                                    </Pressable>
                                );
                            }) }
                        </View>
                        <Pressable onPress={ handleBookRide } disabled={ loading } style={ ({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }] }>
                            <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.bookBtnGradient }>
                                <Text style={ styles.bookBtnText }>{ loading ? 'Booking...' : `Book ${selectedVehicle.charAt(0).toUpperCase() + selectedVehicle.slice(1)} • ₹${selectedEstimate || '--'}` }</Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable onPress={ () => setShowVehicles(false) } style={ styles.editBtn }>
                            <Ionicons name="pencil" size={ 16 } color={ Colors.textLink } />
                            <Text style={ styles.editBtnText }>Edit locations</Text>
                        </Pressable>
                    </Animated.View>
                ) }
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    topBarTitle: { ...Typography.h3, color: Colors.textPrimary },
    driverModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, ...Shadows.sm },
    driverModeBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
    mapContainer: { flex: 1, marginTop: Spacing.sm, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    mapContainerSmall: { flex: 0, height: 150 },
    markerWrap: { alignItems: 'center', justifyContent: 'center' },
    locateBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    mapLabel: { position: 'absolute', left: 16, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 220, ...Shadows.sm },
    mapLabelTop: { top: 16 },
    mapLabelBottom: { bottom: 16 },
    mapLabelText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, ...Shadows.lg },
    sheetScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
    dragHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
    sheetTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm, fontSize: 17 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dot: { width: 12, height: 12, borderRadius: 6 },
    locationInputWrapper: { flex: 1, backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg },
    locationInput: { ...Typography.bodyMedium, color: Colors.textPrimary, paddingVertical: Platform.OS === 'ios' ? 12 : 8 },
    connector: { marginLeft: 5, paddingVertical: 1 },
    connectorLine: { width: 2, height: 14, backgroundColor: Colors.border, marginLeft: 4 },
    searchBtn: { marginTop: Spacing.md, borderRadius: BorderRadius.full, overflow: 'hidden' },
    searchBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: Spacing.sm, borderRadius: BorderRadius.full },
    searchBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700', fontSize: 15 },
    vehicleSheet: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, ...Shadows.lg },
    addressSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
    addressSummaryText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
    distanceText: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.lg },
    vehicleListCenter: { alignItems: 'center', paddingVertical: Spacing.sm },
    vehicleCard: { width: 160, backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    vehicleCardSelected: { borderColor: Colors.primary, backgroundColor: '#eff6ff' },
    vehicleLabel: { ...Typography.labelMedium, color: Colors.textPrimary, marginTop: Spacing.xs },
    vehicleLabelSelected: { color: Colors.primary },
    vehicleEta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
    vehicleFare: { ...Typography.priceSmall, color: Colors.textPrimary, marginTop: Spacing.xs },
    vehicleFareSelected: { color: Colors.primary },
    vehicleDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
    bookBtn: { marginTop: Spacing.sm, borderRadius: BorderRadius.full, overflow: 'hidden' },
    bookBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full },
    bookBtnText: { ...Typography.labelLarge, color: '#fff', fontSize: 15, fontWeight: '700' },
    editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.xs, paddingVertical: Spacing.xs },
    editBtnText: { ...Typography.bodySmall, color: Colors.textLink, fontWeight: '600' },
});

export default GRiderHomeScreen;
