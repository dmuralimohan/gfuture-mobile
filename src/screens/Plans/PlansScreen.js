import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { planService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

const PLAN_COLORS = [
    { gradient: ['#e0e7ff', '#c7d2fe'], accent: '#4338ca', badge: '#818cf8' },
    { gradient: ['#dbeafe', '#93c5fd'], accent: '#1d4ed8', badge: '#3b82f6' },
    { gradient: ['#fef3c7', '#fde68a'], accent: '#92400e', badge: '#f59e0b' },
    { gradient: ['#d1fae5', '#6ee7b7'], accent: '#065f46', badge: '#10b981' },
];

const PlansScreen = ({ navigation }) => {
    const { isAuthenticated } = useAuth();
    const [plans, setPlans] = useState([]);
    const [myPlan, setMyPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subscribing, setSubscribing] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const plansRes = await planService.getAll();
            setPlans(plansRes.data?.plans || []);

            if (isAuthenticated) {
                try {
                    const myRes = await planService.getMy();
                    setMyPlan(myRes.data?.plan || null);
                } catch {
                    // ignore
                }
            }
        } catch (e) {
            setPlans([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSubscribe = async (planId) => {
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please sign in to subscribe to a plan.', [
                { text: 'Cancel' },
                { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            ]);
            return;
        }

        setSubscribing(planId);
        try {
            await planService.subscribe(planId);
            Alert.alert('Success!', 'Plan subscribed successfully');
            fetchData();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Subscription failed');
        } finally {
            setSubscribing(null);
        }
    };

    if (loading) {
        return (
            <View style={ [styles.container, styles.center] }>
                <ActivityIndicator size="large" color={ Colors.primary } />
            </View>
        );
    }

    return (
        <View style={ styles.container }>
            <ScreenHeader title="Plans & Pricing" onBack={ () => navigation.goBack() } />

            <ScrollView
                showsVerticalScrollIndicator={ false }
                refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
                contentContainerStyle={ styles.scrollContent }
            >
                {/* Current Plan Banner */ }
                { myPlan && (
                    <LinearGradient
                        colors={ ['#0a1628', '#1e3a5f'] }
                        style={ styles.currentPlanBanner }
                    >
                        <View style={ styles.currentLeft }>
                            <Ionicons name="shield-checkmark" size={ 28 } color={ Colors.accentCyan } />
                            <View>
                                <Text style={ styles.currentLabel }>CURRENT PLAN</Text>
                                <Text style={ styles.currentName }>{ myPlan.name }</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={ styles.managePlanBtn }>
                            <Text style={ styles.managePlanText }>Manage</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                ) }

                {/* Header Info */ }
                <View style={ styles.headerSection }>
                    <Text style={ styles.headerTitle }>Choose Your Plan</Text>
                    <Text style={ styles.headerSubtitle }>
                        Unlock premium features and maximize your earnings
                    </Text>
                </View>

                {/* Plan Cards */ }
                { plans.map((plan, index) => {
                    const colorSet = PLAN_COLORS[index % PLAN_COLORS.length];
                    const isActive = myPlan?.id === plan.id;
                    const features = typeof plan.features === 'string'
                        ? JSON.parse(plan.features)
                        : (plan.features || []);

                    return (
                        <View key={ plan.id } style={ [styles.planCard, Shadows.md] }>
                            <LinearGradient
                                colors={ colorSet.gradient }
                                style={ styles.planHeader }
                            >
                                { plan.recommended ? (
                                    <View style={ [styles.recommendBadge, { backgroundColor: colorSet.badge }] }>
                                        <Ionicons name="star" size={ 12 } color={ Colors.textWhite } />
                                        <Text style={ styles.recommendText }>RECOMMENDED</Text>
                                    </View>
                                ) : null }

                                <Text style={ [styles.planName, { color: colorSet.accent }] }>
                                    { plan.name }
                                </Text>

                                <View style={ styles.priceRow }>
                                    <Text style={ [styles.planCurrency, { color: colorSet.accent }] }>
                                        { plan.currency || '₹' }
                                    </Text>
                                    <Text style={ [styles.planPrice, { color: colorSet.accent }] }>
                                        { plan.price > 0 ? plan.price.toLocaleString('en-IN') : 'Free' }
                                    </Text>
                                </View>

                                { plan.description ? (
                                    <Text style={ [styles.planDesc, { color: `${colorSet.accent}99` }] }>
                                        { plan.description }
                                    </Text>
                                ) : null }
                            </LinearGradient>

                            <View style={ styles.planBody }>
                                { features.map((feat, idx) => (
                                    <View key={ idx } style={ styles.featureRow }>
                                        <Ionicons name="checkmark-circle" size={ 18 } color={ Colors.success } />
                                        <Text style={ styles.featureText }>{ feat }</Text>
                                    </View>
                                )) }

                                { isActive ? (
                                    <View style={ styles.activeBtn }>
                                        <Ionicons name="checkmark" size={ 18 } color={ Colors.success } />
                                        <Text style={ styles.activeBtnText }>Current Plan</Text>
                                    </View>
                                ) : (
                                    <GradientButton
                                        title={ plan.cta || 'Choose Plan' }
                                        onPress={ () => handleSubscribe(plan.id) }
                                        loading={ subscribing === plan.id }
                                        size="medium"
                                        style={ { width: '100%', marginTop: Spacing.lg } }
                                    />
                                ) }
                            </View>
                        </View>
                    );
                }) }

                { plans.length === 0 && (
                    <View style={ styles.emptyContainer }>
                        <Ionicons name="layers-outline" size={ 64 } color={ Colors.textMuted } />
                        <Text style={ styles.emptyTitle }>No plans available</Text>
                    </View>
                ) }
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: Spacing.xl, paddingBottom: 120 },

    currentPlanBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    currentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    currentLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.accentCyan,
        letterSpacing: 1.5,
    },
    currentName: { fontSize: 17, fontWeight: '700', color: Colors.textWhite },
    managePlanBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    managePlanText: { fontSize: 13, fontWeight: '600', color: Colors.textWhite },

    headerSection: { marginBottom: Spacing.xxl },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
    headerSubtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

    planCard: {
        backgroundColor: Colors.backgroundPaper,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginBottom: Spacing.xl,
    },
    planHeader: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    recommendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
        marginBottom: Spacing.md,
    },
    recommendText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textWhite,
        letterSpacing: 1,
    },
    planName: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 6 },
    planCurrency: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    planPrice: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
    planDesc: { fontSize: 13, fontWeight: '500' },

    planBody: { padding: Spacing.xl },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.md,
    },
    featureText: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },

    activeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BorderRadius.xxl,
        backgroundColor: '#d1fae5',
        marginTop: Spacing.lg,
    },
    activeBtnText: { fontSize: 14, fontWeight: '700', color: '#065f46' },

    emptyContainer: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.lg },
});

export default PlansScreen;
