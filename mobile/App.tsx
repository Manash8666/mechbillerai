import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './src/screens/DashboardScreen';
import IntakeScreen from './src/screens/IntakeScreen';
import JobCardsScreen from './src/screens/JobCardsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

function TabBarIcon({ routeName, color, size }: { readonly routeName: string; readonly color: string; readonly size: number }) {
  let iconName: any = 'home';

  if (routeName === 'Dashboard') {
    iconName = 'view-dashboard-outline';
  } else if (routeName === 'Intake') {
    iconName = 'shield-camera-outline';
  } else if (routeName === 'Job Cards') {
    iconName = 'car-wrench';
  } else if (routeName === 'Checkout') {
    iconName = 'cash-fast';
  } else if (routeName === 'Settings') {
    iconName = 'cog-outline';
  }

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: COLORS.surface,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon routeName={route.name} color={color} size={size} />
            ),
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Intake" component={IntakeScreen} options={{ title: 'Express Intake' }} />
          <Tab.Screen name="Job Cards" component={JobCardsScreen} />
          <Tab.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Evening Triage' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
