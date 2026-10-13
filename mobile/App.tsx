import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './src/screens/DashboardScreen';
import IntakeScreen from './src/screens/IntakeScreen';
import JobCardsScreen from './src/screens/JobCardsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

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
            tabBarIcon: ({ color, size }) => {
              let iconName: any = 'home';

              if (route.name === 'Dashboard') {
                iconName = 'view-dashboard-outline';
              } else if (route.name === 'Intake') {
                iconName = 'shield-camera-outline';
              } else if (route.name === 'Job Cards') {
                iconName = 'car-wrench';
              } else if (route.name === 'Checkout') {
                iconName = 'cash-fast';
              } else if (route.name === 'Settings') {
                iconName = 'cog-outline';
              }

              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
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
