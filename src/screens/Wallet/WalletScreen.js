import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
    FlatList,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows, Gradients } from '../../theme';

const TXN_ICONS = {
    top_up: { icon: 'add-circle', color: Colors.success },
    payment: { icon: 'card', color: Colors.accentRed },
    credit_earned: { icon: 'star', color: Colors.accentOrange },
    credit_redeemed: { icon: 'gift', color: Colors.primary },
    refund: { icon: 'refresh-circle', color: Colors.accentCyan },
};

const WalletScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [showRedeem, setShowRedeem] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [redeemPoints, setRedeemPoints] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        try {
            const [walletRes, txnRes] = await Promise.all([
                walletService.getWallet(),
                walletService.getTransactions({ limit: 30 }),
            ]);
            setWallet(walletRes.data?.wallet || null);
            setTransactions(txnRes.data?.transactions || []);
        } catch (e) {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddFunds = async () => {
        const amount = parseFloat(fundAmount);
        if (!amount || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }
        setActionLoading(true);
        try {
            await walletService.addFunds(amount);
            setShowAddFunds(false);
            setFundAmount('');
            fetchData();
            Alert.alert('Success', `₹${amount} added to wallet`);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to add funds');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRedeem = async () => {
        const points = parseInt(redeemPoints);
        if (!points || points < 50) {
            Alert.alert('Invalid', 'Minimum 50 points required');
            return;
        }
        setActionLoading(true);
        try {
            const { data } = await walletService.redeemCredits(points);
            setShowRedeem(false);
            setRedeemPoints('');
            fetchData();
            Alert.alert('Success', data.message);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to redeem');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <View style={ [styles.container, styles.center] }>
                <Ionicons name="wallet-outline" size={ 80 } color={ Colors.textMuted } />
                <Text style={ styles.emptyTitle }>Sign in to access wallet</Text>
                <GradientButton
                    title="SIGN IN"
                    onPress={ () => navigation.navigate('Login') }
                    size="medium"
                    style={ { marginTop: Spacing.xl } }
                />
            </View>
        );
    }

    if (loading) {
        return (
            <View style={ [styles.container, styles.center] }>
                <ActivityIndicator size="large" color={ Colors.primary } />
            </View>
        );
    }

    const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

    const renderTransaction = ({ item }) => {
        const config = TXN_ICONS[item.type] || TXN_ICONS.top_up;
        const isPositive = item.amount > 0 || item.credit_points > 0;
        const date = item.created_at
            ? new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            })
            : '';

        return (
            <View style={ [styles.txnCard, Shadows.sm] }>
                <View style={ [styles.txnIcon, { backgroundColor: `${config.color}15` }] }>
                    <Ionicons name={ config.icon } size={ 22 } color={ config.color } />
                </View>
                <View style={ styles.txnInfo }>
                    <Text style={ styles.txnDesc } numberOfLines={ 1 }>{ item.description }</Text>
                    <Text style={ styles.txnDate }>{ date }</Text>
                </View>
                <View style={ styles.txnAmounts }>
                    { item.amount !== 0 && (
                        <Text style={ [styles.txnAmount, { color: item.amount > 0 ? Colors.success : Colors.accentRed }] }>
                            { item.amount > 0 ? '+' : '' }₹{ Math.abs(item.amount).toLocaleString('en-IN') }
                        </Text>
                    ) }
                    { item.credit_points !== 0 && (
                        <Text style={ [styles.txnCredits, { color: item.credit_points > 0 ? Colors.accentOrange : Colors.textMuted }] }>
                            { item.credit_points > 0 ? '+' : '' }{ item.credit_points } pts
                        </Text>
                    ) }
                </View>
            </View>
        );
    };

    return (
        <View style={ styles.container }>
            <FlatList
                data={ transactions }
                keyExtractor={ (item) => item.id.toString() }
                renderItem={ renderTransaction }
                refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
                contentContainerStyle={ styles.listContent }
                ListHeaderComponent={
                    <>
                        {/* Wallet Card */ }
                        <LinearGradient
                            colors={ ['#0a1628', '#1e3a5f'] }
                            start={ { x: 0, y: 0 } }
                            end={ { x: 1, y: 1 } }
                            style={ [styles.walletCard, { marginTop: insets.top + 16 }] }
                        >
                            <View style={ styles.walletHeader }>
                                <Text style={ styles.walletLabel }>GFUTURE WALLET</Text>
                                <TouchableOpacity onPress={ () => navigation.goBack() }>
                                    <Ionicons name="close" size={ 24 } color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            </View>

                            <Text style={ styles.walletBalance }>
                                ₹{ (wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
                            </Text>
                            <Text style={ styles.walletSubLabel }>Available Balance</Text>

                            <View style={ styles.creditRow }>
                                <View style={ styles.creditBadge }>
                                    <Ionicons name="star" size={ 16 } color={ Colors.accentOrange } />
                                    <Text style={ styles.creditText }>
                                        { wallet?.credit_points || 0 } Credit Points
                                    </Text>
                                </View>
                                <Text style={ styles.creditValue }>
                                    ≈ ₹{ ((wallet?.credit_points || 0) * 0.5).toFixed(0) }
                                </Text>
                            </View>

                            <View style={ styles.walletActions }>
                                <TouchableOpacity style={ styles.walletBtn } onPress={ () => setShowAddFunds(true) }>
                                    <Ionicons name="add-circle-outline" size={ 20 } color={ Colors.textWhite } />
                                    <Text style={ styles.walletBtnText }>Add Money</Text>
                                </TouchableOpacity>
                                <View style={ styles.walletDivider } />
                                <TouchableOpacity style={ styles.walletBtn } onPress={ () => setShowRedeem(true) }>
                                    <Ionicons name="gift-outline" size={ 20 } color={ Colors.textWhite } />
                                    <Text style={ styles.walletBtnText }>Redeem</Text>
                                </TouchableOpacity>
                                <View style={ styles.walletDivider } />
                                <TouchableOpacity style={ styles.walletBtn } onPress={ () => navigation.navigate('Orders') }>
                                    <Ionicons name="receipt-outline" size={ 20 } color={ Colors.textWhite } />
                                    <Text style={ styles.walletBtnText }>History</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        {/* Quick Actions */ }
                        <View style={ styles.quickSection }>
                            <View style={ styles.quickRow }>
                                <QuickAction icon="flash" label="Pay Bills" color={ Colors.accentOrange } />
                                <QuickAction icon="people" label="Send Money" color={ Colors.primary } />
                                <QuickAction icon="qr-code" label="Scan & Pay" color={ Colors.accentCyan } />
                                <QuickAction icon="card" label="Cards" color={ Colors.accentGreen } />
                            </View>
                        </View>

                        {/* Earn More */ }
                        <TouchableOpacity style={ [styles.earnBanner, Shadows.sm] }>
                            <LinearGradient
                                colors={ ['#fef3c7', '#fde68a'] }
                                style={ styles.earnGradient }
                            >
                                <View style={ styles.earnLeft }>
                                    <Ionicons name="star" size={ 24 } color="#92400e" />
                                    <View>
                                        <Text style={ styles.earnTitle }>Earn More Credits!</Text>
                                        <Text style={ styles.earnDesc }>
                                            Get 2% back as credit points on every order
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={ 20 } color="#92400e" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={ styles.sectionTitle }>Recent Transactions</Text>
                    </>
                }
                ListEmptyComponent={
                    <View style={ styles.emptyTxn }>
                        <Ionicons name="receipt-outline" size={ 48 } color={ Colors.textMuted } />
                        <Text style={ styles.emptyTxnText }>No transactions yet</Text>
                    </View>
                }
            />

            {/* Add Funds Modal */ }
            <Modal visible={ showAddFunds } transparent animationType="slide">
                <View style={ styles.modalOverlay }>
                    <View style={ [styles.modalContent, Shadows.lg] }>
                        <View style={ styles.modalHeader }>
                            <Text style={ styles.modalTitle }>Add Money to Wallet</Text>
                            <TouchableOpacity onPress={ () => setShowAddFunds(false) }>
                                <Ionicons name="close" size={ 24 } color={ Colors.textSecondary } />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={ styles.amountInput }
                            placeholder="Enter amount"
                            placeholderTextColor={ Colors.textMuted }
                            keyboardType="numeric"
                            value={ fundAmount }
                            onChangeText={ setFundAmount }
                        />

                        <View style={ styles.quickAmounts }>
                            { quickAmounts.map((amt) => (
                                <TouchableOpacity
                                    key={ amt }
                                    style={ [styles.quickAmtBtn, fundAmount === String(amt) && styles.quickAmtActive] }
                                    onPress={ () => setFundAmount(String(amt)) }
                                >
                                    <Text style={ [styles.quickAmtText, fundAmount === String(amt) && styles.quickAmtTextActive] }>
                                        ₹{ amt }
                                    </Text>
                                </TouchableOpacity>
                            )) }
                        </View>

                        <GradientButton
                            title="ADD MONEY"
                            onPress={ handleAddFunds }
                            loading={ actionLoading }
                            size="large"
                            style={ { width: '100%', marginTop: Spacing.lg } }
                        />
                    </View>
                </View>
            </Modal>

            {/* Redeem Credits Modal */ }
            <Modal visible={ showRedeem } transparent animationType="slide">
                <View style={ styles.modalOverlay }>
                    <View style={ [styles.modalContent, Shadows.lg] }>
                        <View style={ styles.modalHeader }>
                            <Text style={ styles.modalTitle }>Redeem Credit Points</Text>
                            <TouchableOpacity onPress={ () => setShowRedeem(false) }>
                                <Ionicons name="close" size={ 24 } color={ Colors.textSecondary } />
                            </TouchableOpacity>
                        </View>

                        <View style={ styles.redeemInfo }>
                            <Text style={ styles.redeemAvailable }>
                                Available: <Text style={ { color: Colors.accentOrange, fontWeight: '800' } }>{ wallet?.credit_points || 0 } pts</Text>
                            </Text>
                            <Text style={ styles.redeemRate }>1 point = ₹0.50</Text>
                        </View>

                        <TextInput
                            style={ styles.amountInput }
                            placeholder="Points to redeem (min 50)"
                            placeholderTextColor={ Colors.textMuted }
                            keyboardType="numeric"
                            value={ redeemPoints }
                            onChangeText={ setRedeemPoints }
                        />

                        { redeemPoints ? (
                            <Text style={ styles.redeemPreview }>
                                You'll get ₹{ (parseInt(redeemPoints || 0) * 0.5).toFixed(2) } in wallet
                            </Text>
                        ) : null }

                        <GradientButton
                            title="REDEEM POINTS"
                            onPress={ handleRedeem }
                            loading={ actionLoading }
                            size="large"
                            style={ { width: '100%', marginTop: Spacing.lg } }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const QuickAction = ({ icon, label, color }) => (
    <TouchableOpacity style={ styles.quickAction }>
        <View style={ [styles.quickIcon, { backgroundColor: `${color}15` }] }>
            <Ionicons name={ icon } size={ 22 } color={ color } />
        </View>
        <Text style={ styles.quickLabel }>{ label }</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    center: { justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

    walletCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    walletLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
    },
    walletBalance: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.textWhite,
        marginBottom: 4,
    },
    walletSubLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: Spacing.lg,
    },
    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.xl,
    },
    creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    creditText: { fontSize: 14, fontWeight: '600', color: Colors.textWhite },
    creditValue: { fontSize: 14, fontWeight: '700', color: Colors.accentOrange },

    walletActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: Spacing.lg,
    },
    walletBtn: { alignItems: 'center', gap: 6 },
    walletBtnText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
    walletDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

    quickSection: { marginBottom: Spacing.xl },
    quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
    quickAction: { alignItems: 'center', flex: 1 },
    quickIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

    earnBanner: { marginBottom: Spacing.xxl, borderRadius: BorderRadius.lg, overflow: 'hidden' },
    earnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    earnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    earnTitle: { fontSize: 15, fontWeight: '700', color: '#92400e' },
    earnDesc: { fontSize: 12, color: '#a16207', marginTop: 2 },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },

    txnCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundPaper,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    txnIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txnInfo: { flex: 1, marginLeft: Spacing.md },
    txnDesc: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    txnDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    txnAmounts: { alignItems: 'flex-end' },
    txnAmount: { fontSize: 15, fontWeight: '700' },
    txnCredits: { fontSize: 12, fontWeight: '600', marginTop: 2 },

    emptyTxn: { alignItems: 'center', paddingVertical: 40 },
    emptyTxnText: { fontSize: 14, color: Colors.textMuted, marginTop: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.xl },

    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.backgroundPaper,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        padding: Spacing.xxl,
        paddingBottom: 48,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

    amountInput: {
        backgroundColor: Colors.backgroundInput,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },

    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    quickAmtBtn: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.backgroundInput,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    quickAmtActive: { borderColor: Colors.primary, backgroundColor: '#eff4ff' },
    quickAmtText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    quickAmtTextActive: { color: Colors.primary },

    redeemInfo: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: 4,
    },
    redeemAvailable: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
    redeemRate: { fontSize: 13, color: Colors.textMuted },
    redeemPreview: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.success,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
});

export default WalletScreen;
