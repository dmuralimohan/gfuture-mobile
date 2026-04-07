import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { rideService } from '../../services/endpoints';

const DriverRegisterScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if already registered
    React.useEffect(() => {
        (async () => {
            try {
                const { data } = await rideService.riderProfile();
                if (data.registered) {
                    navigation.replace('DriverDashboard');
                    return;
                }
            } catch { /* not registered, show form */ }
            setChecking(false);
        })();
    }, []);

    const handleRegister = async () => {
        if (!vehicleNumber.trim() || !vehicleModel.trim()) {
            Alert.alert('Missing Info', 'Please enter vehicle number and model');
            return;
        }
        setLoading(true);
        try {
            await rideService.riderRegister({
                vehicleType: 'bike',
                vehicleNumber: vehicleNumber.trim(),
                vehicleModel: vehicleModel.trim(),
            });
            Alert.alert('Success', 'Registered as G-Rider driver!', [
                { text: 'OK', onPress: () => navigation.replace('DriverDashboard') },
            ]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            if (err.response?.status === 409) {
                navigation.replace('DriverDashboard');
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <View style={ [styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }] }>
                <Text style={ { color: Colors.textSecondary } }>Checking registration...</Text>
            </View>
        );
    }

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#fff'] } style={ StyleSheet.absoluteFill } />
            <ScrollView contentContainerStyle={ styles.content } keyboardShouldPersistTaps="handled">
                <Pressable onPress={ () => navigation.goBack() } style={ styles.backBtn }>
                    <Ionicons name="arrow-back" size={ 24 } color={ Colors.textPrimary } />
                </Pressable>

                <View style={ styles.iconWrap }>
                    <MaterialCommunityIcons name="motorbike" size={ 64 } color={ Colors.primary } />
                </View>
                <Text style={ styles.title }>Become a G-Rider</Text>
                <Text style={ styles.subtitle }>Register your bike to start earning</Text>

                <View style={ styles.form }>
                    <Text style={ styles.label }>Vehicle Number</Text>
                    <TextInput
                        style={ styles.input }
                        placeholder="e.g. TS 09 AB 1234"
                        placeholderTextColor={ Colors.textMuted }
                        value={ vehicleNumber }
                        onChangeText={ setVehicleNumber }
                        autoCapitalize="characters"
                    />

                    <Text style={ styles.label }>Vehicle Model</Text>
                    <TextInput
                        style={ styles.input }
                        placeholder="e.g. Honda Activa 6G"
                        placeholderTextColor={ Colors.textMuted }
                        value={ vehicleModel }
                        onChangeText={ setVehicleModel }
                    />

                    <View style={ styles.infoBox }>
                        <Ionicons name="information-circle" size={ 20 } color={ Colors.primary } />
                        <Text style={ styles.infoText }>
                            Only bike rides are currently supported. Your profile will be verified instantly.
                        </Text>
                    </View>

                    <Pressable
                        onPress={ handleRegister }
                        disabled={ loading }
                        style={ ({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }] }
                    >
                        <LinearGradient colors={ ['#0EA5E9', '#38BDF8'] } start={ { x: 0, y: 0 } } end={ { x: 1, y: 0 } } style={ styles.registerBtnGradient }>
                            <MaterialCommunityIcons name="motorbike" size={ 22 } color="#fff" />
                            <Text style={ styles.registerBtnText }>{ loading ? 'Registering...' : 'Register as Driver' }</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.xl, paddingBottom: 40 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm, marginBottom: Spacing.xl },
    iconWrap: { alignItems: 'center', marginBottom: Spacing.lg },
    title: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
    subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
    form: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadows.md },
    label: { ...Typography.labelMedium, color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.lg },
    input: { backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, ...Typography.bodyMedium, color: Colors.textPrimary },
    infoBox: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#eff6ff', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xl, alignItems: 'flex-start' },
    infoText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
    registerBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.full, overflow: 'hidden' },
    registerBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: Spacing.sm, borderRadius: BorderRadius.full },
    registerBtnText: { ...Typography.labelLarge, color: '#fff', fontWeight: '700' },
});

export default DriverRegisterScreen;
