import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS } from './src/utils/theme';
import { useNotifications } from './src/hooks/useNotifications';
import { NotificationBanner } from './src/components/NotificationBanner';

// Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// User screens
import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import FeedScreen from './src/screens/FeedScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CouponDetailScreen from './src/screens/CouponDetailScreen';

// Business screens
import BusinessPanelScreen from './src/screens/BusinessPanelScreen';
import AddCouponScreen from './src/screens/AddCouponScreen';
import NewEventScreen from './src/screens/NewEventScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
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
      <ExploreStack.Screen name="HomeMain" component={HomeScreen} />
      <ExploreStack.Screen name="Explore" component={ExploreScreen} />
      <ExploreStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ExploreStack.Screen name="CouponDetail" component={CouponDetailScreen} />
    </ExploreStack.Navigator>
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

function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const tabs = state.routes;
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: COLORS.bgCard,
      borderTopWidth: 0.5,
      borderTopColor: COLORS.border,
      paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      paddingTop: 8,
      paddingHorizontal: 8,
    }}>
      {tabs.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const icons = {
          Home: ['home', 'home-outline'],
          Community: ['people', 'people-outline'],
          Rewards: ['gift', 'gift-outline'],
          Painel: ['business', 'business-outline'],
        };
        const iconPair = icons[route.name] || ['ellipse', 'ellipse-outline'];
        const iconName = focused ? iconPair[0] : iconPair[1];
        const label = options.tabBarLabel || route.name;
        return (
          <View
            key={route.key}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Pressable
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 20,
              }}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? COLORS.primaryLight : COLORS.textMuted}
              />
              <Text style={{
                fontSize: 9,
                marginTop: 2,
                color: focused ? COLORS.primaryLight : COLORS.textMuted,
                fontWeight: focused ? '700' : '400',
              }}>{label}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function UserTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ExploreNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Community" component={FeedScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Rewards' }} />
    </Tab.Navigator>
  );
}

function BusinessTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ExploreNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Community" component={FeedScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Rewards' }} />
      <Tab.Screen name="Painel" component={BusinessNavigator} options={{ tabBarLabel: 'Painel' }} />
    </Tab.Navigator>
  );
}

// Headless component — drives notification evaluations while mounted.
function NotificationEngine() {
  useNotifications();
  return null;
}

function AppNavigator() {
  const { currentUser } = useApp();
  return (
    <>
      {currentUser && <NotificationEngine />}
      {!currentUser
        ? <AuthNavigator />
        : currentUser.role === 'business'
        ? <BusinessTabs />
        : <UserTabs />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COLORS.bg} />
          <AppNavigator />
        </NavigationContainer>
        {/* Banner floats above NavigationContainer on every screen */}
        <NotificationBanner />
      </AppProvider>
    </SafeAreaProvider>
  );
}
