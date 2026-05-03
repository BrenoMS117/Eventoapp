import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider } from './src/context/AppContext';

import ExploreScreen from './src/screens/ExploreScreen';
import FeedScreen from './src/screens/FeedScreen';
import CouponsScreen from './src/screens/CouponsScreen';
import BusinessPanelScreen from './src/screens/BusinessPanelScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CouponDetailScreen from './src/screens/CouponDetailScreen';
import AddCouponScreen from './src/screens/AddCouponScreen';

import { COLORS } from './src/utils/theme';

const Tab = createBottomTabNavigator();
const ExploreStack = createNativeStackNavigator();
const CouponStack = createNativeStackNavigator();
const BusinessStack = createNativeStackNavigator();

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
    </BusinessStack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: 0.5,
              paddingBottom: 8,
              paddingTop: 6,
              height: 62,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              marginTop: 0,
            },
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
      </NavigationContainer>
    </AppProvider>
  );
}
