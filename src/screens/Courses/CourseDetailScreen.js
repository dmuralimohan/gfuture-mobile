import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { courseService } from '../../services';
import { API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const CourseDetailScreen = ({ route, navigation }) => {
    const { courseId } = route.params;
    const { user, isProvider } = useAuth();
    const insets = useSafeAreaInsets();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [sharing, setSharing] = useState(false);

    const fetchCourse = async () => {
        try {
            const { data } = await courseService.getById(courseId);
            setCourse(data.course);
            setMeetingLink(data.course?.meeting_link || '');
            setMeetingTime(data.course?.meeting_time || '');
            setMeetingDate(data.course?.meeting_date || '');
        } catch {
            Alert.alert('Error', 'Unable to load course');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const isOwner = useMemo(() => course?.provider_id && user?.id === course.provider_id, [course, user]);
    const canManage = isProvider && (isOwner || user?.role === 'admin');
    const isSubscribed = !!course?.is_subscribed;

    const openLink = (url) => {
        if (!url) return;
        Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open this link'));
    };

    const handleEnroll = async () => {
        setSubscribing(true);
        try {
            const { data } = await courseService.enroll(courseId);
            setCourse(data.course);
            Alert.alert('Subscribed', 'You are now enrolled in this course');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Unable to subscribe');
        } finally {
            setSubscribing(false);
        }
    };

    const handleShareMeeting = async () => {
        setSharing(true);
        try {
            const { data } = await courseService.shareMeeting(courseId, {
                meeting_link: meetingLink.trim() || null,
                meeting_time: meetingTime.trim() || null,
                meeting_date: meetingDate.trim() || null,
            });
            setCourse(data.course);
            Alert.alert('Success', `Notified ${data.notifiedCount || 0} subscribers`);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to share meeting');
        } finally {
            setSharing(false);
        }
    };

    if (loading) {
        return (
            <View style={ [styles.container, styles.center] }>
                <ActivityIndicator size="large" color={ Colors.primary } />
            </View>
        );
    }

    if (!course) {
        return (
            <View style={ [styles.container, styles.center] }>
                <Ionicons name="school-outline" size={ 60 } color={ Colors.textMuted } />
                <Text style={ styles.errorText }>Course not found</Text>
            </View>
        );
    }

    return (
        <View style={ styles.container }>
            <View style={ [styles.header, { paddingTop: insets.top + 8 }] }>
                <TouchableOpacity style={ styles.iconBtn } onPress={ () => navigation.goBack() }>
                    <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
                </TouchableOpacity>
                <Text style={ styles.headerTitle }>COURSE</Text>
                { canManage ? (
                    <TouchableOpacity style={ styles.iconBtn } onPress={ () => navigation.navigate('CourseForm', { courseId }) }>
                        <Ionicons name="create-outline" size={ 22 } color={ Colors.textPrimary } />
                    </TouchableOpacity>
                ) : (
                    <View style={ styles.iconBtn } />
                ) }
            </View>

            <ScrollView showsVerticalScrollIndicator={ false } contentContainerStyle={ styles.scrollContent }>
                <LinearGradient colors={ ['#0f172a', '#1e293b'] } style={ styles.heroCard }>
                    <Text style={ styles.heroKicker }>{ course.level || 'beginner' }</Text>
                    <Text style={ styles.heroTitle }>{ course.title }</Text>
                    <Text style={ styles.heroBody }>{ course.description }</Text>
                    <View style={ styles.heroMetaRow }>
                        <View style={ styles.heroMetaPill }>
                            <Ionicons name="person-outline" size={ 14 } color={ Colors.textWhite } />
                            <Text style={ styles.heroMetaText }>{ course.provider_name || 'Provider' }</Text>
                        </View>
                        <View style={ styles.heroMetaPill }>
                            <Ionicons name="people-outline" size={ 14 } color={ Colors.textWhite } />
                            <Text style={ styles.heroMetaText }>{ course.enrollment_count || 0 } learners</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={ [styles.sectionCard, Shadows.sm] }>
                    <Text style={ styles.sectionTitle }>Instructor Profile</Text>
                    <Text style={ styles.profileLine }>{ course.provider_designation || course.designation || 'Instructor' }</Text>
                    <Text style={ styles.profileLine }>
                        { course.provider_experience_years || course.experience_years || 0 } years experience
                    </Text>
                    <Text style={ styles.profileLine }>{ course.provider_expertise || course.expertise || 'General training' }</Text>
                    { course.provider_bio ? <Text style={ styles.profileBio }>{ course.provider_bio }</Text> : null }
                </View>

                <View style={ [styles.sectionCard, Shadows.sm] }>
                    <Text style={ styles.sectionTitle }>Course Details</Text>
                    <View style={ styles.detailGrid }>
                        <DetailChip icon="cash-outline" label={ `₹${Number(course.price || 0).toLocaleString('en-IN')}` } />
                        <DetailChip icon="time-outline" label={ course.duration || 'Flexible duration' } />
                        <DetailChip icon="school-outline" label={ course.category_name || 'General' } />
                        <DetailChip icon="shield-checkmark-outline" label={ course.active ? 'Active' : 'Hidden' } />
                    </View>
                </View>

                { course.materials?.length > 0 && (
                    <View style={ [styles.sectionCard, Shadows.sm] }>
                        <Text style={ styles.sectionTitle }>Materials</Text>
                        { course.materials.map((item) => (
                            <TouchableOpacity
                                key={ item.url }
                                style={ styles.materialRow }
                                onPress={ () => openLink(`${API_BASE_URL}${item.url}`) }
                            >
                                <View style={ styles.materialIcon }>
                                    <Ionicons name={ item.kind === 'video' ? 'play' : 'document-text' } size={ 18 } color={ Colors.primary } />
                                </View>
                                <View style={ styles.materialTextWrap }>
                                    <Text style={ styles.materialTitle } numberOfLines={ 1 }>{ item.name }</Text>
                                    <Text style={ styles.materialSub }>{ item.kind === 'video' ? 'Video file' : 'Download attachment' }</Text>
                                </View>
                                <Ionicons name="download-outline" size={ 18 } color={ Colors.textMuted } />
                            </TouchableOpacity>
                        )) }
                    </View>
                ) }

                { course.meeting_link ? (
                    <View style={ [styles.sectionCard, Shadows.sm] }>
                        <Text style={ styles.sectionTitle }>Live Session</Text>
                        { (course.meeting_time || course.meeting_date) && (
                            <Text style={ styles.meetingWhen }>{ [course.meeting_time, course.meeting_date].filter(Boolean).join(' • ') }</Text>
                        ) }
                        <Text style={ styles.meetingLink } numberOfLines={ 2 }>{ course.meeting_link }</Text>
                        <TouchableOpacity style={ styles.secondaryBtn } onPress={ () => openLink(course.meeting_link) }>
                            <Text style={ styles.secondaryBtnText }>Join live session</Text>
                        </TouchableOpacity>
                    </View>
                ) : null }

                { canManage && (
                    <View style={ [styles.sectionCard, Shadows.sm] }>
                        <Text style={ styles.sectionTitle }>Notify subscribers</Text>
                        <Text style={ styles.sectionSub }>
                            Generate or update the live meeting link and notify every enrolled learner.
                        </Text>
                        <TextInput
                            style={ styles.input }
                            placeholder="Meeting link (leave blank to auto-generate)"
                            placeholderTextColor={ Colors.textMuted }
                            value={ meetingLink }
                            onChangeText={ setMeetingLink }
                            autoCapitalize="none"
                        />
                        <View style={ styles.inputRow }>
                            <TextInput
                                style={ [styles.input, styles.flexInput] }
                                placeholder="Time"
                                placeholderTextColor={ Colors.textMuted }
                                value={ meetingTime }
                                onChangeText={ setMeetingTime }
                            />
                            <TextInput
                                style={ [styles.input, styles.flexInput] }
                                placeholder="Date"
                                placeholderTextColor={ Colors.textMuted }
                                value={ meetingDate }
                                onChangeText={ setMeetingDate }
                            />
                        </View>
                        <TouchableOpacity style={ styles.primaryBtn } onPress={ handleShareMeeting } disabled={ sharing }>
                            <LinearGradient colors={ [Colors.primaryDark, '#1e293b'] } style={ styles.primaryBtnGradient }>
                                <Text style={ styles.primaryBtnText }>{ sharing ? 'Notifying...' : 'Share & Notify' }</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) }

                { !canManage && !isSubscribed && (
                    <TouchableOpacity style={ styles.primaryBtn } onPress={ handleEnroll } disabled={ subscribing }>
                        <LinearGradient colors={ [Colors.primary, Colors.primaryLight] } style={ styles.primaryBtnGradient }>
                            <Text style={ styles.primaryBtnText }>{ subscribing ? 'Subscribing...' : 'Subscribe to Course' }</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) }

                { !canManage && isSubscribed && (
                    <View style={ styles.subscribedBanner }>
                        <Ionicons name="checkmark-circle" size={ 18 } color={ Colors.success } />
                        <Text style={ styles.subscribedText }>You are subscribed to this course</Text>
                    </View>
                ) }
            </ScrollView>
        </View>
    );
};

const DetailChip = ({ icon, label }) => (
    <View style={ styles.detailChip }>
        <Ionicons name={ icon } size={ 16 } color={ Colors.primary } />
        <Text style={ styles.detailChipText }>{ label }</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    center: { alignItems: 'center', justifyContent: 'center' },
    errorText: { marginTop: 12, color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 12,
        backgroundColor: Colors.backgroundPaper,
        ...Shadows.sm,
    },
    iconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5, color: Colors.textPrimary },
    scrollContent: { padding: Spacing.xl, paddingBottom: 120 },
    heroCard: {
        borderRadius: 24,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    heroKicker: {
        color: '#fbbf24',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.6,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    heroTitle: { fontSize: 26, fontWeight: '900', color: Colors.textWhite, marginBottom: 10 },
    heroBody: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.84)' },
    heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: Spacing.lg },
    heroMetaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    heroMetaText: { color: Colors.textWhite, fontSize: 12, fontWeight: '700' },
    sectionCard: {
        backgroundColor: Colors.backgroundPaper,
        borderRadius: 20,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
    profileLine: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
    profileBio: { marginTop: 8, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f8fafc',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    detailChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    materialIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialTextWrap: { flex: 1 },
    materialTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    materialSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    meetingWhen: { fontSize: 13, color: Colors.accentOrange, fontWeight: '700', marginBottom: 8 },
    meetingLink: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14 },
    primaryBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
    primaryBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: Colors.textWhite, fontWeight: '800', letterSpacing: 0.7 },
    secondaryBtn: {
        backgroundColor: '#eff6ff',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: { color: Colors.primary, fontWeight: '800' },
    subscribedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ecfdf5',
        borderRadius: 16,
        padding: Spacing.md,
    },
    subscribedText: { color: Colors.success, fontWeight: '700' },
    sectionSub: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.backgroundInput,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: Colors.textPrimary,
        marginBottom: 10,
    },
    inputRow: { flexDirection: 'row', gap: 10 },
    flexInput: { flex: 1 },
});

export default CourseDetailScreen;
