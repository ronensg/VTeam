import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

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

  // Load icon fonts on web
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Override the font loading paths to use correct /VTeam/ prefix
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        let url = input as string;
        if (typeof url === 'string' && url.includes('/assets/') && !url.includes('/VTeam/')) {
          url = url.replace('/assets/', '/VTeam/assets/');
          console.log('Redirecting font request from:', input, 'to:', url);
        }
        return originalFetch.call(this, url, init);
      };

      // Ensure MaterialIcons font is loaded on web
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Also try to load the local font files with correct paths
      const fontFace = new FontFace('MaterialIcons', `url(/VTeam/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf)`);
      fontFace.load().then(() => {
        (document.fonts as any).add(fontFace);
        console.log('Local MaterialIcons font loaded successfully');
      }).catch((error) => {
        console.log('Local font loading failed, using Google Fonts:', error);
      });
    }
  }, []);

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

// Tab icon component using MaterialIcons
const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  // Map icon names to MaterialIcons names
  const iconMap: { [key: string]: string } = {
    'home': 'home',
    'people': 'people',
    'groups': 'groups',
    'sports-volleyball': 'sports-volleyball'
  };
  
  const iconName = iconMap[name] || 'help';
  
  return <MaterialIcons name={iconName as any} size={size} color={color} />;
};
