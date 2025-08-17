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
      console.log('Setting up font loading for web...');
      
      // AGGRESSIVE APPROACH: Override font loading at the module level
      
      // 1. Override the fetch function to redirect ALL font requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        let url = input as string;
        if (typeof url === 'string') {
          // Redirect any font requests to Google Fonts
          if (url.includes('MaterialIcons') || url.includes('materialicons')) {
            url = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
            console.log('Redirecting MaterialIcons font request to Google Fonts:', url);
          }
          // Also redirect any other font requests that might be failing
          else if (url.includes('/assets/') && url.includes('.ttf')) {
            url = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
            console.log('Redirecting TTF font request to Google Fonts:', url);
          }
        }
        return originalFetch.call(this, url, init);
      };

      // 2. Override XMLHttpRequest for older font loading methods
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
        let modifiedUrl: string | URL = url;
        if (typeof url === 'string') {
          if (url.includes('MaterialIcons') || url.includes('materialicons') || 
              (url.includes('/assets/') && url.includes('.ttf'))) {
            modifiedUrl = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
            console.log('Redirecting XHR font request to Google Fonts:', modifiedUrl);
          }
        }
        return originalXHROpen.call(this, method, modifiedUrl, ...args);
      };

      // 3. Override any global font loading functions
      if ((window as any).__EXPO_FONT_LOADER__) {
        console.log('Expo font loader found, patching...');
        const originalLoader = (window as any).__EXPO_FONT_LOADER__;
        (window as any).__EXPO_FONT_LOADER__ = new Proxy(originalLoader, {
          get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
              return function(this: any, ...args: any[]) {
                // Replace any font URLs with Google Fonts
                const patchedArgs = args.map(arg => {
                  if (typeof arg === 'string' && (arg.includes('MaterialIcons') || arg.includes('.ttf'))) {
                    const patched = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
                    console.log('Font loader patching argument from:', arg, 'to:', patched);
                    return patched;
                  }
                  return arg;
                });
                return value.apply(this, patchedArgs);
              };
            }
            return value;
          }
        });
      }

      // 4. Preload the Google Fonts Material Icons
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      console.log('Google Fonts CSS link added');
      
      // 5. Also try to load the font directly as a fallback
      const fontFace = new FontFace(
        'MaterialIcons',
        'url(https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2)'
      );
      
      fontFace.load().then(() => {
        (document.fonts as any).add(fontFace);
        console.log('MaterialIcons font loaded successfully from Google Fonts');
      }).catch((error) => {
        console.log('Google Fonts loading failed:', error);
      });
      
      console.log('Aggressive font loading setup complete');
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
