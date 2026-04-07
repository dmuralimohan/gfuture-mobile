import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import OSMMapView from '../../components/OSMMapView';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';

const DEFAULT_LOCATION = { latitude: 17.385044, longitude: 78.486671 };
const DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

const GRiderConfirmPickupScreen = ({ navigation, route }) => {
    const { pickupAddress, dropAddress, pickupCoords, dropCoords, vehicleType, fare, distance } = route.params || {};
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    const [pickup, setPickup] = useState(pickupAddress || '');
    const [drop, setDrop] = useState(dropAddress || '');
    const [pickupMarker, setPickupMarker] = useState(pickupCoords || null);
    const [dropMarker, setDropMarker] = useState(dropCoords || null);
    const [userLocation, setUserLocation] = useState(null);

    // Get current location
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: 5000 });
                    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setUserLocation(coords);
                    if (!pickupMarker) {
                        setPickupMarker(coords);
                        try {
                            const [geo] = await Location.reverseGeocodeAsync(coords);
                            if (geo) {
                                const parts = [geo.name, geo.street, geo.district || geo.subregion, geo.city].filter(Boolean);
                                setPickup(parts.join(', '));
                            }
                        } catch { /* geocode fail ok */ }
                    }
                } else {
                    setUserLocation(DEFAULT_LOCATION);
                    if (!pickupMarker) { setPickupMarker(DEFAULT_LOCATION); setPickup('Hyderabad Central'); }
                }
            } catch {
                setUserLocation(DEFAULT_LOCATION);
                if (!pickupMarker) { setPickupMarker(DEFAULT_LOCATION); setPickup('Hyderabad Central'); }
            }
        })();
    }, []);

    // Fit map
    useEffect(() => {
        if (pickupMarker && dropMarker && mapRef.current) {
            mapRef.current.fitToCoordinates([pickupMarker, dropMarker]);
        } else if (pickupMarker && mapRef.current) {
            mapRef.current.animateToRegion({ ...pickupMarker, ...DELTA }, 800);
        }
    }, [pickupMarker, dropMarker]);

    const handleConfirm = () => {
        navigation.navigate('GRiderHome', {
            confirmedPickup: pickup,
            confirmedDrop: drop,
            confirmedPickupCoords: pickupMarker,
            confirmedDropCoords: dropMarker,
        });
    };

    const goToMyLocation = () => {
        const loc = userLocation || pickupMarker || DEFAULT_LOCATION;
        mapRef.current?.animateToRegion({ ...loc, ...DELTA }, 800);
    };

    const center = pickupMarker || userLocation || DEFAULT_LOCATION;

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ StyleSheet.absoluteFill } />

            {/* Header */ }
            <View style={ styles.header }>
                <Pressable onPress={ () => navigation.goBack() } style={ styles.backBtn }>
                    <Ionicons name="arrow-back" size={ 24 } color={ Colors.textPrimary } />
                </Pressable>
                <Text style={ styles.headerTitle }>Confirm Pickup</Text>
                <View style={ { width: 40 } } />
            </View>

            {/* OpenStreetMap */ }
            <View style={ styles.mapContainer }>
                <OSMMapView
                    ref={ mapRef }
                    style={ StyleSheet.absoluteFill }
                    initialRegion={ { ...center, ...DELTA } }
                    showsUserLocation
                    userLocation={ userLocation }
                    markers={ [
                        ...(pickupMarker ? [{ id: 'pickup', ...pickupMarker, color: '#10b981', title: 'Pickup' }] : []),
                        ...(dropMarker ? [{ id: 'drop', ...dropMarker, color: '#ef4444', title: 'Drop' }] : []),
                    ] }
                />

                <Pressable style={ styles.locateBtn } onPress={ goToMyLocation }>
                    <Ionicons name="locate" size={ 24 } color={ Colors.primary } />
                </Pressable>
            </View>

            {/* Bottom Card */ }
            <KeyboardAvoidingView behavior={ Platform.OS === 'ios' ? 'padding' : undefined } style={ styles.bottomSheet }>
                <ScrollView
                    contentContainerStyle={ { paddingBottom: insets.bottom + Spacing.xxl } }
                    bounces={ false }
                    showsVerticalScrollIndicator={ false }
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={ styles.dragHandle } />

                    <View style={ styles.addressContainer }>
                        <View style={ styles.addressRow }>
                            <View style={ [styles.dot, { backgroundColor: '#10b981' }] } />
                            <View style={ styles.inputWrap }>
                                <Text style={ styles.inputLabel }>Pickup</Text>
                                <TextInput
                                    value={ pickup }
                                    onChangeText={ setPickup }
                                    placeholder="Enter pickup address"
                                    placeholderTextColor={ Colors.textMuted }
                                    style={ [styles.addressInput, styles.pickupInput] }
                                />
                            </View>
                        </View>

                        <View style={ styles.dividerLine } />

                        <View style={ styles.addressRow }>
                            <View style={ [styles.dot, { backgroundColor: '#ef4444' }] } />
                            <View style={ styles.inputWrap }>
                                <Text style={ styles.inputLabel }>Drop</Text>
                                <TextInput
                                    value={ drop }
                                    onChangeText={ setDrop }
                                    placeholder="Enter drop address"
                                    placeholderTextColor={ Colors.textMuted }
                                    style={ [styles.addressInput, styles.dropInput] }
                                />
                            </View>
                        </View>
                    </View>

                    {/* Info chips */ }
                    { (distance || fare) && (
                        <View style={ styles.chipRow }>
                            { distance ? <View style={ styles.chip }><Text style={ styles.chipText }>{ distance } km</Text></View> : null }
                            { vehicleType ? <View style={ styles.chip }><Text style={ styles.chipText }>{ vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1) }</Text></View> : null }
                            { fare ? <View style={ [styles.chip, styles.fareChip] }><Text style={ [styles.chipText, { color: '#fff' }] }>₹{ fare }</Text></View> : null }
                        </View>
                    ) }

                    <Pressable onPress={ handleConfirm } style={ ({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.92 }] }>
                        <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.confirmBtnGrad }>
                            <Text style={ styles.confirmBtnText }>Confirm Pickup</Text>
                        </LinearGradient>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    headerTitle: { ...Typography.h3, color: Colors.textPrimary },
    mapContainer: { flex: 1, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    marker: { alignItems: 'center', justifyContent: 'center' },
    locateBtn: { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '48%', ...Shadows.lg },
    dragHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
    addressContainer: { marginBottom: Spacing.lg },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 26 },
    dividerLine: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 2 },
    inputWrap: { flex: 1 },
    inputLabel: { ...Typography.labelSmall, color: Colors.textSecondary, marginBottom: 4 },
    addressInput: { ...Typography.bodyMedium, color: Colors.textPrimary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: BorderRadius.md, borderWidth: 1.5 },
    pickupInput: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    dropInput: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundInput },
    fareChip: { backgroundColor: Colors.primary },
    chipText: { ...Typography.labelSmall, color: Colors.textPrimary },
    confirmBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
    confirmBtnGrad: { paddingVertical: 18, alignItems: 'center', borderRadius: BorderRadius.full },
    confirmBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default GRiderConfirmPickupScreen;
