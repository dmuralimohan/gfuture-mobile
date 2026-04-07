import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services';
import * as wsService from '../../services/wsService';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const STATUS_COLORS = {
    pending: { bg: '#fef3c7', text: '#92400e', icon: 'time-outline' },
    confirmed: { bg: '#dbeafe', text: '#1e40af', icon: 'checkmark-circle-outline' },
    'in-progress': { bg: '#e0e7ff', text: '#3730a3', icon: 'reload-outline' },
    completed: { bg: '#d1fae5', text: '#065f46', icon: 'checkmark-done-outline' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', icon: 'close-circle-outline' },
};

const OrderDetailScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [order, setOrder] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [submittingLink, setSubmittingLink] = useState(false);

    // Course meeting state
    const [isCourse, setIsCourse] = useState(false);
    const [courseMeeting, setCourseMeeting] = useState(null);
    const [courseMeetingLink, setCourseMeetingLink] = useState('');
    const [courseMeetingTime, setCourseMeetingTime] = useState('');
    const [courseMeetingDate, setCourseMeetingDate] = useState('');
    const [submittingCourseLink, setSubmittingCourseLink] = useState(false);

    // Provider fields (for regular meeting flow)
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingDate, setMeetingDate] = useState('');

    const isProvider = user?.role === 'provider';

    const fetchData = useCallback(async () => {
        try {
            const [orderRes, meetingRes, courseRes] = await Promise.all([
                orderService.getById(orderId),
                orderService.getMeeting(orderId),
                orderService.getCourseMeeting(orderId),
            ]);
            setOrder(orderRes.data.order);
            setMeeting(meetingRes.data.meeting);
            if (courseRes.data.isCourse) {
                setIsCourse(true);
                setCourseMeeting(courseRes.data.courseMeeting);
                if (courseRes.data.courseMeeting) {
                    setCourseMeetingLink(courseRes.data.courseMeeting.meeting_link || '');
                    setCourseMeetingTime(courseRes.data.courseMeeting.meeting_time || '');
                    setCourseMeetingDate(courseRes.data.courseMeeting.meeting_date || '');
                }
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Listen for real-time meeting updates
    useEffect(() => {
        const unsub1 = wsService.on('MEETING_LINK_SHARED', (data) => {
            if (data.orderId === orderId) {
                setMeeting(data.meeting);
                Alert.alert('Meeting Link Received', `${data.providerName} shared a meeting link!`);
            }
        });
        const unsub2 = wsService.on('MEETING_REQUESTED', (data) => {
            if (data.orderId === orderId) {
                setMeeting(data.meeting);
                Alert.alert('Meeting Requested', `${data.customerName} has requested a meeting.`);
            }
        });
        const unsub3 = wsService.on('COURSE_MEETING_UPDATED', (data) => {
            if (data.courseMeeting) {
                setCourseMeeting(data.courseMeeting);
                setCourseMeetingLink(data.courseMeeting.meeting_link || '');
                setCourseMeetingTime(data.courseMeeting.meeting_time || '');
                setCourseMeetingDate(data.courseMeeting.meeting_date || '');
                if (!isProvider) {
                    Alert.alert(
                        'Course Meeting Updated',
                        `${data.providerName} updated the meeting link for "${data.serviceName}".`
                    );
                }
            }
        });
        return () => { unsub1(); unsub2(); unsub3(); };
    }, [orderId, isProvider]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleRequestMeeting = async () => {
        setRequesting(true);
        try {
            const { data } = await orderService.requestMeeting(orderId, 'I have a query about this order');
            setMeeting(data.meeting);
            Alert.alert('Success', 'Meeting request sent to provider!');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to request meeting');
        } finally {
            setRequesting(false);
        }
    };

    const handleShareLink = async () => {
        if (!meetingLink.trim()) {
            Alert.alert('Error', 'Please enter a meeting link');
            return;
        }
        setSubmittingLink(true);
        try {
            const { data } = await orderService.shareMeetingLink(orderId, {
                meeting_link: meetingLink.trim(),
                meeting_time: meetingTime.trim() || null,
                meeting_date: meetingDate.trim() || null,
            });
            setMeeting(data.meeting);
            Alert.alert('Success', 'Meeting link shared with customer!');
            setMeetingLink('');
            setMeetingTime('');
            setMeetingDate('');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to share meeting link');
        } finally {
            setSubmittingLink(false);
        }
    };

    const handleJoinMeeting = () => {
        if (meeting?.meeting_link) {
            Linking.openURL(meeting.meeting_link).catch(() =>
                Alert.alert('Error', 'Could not open meeting link')
            );
        }
    };

    const handleCopyLink = () => {
        if (meeting?.meeting_link) {
            const Clipboard = require('react-native').Clipboard;
            if (Clipboard?.setString) {
                Clipboard.setString(meeting.meeting_link);
                Alert.alert('Copied', 'Meeting link copied to clipboard');
            }
        }
    };

    // ─── Course Meeting Handlers ────────────────────

    const handleSetCourseMeetingLink = async () => {
        if (!courseMeetingLink.trim()) {
            Alert.alert('Error', 'Please enter a meeting link');
            return;
        }
        setSubmittingCourseLink(true);
        try {
            const { data } = await orderService.setCourseMeetingLink(orderId, {
                meeting_link: courseMeetingLink.trim(),
                meeting_time: courseMeetingTime.trim() || null,
                meeting_date: courseMeetingDate.trim() || null,
            });
            setCourseMeeting(data.courseMeeting);
            Alert.alert(
                'Success',
                `Meeting link shared with ${data.notifiedCount} student${data.notifiedCount !== 1 ? 's' : ''}!`
            );
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to set course meeting link');
        } finally {
            setSubmittingCourseLink(false);
        }
    };

    const handleJoinCourseMeeting = () => {
        if (courseMeeting?.meeting_link) {
            Linking.openURL(courseMeeting.meeting_link).catch(() =>
                Alert.alert('Error', 'Could not open meeting link')
            );
        }
    };

    const handleCopyCourseMeetingLink = () => {
        if (courseMeeting?.meeting_link) {
            const Clipboard = require('react-native').Clipboard;
            if (Clipboard?.setString) {
                Clipboard.setString(courseMeeting.meeting_link);
                Alert.alert('Copied', 'Meeting link copied to clipboard');
            }
        }
    };

    if (loading) {
        return (
            <View style={ [styles.container, styles.centered] }>
                <ActivityIndicator size="large" color={ Colors.primary } />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={ [styles.container, styles.centered] }>
                <Ionicons name="alert-circle-outline" size={ 48 } color={ Colors.textMuted } />
                <Text style={ styles.errorText }>Order not found</Text>
            </View>
        );
    }

    const statusConfig = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
    const orderDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : '';

    const firstItem = order.items?.[0];
    const serviceName = firstItem?.service_name || 'Service';

    return (
        <View style={ styles.container }>
            {/* Header */ }
            <View style={ [styles.header, { paddingTop: insets.top + 8 }] }>
                <TouchableOpacity onPress={ () => navigation.goBack() } style={ styles.headerBtn }>
                    <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
                </TouchableOpacity>
                <Text style={ styles.headerTitle }>DETAILS</Text>
                <TouchableOpacity style={ styles.headerBtn }>
                    <Ionicons name="heart-outline" size={ 24 } color={ Colors.textPrimary } />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={ false }
                contentContainerStyle={ styles.scrollContent }
                refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
            >
                {/* Service Image */ }
                { firstItem && (
                    <View style={ styles.imageContainer }>
                        <Image
                            source={ { uri: firstItem.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600' } }
                            style={ styles.serviceImage }
                            contentFit="cover"
                            transition={ 300 }
                        />
                    </View>
                ) }

                {/* Order Info */ }
                <View style={ styles.infoSection }>
                    <View style={ styles.orderMeta }>
                        <Text style={ styles.orderId }>#{ order.id?.substring(0, 8).toUpperCase() }</Text>
                        <Text style={ styles.orderDate }>{ orderDate }</Text>
                    </View>
                    <Text style={ styles.serviceName }>{ serviceName }</Text>
                </View>

                {/* Description Card */ }
                { firstItem?.description && (
                    <View style={ [styles.descCard, Shadows.sm] }>
                        <Text style={ styles.descTitle }>Description</Text>
                        <Text style={ styles.descText }>
                            { firstItem.description?.length > 120
                                ? firstItem.description.slice(0, 120) + '...'
                                : firstItem.description }
                        </Text>
                        { firstItem.description?.length > 120 && (
                            <TouchableOpacity>
                                <Text style={ styles.readMore }>Read More</Text>
                            </TouchableOpacity>
                        ) }
                    </View>
                ) }

                {/* Items List */ }
                { order.items?.length > 0 && (
                    <View style={ styles.itemsSection }>
                        <Text style={ styles.sectionTitle }>Order Items</Text>
                        { order.items.map((item, idx) => (
                            <View key={ idx } style={ styles.itemRow }>
                                <Text style={ styles.itemName }>• { item.service_name }</Text>
                                <Text style={ styles.itemQty }>x{ item.quantity }</Text>
                                <Text style={ styles.itemPrice }>₹{ (item.price * item.quantity).toLocaleString('en-IN') }</Text>
                            </View>
                        )) }
                    </View>
                ) }

                {/* Status Badge */ }
                <View style={ styles.statusSection }>
                    <View style={ [styles.statusBadge, { backgroundColor: statusConfig.bg }] }>
                        <Ionicons name={ statusConfig.icon } size={ 16 } color={ statusConfig.text } />
                        <Text style={ [styles.statusText, { color: statusConfig.text }] }>
                            { order.status?.charAt(0).toUpperCase() + order.status?.slice(1) }
                        </Text>
                    </View>
                    <Text style={ styles.totalValue }>₹{ order.total?.toLocaleString('en-IN') }</Text>
                </View>

                {/* ─── Course Meeting Section ────────────────── */ }
                { isCourse && isProvider && (
                    <View style={ [styles.courseMeetingCard, Shadows.sm] }>
                        <View style={ styles.meetingCardHeader }>
                            <Ionicons name="school" size={ 22 } color={ Colors.primary } />
                            <Text style={ styles.meetingCardTitle }>Course Meeting Link</Text>
                        </View>
                        <Text style={ styles.meetingCardSubtext }>
                            { courseMeeting?.meeting_link
                                ? 'Update the meeting link below. All enrolled students will be notified via SMS.'
                                : 'Set a meeting link for this course. All enrolled students will be notified.' }
                        </Text>

                        <TextInput
                            style={ styles.meetingInput }
                            placeholder="Paste meeting link (Zoom, Meet, Teams, etc.)"
                            placeholderTextColor={ Colors.textMuted }
                            value={ courseMeetingLink }
                            onChangeText={ setCourseMeetingLink }
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={ styles.meetingTimeRow }>
                            <TextInput
                                style={ [styles.meetingInput, styles.meetingTimeInput] }
                                placeholder="Time (e.g. 11:00 AM)"
                                placeholderTextColor={ Colors.textMuted }
                                value={ courseMeetingTime }
                                onChangeText={ setCourseMeetingTime }
                            />
                            <TextInput
                                style={ [styles.meetingInput, styles.meetingTimeInput] }
                                placeholder="Date (e.g. 20 Mar 2026)"
                                placeholderTextColor={ Colors.textMuted }
                                value={ courseMeetingDate }
                                onChangeText={ setCourseMeetingDate }
                            />
                        </View>

                        <TouchableOpacity
                            style={ styles.shareLinkBtn }
                            onPress={ handleSetCourseMeetingLink }
                            disabled={ submittingCourseLink }
                            activeOpacity={ 0.85 }
                        >
                            <LinearGradient
                                colors={ [Colors.primaryDark, '#1e293b'] }
                                style={ styles.shareLinkGradient }
                            >
                                <Text style={ styles.shareLinkText }>
                                    { submittingCourseLink
                                        ? 'Sharing...'
                                        : courseMeeting?.meeting_link
                                            ? 'Update & Notify Students'
                                            : 'Share Meeting Link' }
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        { courseMeeting?.meeting_link && (
                            <View style={ styles.courseMeetingSharedInfo }>
                                <Ionicons name="checkmark-circle" size={ 16 } color={ Colors.success } />
                                <Text style={ styles.courseMeetingSharedText }>
                                    Link active{ courseMeeting.meeting_time ? ` • ${courseMeeting.meeting_time}` : '' }
                                    { courseMeeting.meeting_date ? ` • ${courseMeeting.meeting_date}` : '' }
                                </Text>
                            </View>
                        ) }
                    </View>
                ) }

                {/* Customer: Course meeting card with join */ }
                { isCourse && !isProvider && courseMeeting?.meeting_link && (
                    <View style={ [styles.courseStudentCard, Shadows.sm] }>
                        <View style={ styles.meetingCardHeader }>
                            <Ionicons name="videocam" size={ 22 } color={ Colors.primary } />
                            <Text style={ styles.meetingCardTitle }>Course Meeting</Text>
                        </View>
                        { (courseMeeting.meeting_time || courseMeeting.meeting_date) && (
                            <View style={ styles.courseScheduleRow }>
                                <Ionicons name="time-outline" size={ 16 } color={ Colors.accentOrange } />
                                <Text style={ styles.courseScheduleText }>
                                    { [courseMeeting.meeting_time, courseMeeting.meeting_date].filter(Boolean).join(' • ') }
                                </Text>
                            </View>
                        ) }
                        <View style={ styles.courseLinkRow }>
                            <Text style={ styles.courseLinkText } numberOfLines={ 1 }>
                                { courseMeeting.meeting_link }
                            </Text>
                            <TouchableOpacity onPress={ handleCopyCourseMeetingLink } style={ styles.courseCopyBtn }>
                                <Ionicons name="copy-outline" size={ 18 } color={ Colors.primary } />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={ handleJoinCourseMeeting }
                            activeOpacity={ 0.85 }
                            style={ styles.shareLinkBtn }
                        >
                            <LinearGradient
                                colors={ [Colors.primary, Colors.primaryLight] }
                                style={ styles.courseJoinGradient }
                            >
                                <Ionicons name="videocam" size={ 20 } color="#fff" />
                                <Text style={ styles.courseJoinText }>JOIN MEETING</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) }

                {/* Customer: Course ordered but no meeting link yet */ }
                { isCourse && !isProvider && !courseMeeting?.meeting_link && (
                    <View style={ styles.meetingPendingCard }>
                        <Ionicons name="school-outline" size={ 24 } color={ Colors.accentOrange } />
                        <Text style={ styles.meetingPendingText }>
                            Your course is confirmed. The instructor will share the meeting link soon.
                        </Text>
                    </View>
                ) }

                {/* ─── Meeting Section ───────────────────────────── */ }

                {/* Customer: Request Meeting button (only if no active meeting) */ }
                { !isProvider && !meeting && (
                    <TouchableOpacity
                        style={ styles.requestMeetingBtn }
                        onPress={ handleRequestMeeting }
                        disabled={ requesting }
                        activeOpacity={ 0.8 }
                    >
                        <Ionicons name="videocam-outline" size={ 20 } color={ Colors.primary } />
                        <Text style={ styles.requestMeetingText }>
                            { requesting ? 'Requesting...' : 'Request Meeting with Provider' }
                        </Text>
                    </TouchableOpacity>
                ) }

                {/* Customer: Meeting requested, waiting for link */ }
                { !isProvider && meeting?.status === 'requested' && (
                    <View style={ styles.meetingPendingCard }>
                        <Ionicons name="time-outline" size={ 24 } color={ Colors.accentOrange } />
                        <Text style={ styles.meetingPendingText }>
                            Meeting requested. Waiting for provider to share meeting link...
                        </Text>
                    </View>
                ) }

                {/* Provider: Meeting request received - share link form */ }
                { isProvider && meeting?.status === 'requested' && (
                    <View style={ [styles.providerMeetingCard, Shadows.sm] }>
                        <View style={ styles.meetingCardHeader }>
                            <Ionicons name="videocam" size={ 22 } color={ Colors.primary } />
                            <Text style={ styles.meetingCardTitle }>Meeting Requested</Text>
                        </View>
                        <Text style={ styles.meetingCardSubtext }>
                            Customer has requested a meeting. Share your meeting link below.
                        </Text>

                        <TextInput
                            style={ styles.meetingInput }
                            placeholder="Paste meeting link (Zoom, Meet, etc.)"
                            placeholderTextColor={ Colors.textMuted }
                            value={ meetingLink }
                            onChangeText={ setMeetingLink }
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={ styles.meetingTimeRow }>
                            <TextInput
                                style={ [styles.meetingInput, styles.meetingTimeInput] }
                                placeholder="Time (e.g. 11:00 AM)"
                                placeholderTextColor={ Colors.textMuted }
                                value={ meetingTime }
                                onChangeText={ setMeetingTime }
                            />
                            <TextInput
                                style={ [styles.meetingInput, styles.meetingTimeInput] }
                                placeholder="Date (e.g. 20 Mar 2026)"
                                placeholderTextColor={ Colors.textMuted }
                                value={ meetingDate }
                                onChangeText={ setMeetingDate }
                            />
                        </View>

                        <TouchableOpacity
                            style={ styles.shareLinkBtn }
                            onPress={ handleShareLink }
                            disabled={ submittingLink }
                            activeOpacity={ 0.85 }
                        >
                            <LinearGradient
                                colors={ [Colors.primaryDark, '#1e293b'] }
                                style={ styles.shareLinkGradient }
                            >
                                <Text style={ styles.shareLinkText }>
                                    { submittingLink ? 'Sharing...' : 'Share Meeting Link' }
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) }

                {/* Provider: Link already shared */ }
                { isProvider && meeting?.status === 'link_shared' && (
                    <View style={ [styles.meetingSharedCard, Shadows.sm] }>
                        <Ionicons name="checkmark-circle" size={ 22 } color={ Colors.success } />
                        <Text style={ styles.meetingSharedText }>Meeting link shared with customer</Text>
                        { meeting.meeting_time && (
                            <Text style={ styles.meetingSharedTime }>
                                { meeting.meeting_time }{ meeting.meeting_date ? ` • ${meeting.meeting_date}` : '' }
                            </Text>
                        ) }
                    </View>
                ) }

                <View style={ { height: 140 } } />
            </ScrollView>

            {/* ─── Bottom Bar: Meeting Join ─────────────────── */ }
            { !isProvider && meeting?.status === 'link_shared' && (
                <View style={ [styles.bottomBar, { paddingBottom: insets.bottom + 12 }] }>
                    <View style={ styles.slotInfo }>
                        <Text style={ styles.slotLabel }>Slot Selected</Text>
                        <Text style={ styles.slotTime }>{ meeting.meeting_time || 'TBD' }</Text>
                        <Text style={ styles.slotDate }>{ meeting.meeting_date || '' }</Text>
                    </View>

                    <TouchableOpacity onPress={ handleCopyLink } style={ styles.copyLinkBtn }>
                        <Ionicons name="link-outline" size={ 22 } color={ Colors.primary } />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={ handleJoinMeeting }
                        activeOpacity={ 0.85 }
                        style={ styles.joinBtn }
                    >
                        <LinearGradient
                            colors={ [Colors.primaryDark, '#1e293b'] }
                            style={ styles.joinBtnGradient }
                        >
                            <Text style={ styles.joinBtnText }>JOIN MEETING</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDefault,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: Spacing.md,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 12,
        backgroundColor: Colors.backgroundPaper,
        ...Shadows.sm,
        zIndex: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: Colors.textPrimary,
    },

    scrollContent: {
        paddingBottom: 20,
    },

    // Image
    imageContainer: {
        marginHorizontal: 20,
        marginTop: Spacing.lg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        height: 220,
        backgroundColor: '#1a1a2e',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },

    // Info
    infoSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    orderMeta: {
        marginBottom: Spacing.xs,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    orderDate: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
    },

    // Description
    descCard: {
        margin: Spacing.xl,
        padding: Spacing.lg,
        backgroundColor: '#f5f7ff',
        borderRadius: BorderRadius.lg,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    descTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    descText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    readMore: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.accentOrange,
        marginTop: Spacing.sm,
    },

    // Items
    itemsSection: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    itemQty: {
        fontSize: 13,
        color: Colors.textMuted,
        marginRight: Spacing.md,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    // Status
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
    },

    // Meeting - Customer request
    requestMeetingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        backgroundColor: '#f0f4ff',
    },
    requestMeetingText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },

    // Meeting pending
    meetingPendingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#fef3c7',
    },
    meetingPendingText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 20,
    },

    // Provider meeting form
    providerMeetingCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundPaper,
    },
    meetingCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.sm,
    },
    meetingCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    meetingCardSubtext: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    meetingInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.textPrimary,
        backgroundColor: Colors.backgroundInput,
        marginBottom: Spacing.md,
    },
    meetingTimeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    meetingTimeInput: {
        flex: 1,
    },
    shareLinkBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    shareLinkGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
    },
    shareLinkText: {
        color: Colors.textWhite,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Meeting shared (provider view)
    meetingSharedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#d1fae5',
    },
    meetingSharedText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#065f46',
    },
    meetingSharedTime: {
        width: '100%',
        fontSize: 13,
        color: '#065f46',
        marginTop: 4,
    },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        backgroundColor: Colors.backgroundPaper,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...Shadows.sm,
    },
    slotInfo: {
        flex: 1,
    },
    slotLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    slotTime: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginTop: 2,
    },
    slotDate: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    copyLinkBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    joinBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    joinBtnGradient: {
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: BorderRadius.lg,
    },
    joinBtnText: {
        color: Colors.textWhite,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Course meeting — provider card
    courseMeetingCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.backgroundPaper,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    courseMeetingSharedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: Spacing.md,
    },
    courseMeetingSharedText: {
        fontSize: 12,
        color: Colors.success,
        fontWeight: '600',
    },

    // Course meeting — student card
    courseStudentCard: {
        marginHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: '#eef2ff',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
    },
    courseScheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.md,
    },
    courseScheduleText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.accentOrange,
    },
    courseLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: BorderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    courseLinkText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
    },
    courseCopyBtn: {
        padding: 4,
        marginLeft: 8,
    },
    courseJoinGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
    },
    courseJoinText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default OrderDetailScreen;
