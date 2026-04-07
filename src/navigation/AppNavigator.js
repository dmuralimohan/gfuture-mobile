import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import ScreenLoader from '../components/ScreenLoader';

// Screens
import LandingScreen from '../screens/Landing/LandingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ProductDetailScreen from '../screens/ProductDetail/ProductDetailScreen';
import ServicesScreen from '../screens/Services/ServicesScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetail/OrderDetailScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import OffersScreen from '../screens/Offers/OffersScreen';
import PlansScreen from '../screens/Plans/PlansScreen';
import GRiderIntroScreen from '../screens/GRider/GRiderIntroScreen';
import GRiderHomeScreen from '../screens/GRider/GRiderHomeScreen';
import GRiderSearchingScreen from '../screens/GRider/GRiderSearchingScreen';
import GRiderTrackingScreen from '../screens/GRider/GRiderTrackingScreen';
import GRiderConfirmPickupScreen from '../screens/GRider/GRiderConfirmPickupScreen';
import GRiderTripDetailsScreen from '../screens/GRider/GRiderTripDetailsScreen';
import GRiderHistoryScreen from '../screens/GRider/GRiderHistoryScreen';
import DriverRegisterScreen from '../screens/GRiderDriver/DriverRegisterScreen';
import DriverDashboardScreen from '../screens/GRiderDriver/DriverDashboardScreen';
import DriverActiveRideScreen from '../screens/GRiderDriver/DriverActiveRideScreen';
import DriverHistoryScreen from '../screens/GRiderDriver/DriverHistoryScreen';

// Separate navigator instances to prevent state leaking between auth/main
const AuthStackNav = createNativeStackNavigator();
const MainStackNav = createNativeStackNavigator();

// Auth stack for unauthenticated users
const AuthStack = () => (
  <AuthStackNav.Navigator
    screenOptions={ {
      headerShown: false,
      animation: 'slide_from_right',
    } }
  >
    <AuthStackNav.Screen name="Landing" component={ LandingScreen } />
    <AuthStackNav.Screen name="Login" component={ LoginScreen } />
    <AuthStackNav.Screen name="Signup" component={ SignupScreen } />
    <AuthStackNav.Screen name="ForgotPassword" component={ ForgotPasswordScreen } />
  </AuthStackNav.Navigator>
);

// Main stack for authenticated users
const MainStack = () => (
  <MainStackNav.Navigator
    screenOptions={ {
      headerShown: false,
      animation: 'slide_from_right',
    } }
  >
    <MainStackNav.Screen name="MainTabs" component={ BottomTabNavigator } />
    <MainStackNav.Screen name="ProductDetail" component={ ProductDetailScreen } />
    <MainStackNav.Screen name="Services" component={ ServicesScreen } />
    <MainStackNav.Screen name="Checkout" component={ CheckoutScreen } />
    <MainStackNav.Screen name="Orders" component={ OrdersScreen } />
    <MainStackNav.Screen name="OrderDetail" component={ OrderDetailScreen } />
    <MainStackNav.Screen name="Wallet" component={ WalletScreen } />
    <MainStackNav.Screen name="Offers" component={ OffersScreen } />
    <MainStackNav.Screen name="Plans" component={ PlansScreen } />
    <MainStackNav.Screen name="GRiderIntro" component={ GRiderIntroScreen } />
    <MainStackNav.Screen name="GRiderHome" component={ GRiderHomeScreen } />
    <MainStackNav.Screen name="GRiderSearching" component={ GRiderSearchingScreen } />
    <MainStackNav.Screen name="GRiderTracking" component={ GRiderTrackingScreen } />
    <MainStackNav.Screen name="GRiderConfirmPickup" component={ GRiderConfirmPickupScreen } />
    <MainStackNav.Screen name="GRiderTripDetails" component={ GRiderTripDetailsScreen } />
    <MainStackNav.Screen name="GRiderHistory" component={ GRiderHistoryScreen } />
    <MainStackNav.Screen name="DriverRegister" component={ DriverRegisterScreen } />
    <MainStackNav.Screen name="DriverDashboard" component={ DriverDashboardScreen } />
    <MainStackNav.Screen name="DriverActiveRide" component={ DriverActiveRideScreen } />
    <MainStackNav.Screen name="DriverHistory" component={ DriverHistoryScreen } />
  </MainStackNav.Navigator>
);

// ⚠️ Set to true to skip login for testing
const SKIP_AUTH_FOR_TESTING = false;

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading && !SKIP_AUTH_FOR_TESTING) {
    return <ScreenLoader />;
  }

  const showMain = SKIP_AUTH_FOR_TESTING || isAuthenticated;

  return (
    <NavigationContainer key={ showMain ? 'app' : 'auth' }>
      { showMain ? <MainStack /> : <AuthStack /> }
    </NavigationContainer>
  );
};

export default AppNavigator;
