import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Order Confirmed',
    body: 'Your order #A1B2C3 has been confirmed and is being processed.',
    time: '2 min ago',
    icon: 'checkmark-circle',
    color: Colors.success,
    read: false,
  },
  {
    id: '2',
    title: 'Special Offer!',
    body: '20% off on all home cleaning services this weekend.',
    time: '1 hour ago',
    icon: 'pricetag',
    color: Colors.accentOrange,
    read: false,
  },
  {
    id: '3',
    title: 'Welcome to GFuture',
    body: 'Start exploring products and services in your area.',
    time: '1 day ago',
    icon: 'gift',
    color: Colors.primary,
    read: true,
  },
  {
    id: '4',
    title: 'Referral Bonus',
    body: 'You earned ₹50 from your referral. Keep sharing!',
    time: '2 days ago',
    icon: 'people',
    color: Colors.accentCyan,
    read: true,
  },
];

const NotificationsScreen = ({ navigation }) => {
  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notifCard,
        Shadows.sm,
        !item.read && styles.notifUnread,
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" />
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
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
});

export default NotificationsScreen;
