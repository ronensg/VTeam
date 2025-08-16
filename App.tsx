import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import TeamManagementScreen from './src/screens/TeamManagementScreen';
import CreateMatchScreen from './src/screens/CreateMatchScreen';
import GeneratedTeamsScreen from './src/screens/GeneratedTeamsScreen';

import { DatabaseProvider } from './src/services/DatabaseContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Create Match flow
const CreateMatchStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CreateMatchMain" component={CreateMatchScreen} />
    <Stack.Screen name="GeneratedTeams" component={GeneratedTeamsScreen} />
  </Stack.Navigator>
);

export default function App() {
  // Always use light theme for bright background with dark text
  const theme = MD3LightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <DatabaseProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.outline,
                },
              }}
            >
              <Tab.Screen 
                name="Home" 
                component={HomeScreen}
                options={{
                  tabBarLabel: 'Home',
                  tabBarIcon: ({ color, size }) => (
                    <TabIcon name="home" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen 
                name="Players" 
                component={PlayersScreen}
                options={{
                  tabBarLabel: 'Players',
                  tabBarIcon: ({ color, size }) => (
                    <TabIcon name="people" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen 
                name="Teams" 
                component={TeamManagementScreen}
                options={{
                  tabBarLabel: 'Teams',
                  tabBarIcon: ({ color, size }) => (
                    <TabIcon name="groups" color={color} size={size} />
                  ),
                }}
              />
              <Tab.Screen 
                name="Create Match" 
                component={CreateMatchStack}
                options={{
                  tabBarLabel: 'Match',
                  tabBarIcon: ({ color, size }) => (
                    <TabIcon name="sports-volleyball" color={color} size={size} />
                  ),
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </DatabaseProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// Simple tab icon component
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);
