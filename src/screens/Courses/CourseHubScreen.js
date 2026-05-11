import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const CourseHubScreen = ({ navigation }) => {
    const { user, isProvider } = useAuth();
    const [courses, setCourses] = useState([]);
    const [mine, setMine] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState(isProvider ? 'manage' : 'browse');

    const fetchData = async () => {
        try {
            const [allRes, mineRes] = await Promise.all([
                courseService.getAll({ limit: 100 }),
                courseService.getMine().catch(() => null),
            ]);
            setCourses(allRes.data?.courses || []);
            setMine(mineRes?.data?.courses || []);
        } catch {
            setCourses([]);
            setMine([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const visibleCourses = useMemo(() => {
        const list = tab === 'manage' ? mine : courses;
        const term = search.trim().toLowerCase();
        if (!term) return list;
        return list.filter((course) =>
            [course.title, course.description, course.provider_name, course.category_name, course.expertise]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        );
    }, [courses, mine, search, tab]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
    };

    const renderCourse = ({ item }) => (
        <TouchableOpacity
            style={ [styles.card, Shadows.sm] }
            activeOpacity={ 0.9 }
            onPress={ () => navigation.navigate('CourseDetail', { courseId: item.id }) }
        >
            <View style={ styles.cardTopRow }>
                <View style={ styles.levelChip }>
                    <Text style={ styles.levelText }>{ item.level || 'beginner' }</Text>
                </View>
                <Text style={ styles.price }>₹{ Number(item.price || 0).toLocaleString('en-IN') }</Text>
            </View>
            <Text style={ styles.title } numberOfLines={ 2 }>{ item.title }</Text>
            <Text style={ styles.subtitle } numberOfLines={ 2 }>{ item.description }</Text>
            <View style={ styles.metaRow }>
                <View style={ styles.metaPill }>
                    <Ionicons name="person-circle-outline" size={ 14 } color={ Colors.primary } />
                    <Text style={ styles.metaText } numberOfLines={ 1 }>{ item.provider_name || 'Provider' }</Text>
                </View>
                <View style={ styles.metaPill }>
                    <Ionicons name="people-outline" size={ 14 } color={ Colors.accentOrange } />
                    <Text style={ styles.metaText }>{ item.enrollment_count || 0 }</Text>
                </View>
            </View>
            <View style={ styles.bottomRow }>
                <Text style={ styles.smallText } numberOfLines={ 1 }>
                    { item.designation || item.provider_designation || item.expertise || 'Course' }
                </Text>
                { item.meeting_link ? (
                    <View style={ styles.liveBadge }>
                        <Ionicons name="radio-outline" size={ 12 } color={ Colors.textWhite } />
                        <Text style={ styles.liveBadgeText }>LIVE</Text>
                    </View>
                ) : null }
            </View>
            { isProvider && item.provider_id === user?.id && (
                <TouchableOpacity
                    style={ styles.editBtn }
                    onPress={ (e) => {
                        e?.stopPropagation?.();
                        navigation.navigate('CourseForm', { courseId: item.id });
                    } }
                >
                    <Ionicons name="create-outline" size={ 16 } color={ Colors.primary } />
                    <Text style={ styles.editText }>Edit</Text>
                </TouchableOpacity>
            ) }
        </TouchableOpacity>
    );

    return (
        <View style={ styles.container }>
            <LinearGradient colors={ ['#0f172a', '#1e293b'] } style={ styles.header }>
                <View style={ styles.headerRow }>
                    <View>
                        <Text style={ styles.kicker }>GCourse</Text>
                        <Text style={ styles.headerTitle }>{ isProvider ? 'Manage courses' : 'Learn from providers' }</Text>
                    </View>
                    { isProvider && (
                        <TouchableOpacity style={ styles.addIcon } onPress={ () => navigation.navigate('CourseForm') }>
                            <Ionicons name="add" size={ 24 } color={ Colors.textWhite } />
                        </TouchableOpacity>
                    ) }
                </View>
                <View style={ styles.searchBox }>
                    <Ionicons name="search" size={ 18 } color={ Colors.textMuted } />
                    <TextInput
                        value={ search }
                        onChangeText={ setSearch }
                        placeholder="Search courses, providers, expertise"
                        placeholderTextColor={ Colors.textMuted }
                        style={ styles.searchInput }
                    />
                </View>
            </LinearGradient>

            <View style={ styles.switchRow }>
                <TouchableOpacity style={ [styles.switchBtn, tab === 'browse' && styles.switchBtnActive] } onPress={ () => setTab('browse') }>
                    <Text style={ [styles.switchText, tab === 'browse' && styles.switchTextActive] }>Browse</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ [styles.switchBtn, tab === 'manage' && styles.switchBtnActive] } onPress={ () => setTab('manage') }>
                    <Text style={ [styles.switchText, tab === 'manage' && styles.switchTextActive] }>
                        { isProvider ? 'My Courses' : 'Subscribed' }
                    </Text>
                </TouchableOpacity>
            </View>

            { loading ? (
                <ActivityIndicator size="large" color={ Colors.primary } style={ { marginTop: 40 } } />
            ) : (
                <FlatList
                    data={ visibleCourses }
                    keyExtractor={ (item) => String(item.id) }
                    renderItem={ renderCourse }
                    numColumns={ 2 }
                    columnWrapperStyle={ styles.columnWrapper }
                    contentContainerStyle={ styles.listContent }
                    refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
                    ListEmptyComponent={
                        <View style={ styles.emptyState }>
                            <Ionicons name="school-outline" size={ 56 } color={ Colors.textMuted } />
                            <Text style={ styles.emptyTitle }>No courses yet</Text>
                            <Text style={ styles.emptySubtext }>
                                { isProvider ? 'Create your first course from the add button.' : 'New courses will appear here.' }
                            </Text>
                        </View>
                    }
                />
            ) }
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDefault },
    header: {
        paddingTop: 56,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    kicker: {
        color: '#fbbf24',
        fontSize: 11,
        letterSpacing: 1.8,
        fontWeight: '800',
        marginBottom: 4,
    },
    headerTitle: {
        color: Colors.textWhite,
        fontSize: 24,
        fontWeight: '800',
    },
    addIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        height: 50,
    },
    searchInput: {
        flex: 1,
        color: Colors.textWhite,
        marginLeft: 10,
        fontSize: 14,
    },
    switchRow: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        marginHorizontal: Spacing.xl,
        gap: 10,
    },
    switchBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.backgroundPaper,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    switchBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    switchText: {
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    switchTextActive: {
        color: Colors.textWhite,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: 120,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: 12,
    },
    card: {
        flex: 1,
        backgroundColor: Colors.backgroundPaper,
        borderRadius: 20,
        padding: Spacing.md,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelChip: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    levelText: {
        color: Colors.primaryDark,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    price: {
        color: Colors.primaryDark,
        fontWeight: '800',
        fontSize: 13,
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 17,
        minHeight: 34,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        maxWidth: '100%',
    },
    metaText: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    smallText: {
        flex: 1,
        fontSize: 11,
        color: Colors.textMuted,
        marginRight: 8,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.accentRed,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    liveBadgeText: {
        color: Colors.textWhite,
        fontSize: 10,
        fontWeight: '800',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
    },
    editText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 70,
        width: '100%',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});

export default CourseHubScreen;
