import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e', icon: 'time-outline' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', icon: 'checkmark-circle-outline' },
  'in-progress': { bg: '#e0e7ff', text: '#3730a3', icon: 'reload-outline' },
  completed: { bg: '#d1fae5', text: '#065f46', icon: 'checkmark-done-outline' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', icon: 'close-circle-outline' },
};

const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await orderService.getAll();
      setOrders(data.orders || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrder = ({ item }) => {
    const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const date = item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <TouchableOpacity
        style={[styles.orderCard, Shadows.sm]}
        onPress={() =>
          navigation.navigate('OrderDetail', { orderId: item.id })
        }
        activeOpacity={0.8}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>
              #{item.id?.substring(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bg },
            ]}
          >
            <Ionicons
              name={statusConfig.icon}
              size={14}
              color={statusConfig.text}
            />
            <Text style={[styles.statusText, { color: statusConfig.text }]}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
        </View>

        {item.items?.length > 0 && (
          <View style={styles.itemsList}>
            {item.items.slice(0, 3).map((orderItem, idx) => (
              <Text key={idx} style={styles.itemText}>
                • {orderItem.service_name} x{orderItem.quantity}
              </Text>
            ))}
            {item.items.length > 3 && (
              <Text style={styles.moreItems}>
                +{item.items.length - 3} more items
              </Text>
            )}
          </View>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ₹{item.total?.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Orders" />
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtext}>
                Your orders will appear here
              </Text>
            </View>
          }
        />
      )}
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
  orderCard: {
    backgroundColor: Colors.backgroundPaper,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsList: {
    marginBottom: Spacing.md,
  },
  itemText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  signInBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
  },
  signInText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OrdersScreen;
