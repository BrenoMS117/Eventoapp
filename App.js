import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS } from './src/utils/theme';

// Auth
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// User screens
import ExploreScreen from './src/screens/ExploreScreen';
import FeedScreen from './src/screens/FeedScreen';
import HeatmapScreen from './src/screens/HeatmapScreen';
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
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
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
          Heatmap: ['map', 'map-outline'],
          Rewards: ['gift', 'gift-outline'],
          Painel: ['business', 'business-outline'],
        };
        const iconPair = icons[route.name] || ['ellipse', 'ellipse-outline'];
        const iconName = focused ? iconPair[0] : iconPair[1];
        const label = options.tabBarLabel || route.name;
        const isHeatmap = route.name === 'Heatmap';
        return (
          <View
            key={route.key}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              onTouchEnd={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: isHeatmap && focused ? COLORS.primary + '22' : 'transparent',
              }}
            >
              <Ionicons
                name={iconName}
                size={isHeatmap ? 26 : 22}
                color={focused
                  ? (isHeatmap ? COLORS.primary : COLORS.primaryLight)
                  : COLORS.textMuted}
              />
              <Text style={{
                fontSize: 9,
                marginTop: 2,
                color: focused ? (isHeatmap ? COLORS.primary : COLORS.primaryLight) : COLORS.textMuted,
                fontWeight: focused ? '700' : '400',
              }}>{label}</Text>
            </View>
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
      <Tab.Screen name="Heatmap" component={HeatmapScreen} options={{ tabBarLabel: 'Heatmap' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Rewards' }} />
    </Tab.Navigator>
  );
}

function BusinessTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ExploreNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Community" component={FeedScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="Heatmap" component={HeatmapScreen} options={{ tabBarLabel: 'Heatmap' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Rewards' }} />
      <Tab.Screen name="Painel" component={BusinessNavigator} options={{ tabBarLabel: 'Painel' }} />
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
          <StatusBar style="light" backgroundColor={COLORS.bg} />
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
