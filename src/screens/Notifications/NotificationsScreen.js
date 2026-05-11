import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { notificationService } from '../../services';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationService.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const handlePress = async (item) => {
    if (!item.read_at) {
      try {
        await notificationService.markRead(item.id);
        setNotifications((prev) => prev.map((row) => (row.id === item.id ? { ...row, read_at: row.read_at || new Date().toISOString() } : row)));
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      } catch { /* ignore */ }
    }

    if (item.payload?.courseId) {
      navigation.navigate('CourseDetail', { courseId: item.payload.courseId });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={ [
        styles.notifCard,
        Shadows.sm,
        !item.read_at && styles.notifUnread,
      ] }
      activeOpacity={ 0.8 }
      onPress={ () => handlePress(item) }
    >
      <View style={ [styles.iconCircle, { backgroundColor: item.type?.includes('course') ? '#eff6ff' : `${Colors.primary}15` }] }>
        <Ionicons
          name={ item.type?.includes('course') ? 'school' : item.type?.includes('offer') ? 'pricetag' : 'notifications' }
          size={ 22 }
          color={ item.type?.includes('course') ? Colors.primary : Colors.accentOrange }
        />
      </View>
      <View style={ styles.notifContent }>
        <View style={ styles.notifHeader }>
          <Text style={ styles.notifTitle }>{ item.title }</Text>
          { !item.read_at && <View style={ styles.unreadDot } /> }
        </View>
        <Text style={ styles.notifBody } numberOfLines={ 2 }>{ item.body }</Text>
        <Text style={ styles.notifTime }>{ item.created_at ? new Date(item.created_at).toLocaleString() : '' }</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={ styles.container }>
      <ScreenHeader title={ `Notifications${unreadCount ? ` (${unreadCount})` : ''}` } />
      <FlatList
        data={ notifications }
        keyExtractor={ (item) => item.id }
        renderItem={ renderNotification }
        contentContainerStyle={ styles.listContent }
        refreshControl={ <RefreshControl refreshing={ refreshing } onRefresh={ onRefresh } /> }
        ListEmptyComponent={
          <View style={ styles.emptyContainer }>
            <Ionicons name="notifications-off-outline" size={ 64 } color={ Colors.textMuted } />
            <Text style={ styles.emptyTitle }>No notifications</Text>
            <Text style={ styles.emptySub }>Course updates and alerts will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDefault,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
