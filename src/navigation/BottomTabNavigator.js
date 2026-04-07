import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur'; // fallback to View if not available
import HomeScreen from '../screens/Home/HomeScreen';
import GRiderHomeScreen from '../screens/GRider/GRiderHomeScreen';
import CartScreen from '../screens/Cart/CartScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { useCart } from '../context/CartContext';
import { Colors, Shadows } from '../theme';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { totalItems } = useCart();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={ ({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 65 + insets.bottom,
          backgroundColor: Colors.backgroundPaper,
          borderTopWidth: 0,
          ...Shadows.md,
          ...Platform.select({
            ios: {
              shadowColor: '#0a1628',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'GRiderTab') {
            return (
              <MaterialCommunityIcons
                name={ focused ? 'motorbike' : 'motorbike' }
                size={ focused ? 28 : 26 }
                color={ color }
              />
            );
          }
          const iconMap = {
            HomeTab: { active: 'home', inactive: 'home-outline' },
            CartTab: { active: 'bag-handle', inactive: 'bag-handle-outline' },
            NotificationsTab: { active: 'notifications', inactive: 'notifications-outline' },
            ProfileTab: { active: 'person', inactive: 'person-outline' },
          };
          const icons = iconMap[route.name];
          if (!icons) return null;
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <Ionicons
              name={ iconName }
              size={ focused ? 26 : 24 }
              color={ color }
            />
          );
        },
        tabBarBadge:
          route.name === 'CartTab' && totalItems > 0
            ? totalItems
            : undefined,
        tabBarBadgeStyle: {
          backgroundColor: Colors.primary,
          color: Colors.textWhite,
          fontSize: 11,
          fontWeight: '700',
          minWidth: 18,
          height: 18,
          lineHeight: 18,
          borderRadius: 9,
        },
      }) }
    >
      <Tab.Screen name="HomeTab" component={ HomeScreen } />
      <Tab.Screen name="GRiderTab" component={ GRiderHomeScreen } />
      <Tab.Screen name="CartTab" component={ CartScreen } />
      <Tab.Screen name="NotificationsTab" component={ NotificationsScreen } />
      <Tab.Screen name="ProfileTab" component={ ProfileScreen } />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
