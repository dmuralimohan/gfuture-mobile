import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import { courseService, authService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

const emptyForm = {
    title: '',
    description: '',
    category_id: '',
    designation: '',
    experience_years: '',
    expertise: '',
    price: '',
    level: 'beginner',
    duration: '',
    meeting_link: '',
    meeting_time: '',
    meeting_date: '',
};

const CourseFormScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const courseId = route.params?.courseId;
    const isEdit = !!courseId;
    const canManage = user?.role === 'provider' || user?.role === 'admin';
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [video, setVideo] = useState(null);
    const [attachment, setAttachment] = useState(null);

    useEffect(() => {
        (async () => {
            if (!canManage) {
                setLoading(false);
                return;
            }

            let providerProfile = null;
            try {
                const profileRes = await authService.getProfile().catch(() => null);
                providerProfile = profileRes?.data?.providerProfile || null;
                if (providerProfile) {
                    setForm((prev) => ({
                        ...prev,
                        designation: providerProfile.designation || '',
                        experience_years: providerProfile.experience_years?.toString?.() || '',
                        expertise: providerProfile.expertise || '',
                    }));
                }
            } catch (e) {
                // ignore profile fetch issues and continue with course data
            }

            if (isEdit) {
                try {
                    const { data } = await courseService.getById(courseId);
                    const course = data.course;
                    setForm({
                        title: course.title || '',
                        description: course.description || '',
                        category_id: course.category_id?.toString?.() || '',
                        designation: course.designation || providerProfile?.designation || '',
                        experience_years: course.experience_years?.toString?.() || providerProfile?.experience_years?.toString?.() || '',
                        expertise: course.expertise || providerProfile?.expertise || '',
                        price: course.price?.toString?.() || '',
                        level: course.level || 'beginner',
                        duration: course.duration || '',
                        meeting_link: course.meeting_link || '',
                        meeting_time: course.meeting_time || '',
                        meeting_date: course.meeting_date || '',
                    });
                } catch {
                    Alert.alert('Error', 'Unable to load course data');
                }
            }

            setLoading(false);
        })();
    }, [canManage, courseId, isEdit]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const pickVideo = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'video/*',
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return;
        if (asset.size && asset.size > MAX_VIDEO_SIZE) {
            Alert.alert('File too large', 'Please choose a video smaller than 500 MB');
            return;
        }
        setVideo(asset);
    };

    const pickAttachment = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (asset) {
            setAttachment(asset);
        }
    };

    const toFilePayload = (asset) => ({
        uri: asset.uri,
        name: asset.name || `upload-${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
    });

    const buildFormData = () => {
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== '' && value != null) {
                data.append(key, String(value));
            }
        });
        if (video) data.append('video', toFilePayload(video));
        if (attachment) data.append('attachment', toFilePayload(attachment));
        return data;
    };

    const handleSave = async () => {
        if (!canManage) {
            Alert.alert('Access denied', 'Only providers can create or edit courses');
            return;
        }

        if (!form.title.trim() || !form.description.trim()) {
            Alert.alert('Missing fields', 'Title and description are required');
            return;
        }

        setSaving(true);
        try {
            const payload = buildFormData();
            const { data } = isEdit
                ? await courseService.update(courseId, payload)
                : await courseService.create(payload);
            const savedCourse = data.course;
            Alert.alert('Success', isEdit ? 'Course updated' : 'Course created');
            navigation.replace('CourseDetail', { courseId: savedCourse.id });
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Unable to save course');
        } finally {
            setSaving(false);
        }
    };

    const headerTitle = useMemo(() => (isEdit ? 'Edit Course' : 'Create Course'), [isEdit]);

    if (loading) {
        return (
            <View style={ [styles.container, styles.center] }>
                <Text style={ styles.loadingText }>Loading...</Text>
            </View>
        );
    }

    if (!canManage) {
        return (
            <View style={ [styles.container, styles.center] }>
                <Ionicons name="lock-closed-outline" size={ 56 } color={ Colors.textMuted } />
                <Text style={ styles.loadingText }>Only providers can manage courses</Text>
            </View>
        );
    }

    return (
        <ScrollView style={ styles.container } contentContainerStyle={ { paddingBottom: 120 } }>
            <View style={ [styles.header, { paddingTop: insets.top + 12 }] }>
                <TouchableOpacity style={ styles.backBtn } onPress={ () => navigation.goBack() }>
                    <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
                </TouchableOpacity>
                <View>
                    <Text style={ styles.kicker }>GCourse</Text>
                    <Text style={ styles.headerTitle }>{ headerTitle }</Text>
                </View>
            </View>

            <View style={ styles.formCard }>
                <InputField label="Course Title" value={ form.title } onChangeText={ (v) => update('title', v) } placeholder="Example: Android Masterclass" icon="book-outline" />
                <InputField label="Description" value={ form.description } onChangeText={ (v) => update('description', v) } placeholder="Tell learners what they will get" icon="document-text-outline" multiline inputStyle={ { minHeight: 120 } } />
                <InputField label="Designation" value={ form.designation } onChangeText={ (v) => update('designation', v) } placeholder="Senior Trainer" icon="briefcase-outline" />
                <InputField label="Experience (years)" value={ form.experience_years } onChangeText={ (v) => update('experience_years', v) } placeholder="8" icon="time-outline" keyboardType="number-pad" />
                <InputField label="Expertise" value={ form.expertise } onChangeText={ (v) => update('expertise', v) } placeholder="React Native, UI design" icon="sparkles-outline" />
                <InputField label="Category ID" value={ form.category_id } onChangeText={ (v) => update('category_id', v) } placeholder="1" icon="apps-outline" keyboardType="number-pad" />
                <InputField label="Price" value={ form.price } onChangeText={ (v) => update('price', v) } placeholder="2999" icon="cash-outline" keyboardType="decimal-pad" />
                <InputField label="Level" value={ form.level } onChangeText={ (v) => update('level', v) } placeholder="beginner / intermediate / advanced" icon="layers-outline" />
                <InputField label="Duration" value={ form.duration } onChangeText={ (v) => update('duration', v) } placeholder="12 weeks" icon="calendar-outline" />
                <InputField label="Meeting Link" value={ form.meeting_link } onChangeText={ (v) => update('meeting_link', v) } placeholder="Optional. Leave blank to auto-generate" icon="videocam-outline" autoCapitalize="none" />
                <View style={ styles.row }>
                    <InputField label="Meeting Time" value={ form.meeting_time } onChangeText={ (v) => update('meeting_time', v) } placeholder="11:00 AM" icon="time-outline" style={ styles.flex1 } />
                    <InputField label="Meeting Date" value={ form.meeting_date } onChangeText={ (v) => update('meeting_date', v) } placeholder="20 Mar 2026" icon="calendar-outline" style={ styles.flex1 } />
                </View>

                <View style={ styles.fileCard }>
                    <View style={ styles.fileRow }>
                        <View style={ styles.fileIcon }>
                            <Ionicons name="videocam" size={ 20 } color={ Colors.primary } />
                        </View>
                        <View style={ styles.fileInfo }>
                            <Text style={ styles.fileTitle }>Course Video</Text>
                            <Text style={ styles.fileSub } numberOfLines={ 1 }>
                                { video ? `${video.name}${video.size ? ` • ${(video.size / (1024 * 1024)).toFixed(1)} MB` : ''}` : 'Upload a video under 500 MB' }
                            </Text>
                        </View>
                        <TouchableOpacity style={ styles.fileBtn } onPress={ pickVideo }>
                            <Text style={ styles.fileBtnText }>{ video ? 'Change' : 'Pick' }</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={ styles.fileRow }>
                        <View style={ styles.fileIcon }>
                            <Ionicons name="document-text" size={ 20 } color={ Colors.accentOrange } />
                        </View>
                        <View style={ styles.fileInfo }>
                            <Text style={ styles.fileTitle }>Attachment</Text>
                            <Text style={ styles.fileSub } numberOfLines={ 1 }>{ attachment ? attachment.name : 'Add a PDF, notes, or worksheet' }</Text>
                        </View>
                        <TouchableOpacity style={ styles.fileBtn } onPress={ pickAttachment }>
                            <Text style={ styles.fileBtnText }>{ attachment ? 'Change' : 'Pick' }</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <GradientButton title={ isEdit ? 'UPDATE COURSE' : 'CREATE COURSE' } onPress={ handleSave } loading={ saving } size="large" style={ { marginTop: Spacing.md } } />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    center: { alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: Colors.textSecondary, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.backgroundPaper,
        ...Shadows.sm,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    kicker: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    formCard: {
        margin: Spacing.xl,
        backgroundColor: Colors.backgroundPaper,
        borderRadius: 24,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    row: { flexDirection: 'row', gap: 10 },
    flex1: { flex: 1 },
    fileCard: {
        marginTop: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    fileIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: { flex: 1 },
    fileTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
    fileSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    fileBtn: {
        backgroundColor: Colors.backgroundPaper,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    fileBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
});

export default CourseFormScreen;
