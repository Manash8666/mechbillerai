import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './src/screens/DashboardScreen';
import IntakeScreen from './src/screens/IntakeScreen';
import JobCardsScreen from './src/screens/JobCardsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import BrandingScreen from './src/screens/BrandingScreen';

import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabBarIcon({ routeName, color, size }: { readonly routeName: string; readonly color: string; readonly size: number }) {
  let iconName: any = 'home';

  if (routeName === 'Dashboard') {
    iconName = 'view-dashboard-outline';
  } else if (routeName === 'Job Cards') {
    iconName = 'car-wrench';
  } else if (routeName === 'Invoices') {
    iconName = 'receipt';
  } else if (routeName === 'Inventory') {
    iconName = 'package-variant-closed';
  } else if (routeName === 'Settings') {
    iconName = 'cog-outline';
  }

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.surface,
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
      <Tab.Screen name="Job Cards" component={JobCardsScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Billing' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Parts Stock' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.surface,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Intake"
            component={IntakeScreen}
            options={{ title: 'Express Intake' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Evening Rush Triage' }}
          />
          <Stack.Screen
            name="Customers"
            component={CustomersScreen}
            options={{ title: 'Customer Directory' }}
          />
          <Stack.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ title: 'Service Appointments' }}
          />
          <Stack.Screen
            name="Branding"
            component={BrandingScreen}
            options={{ title: 'Workshop Branding' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
