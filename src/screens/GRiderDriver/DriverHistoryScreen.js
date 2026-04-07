import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../theme';
import { rideService } from '../../services/endpoints';

const statusColors = {
    completed: '#10b981',
    cancelled: '#ef4444',
    in_progress: '#f59e0b',
    accepted: '#3b82f6',
    searching: '#94a3b8',
};

const DriverHistoryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const { data } = await rideService.riderHistory();
            setRides(data.rides || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const renderItem = ({ item }) => (
        <View style={ styles.card }>
            <View style={ styles.cardHeader }>
                <MaterialCommunityIcons name="motorbike" size={ 20 } color={ Colors.primary } />
                <Text style={ styles.cardFare }>₹{ item.finalFare || item.estimatedFare }</Text>
                <View style={ [styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#94a3b8') + '20' }] }>
                    <Text style={ [styles.statusText, { color: statusColors[item.status] || '#94a3b8' }] }>
                        { item.status?.replace('_', ' ') }
                    </Text>
                </View>
            </View>
            <View style={ styles.routeRow }>
                <View style={ [styles.dot, { backgroundColor: '#10b981' }] } />
                <Text style={ styles.routeText } numberOfLines={ 1 }>{ item.pickupAddress }</Text>
            </View>
            <View style={ styles.routeRow }>
                <View style={ [styles.dot, { backgroundColor: '#ef4444' }] } />
                <Text style={ styles.routeText } numberOfLines={ 1 }>{ item.dropAddress }</Text>
            </View>
            <View style={ styles.cardFooter }>
                <Text style={ styles.footerText }>{ item.customerName }</Text>
                <Text style={ styles.footerText }>{ item.distanceKm } km</Text>
                { item.rating && <Text style={ styles.footerText }>⭐ { item.rating }</Text> }
                <Text style={ styles.footerDate }>{ new Date(item.createdAt).toLocaleDateString() }</Text>
            </View>
        </View>
    );

    return (
        <View style={ [styles.container, { paddingTop: insets.top }] }>
            <View style={ styles.header }>
                <Pressable onPress={ () => navigation.goBack() } style={ styles.backBtn }>
                    <Ionicons name="arrow-back" size={ 22 } color={ Colors.textPrimary } />
                </Pressable>
                <Text style={ styles.headerTitle }>Ride History</Text>
                <View style={ { width: 40 } } />
            </View>
            <FlatList
                data={ rides }
                keyExtractor={ (item) => item.id }
                renderItem={ renderItem }
                contentContainerStyle={ { padding: Spacing.lg, paddingBottom: 40 } }
                showsVerticalScrollIndicator={ false }
                ListEmptyComponent={
                    <View style={ styles.empty }>
                        <Ionicons name="time-outline" size={ 48 } color={ Colors.textMuted } />
                        <Text style={ styles.emptyText }>{ loading ? 'Loading...' : 'No ride history yet' }</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    headerTitle: { ...Typography.h3, color: Colors.textPrimary },
    card: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    cardFare: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    statusText: { ...Typography.caption, fontWeight: '600', textTransform: 'capitalize' },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    routeText: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
    cardFooter: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, flexWrap: 'wrap' },
    footerText: { ...Typography.caption, color: Colors.textSecondary },
    footerDate: { ...Typography.caption, color: Colors.textMuted },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.md },
});

export default DriverHistoryScreen;
