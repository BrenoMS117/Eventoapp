import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/context/AppContext';

// Auth screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// User screens
import ExploreScreen from './src/screens/ExploreScreen';
import FeedScreen from './src/screens/FeedScreen';
import CouponsScreen from './src/screens/CouponsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CouponDetailScreen from './src/screens/CouponDetailScreen';

// Business screens
import BusinessPanelScreen from './src/screens/BusinessPanelScreen';
import AddCouponScreen from './src/screens/AddCouponScreen';
import NewEventScreen from './src/screens/NewEventScreen';

import { COLORS } from './src/utils/theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const CouponStack = createNativeStackNavigator();
const BusinessStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="EventDetail" component={EventDetailScreen} />
    </ExploreStack.Navigator>
  );
}

function CouponsNavigator() {
  return (
    <CouponStack.Navigator screenOptions={{ headerShown: false }}>
      <CouponStack.Screen name="CouponsMain" component={CouponsScreen} />
      <CouponStack.Screen name="CouponDetail" component={CouponDetailScreen} />
    </CouponStack.Navigator>
  );
}

function BusinessNavigator() {
  return (
    <BusinessStack.Navigator screenOptions={{ headerShown: false }}>
      <BusinessStack.Screen name="BusinessMain" component={BusinessPanelScreen} />
      <BusinessStack.Screen name="AddCoupon" component={AddCouponScreen} />
      <BusinessStack.Screen name="NewEvent" component={NewEventScreen} />
    </BusinessStack.Navigator>
  );
}

// Tab bar com safe area corrigida
function UserTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Explorar: focused ? 'map' : 'map-outline',
            Feed: focused ? 'radio' : 'radio-outline',
            Cupons: focused ? 'ticket' : 'ticket-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explorar" component={ExploreNavigator} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Cupons" component={CouponsNavigator} />
    </Tab.Navigator>
  );
}

function BusinessTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Explorar: focused ? 'map' : 'map-outline',
            Feed: focused ? 'radio' : 'radio-outline',
            Cupons: focused ? 'ticket' : 'ticket-outline',
            Painel: focused ? 'business' : 'business-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explorar" component={ExploreNavigator} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Cupons" component={CouponsNavigator} />
      <Tab.Screen name="Painel" component={BusinessNavigator} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { currentUser } = useApp();

  if (!currentUser) return <AuthNavigator />;
  if (currentUser.role === 'business') return <BusinessTabs />;
  return <UserTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}