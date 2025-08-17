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
      console.log('Setting up comprehensive font loading logging for web...');
      
      // Create a comprehensive logging system
      const fontLog: Array<{
        timestamp: string;
        type: string;
        message: string;
        url?: string;
        error?: string;
        stack?: string;
      }> = [];

      const logFontEvent = (type: string, message: string, url?: string, error?: string) => {
        const logEntry = {
          timestamp: new Date().toISOString(),
          type,
          message,
          url,
          error: error || undefined,
          stack: error ? new Error().stack : undefined
        };
        fontLog.push(logEntry);
        console.log(`[FONT-LOG] ${type}: ${message}`, url || '', error || '');
        
        // Save log to localStorage every 10 entries
        if (fontLog.length % 10 === 0) {
          try {
            localStorage.setItem('fontLoadingLog', JSON.stringify(fontLog));
            console.log(`[FONT-LOG] Saved ${fontLog.length} log entries to localStorage`);
          } catch (e) {
            console.log('[FONT-LOG] Failed to save to localStorage:', e);
          }
        }
      };

      // NEW APPROACH: Create a global icon mapping that doesn't depend on font loading
      logFontEvent('ICON_MAPPING', 'Creating global icon mapping for MaterialIcons');
      
      // Create a global icon mapping object
      (window as any).__MATERIAL_ICONS__ = {
        // Common icons used in the app
        'home': '🏠',
        'people': '👥',
        'groups': '🏆',
        'sports-volleyball': '🏐',
        'add': '➕',
        'edit': '✏️',
        'delete': '🗑️',
        'more-vert': '⋮',
        'upload': '📤',
        'download': '📥',
        'plus': '➕',
        'close': '❌',
        'check': '✅',
        'arrow-back': '⬅️',
        'arrow-forward': '➡️',
        'menu': '☰',
        'search': '🔍',
        'filter-list': '🔧',
        'sort': '📊',
        'refresh': '🔄',
        'settings': '⚙️',
        'help': '❓',
        'info': 'ℹ️',
        'warning': '⚠️',
        'error': '❌',
        'success': '✅'
      };

      // Override the MaterialIcons component to use our mapping
      const originalMaterialIcons = (window as any).MaterialIcons;
      if (originalMaterialIcons) {
        logFontEvent('ICON_OVERRIDE', 'Overriding MaterialIcons component with fallback icons');
        
        // Create a proxy that intercepts icon requests
        (window as any).MaterialIcons = new Proxy(originalMaterialIcons, {
          get(target, prop) {
            if (prop === 'render') {
              return function(this: any, props: any) {
                const iconName = props.name;
                const fallbackIcon = (window as any).__MATERIAL_ICONS__[iconName];
                
                if (fallbackIcon) {
                  logFontEvent('ICON_FALLBACK', `Using fallback icon for: ${iconName}`, undefined, `Fallback: ${fallbackIcon}`);
                  // Return a simple text element as fallback
                  return fallbackIcon;
                }
                
                // If no fallback, try the original
                return target.render.call(this, props);
              };
            }
            return target[prop];
          }
        });
      }

      // 1. Override the fetch function to redirect ALL font requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        let url = input as string;
        if (typeof url === 'string') {
          // Log all font-related requests
          if (url.includes('MaterialIcons') || url.includes('materialicons') || url.includes('.ttf') || url.includes('.woff')) {
            logFontEvent('FETCH_REQUEST', 'Font request detected', url);
            
            // Redirect any font requests to Google Fonts
            if (url.includes('MaterialIcons') || url.includes('materialicons') || 
                (url.includes('/assets/') && url.includes('.ttf'))) {
              const originalUrl = url;
              url = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
              logFontEvent('FETCH_REDIRECT', 'Redirecting font request to Google Fonts', originalUrl, `Redirected to: ${url}`);
            }
          }
        }
        
        // Log the actual fetch call
        logFontEvent('FETCH_CALL', 'Fetch called', url);
        
        return originalFetch.call(this, url, init).then(response => {
          if (response.ok) {
            logFontEvent('FETCH_SUCCESS', 'Fetch successful', url);
          } else {
            logFontEvent('FETCH_ERROR', `Fetch failed with status ${response.status}`, url, `Status: ${response.status}`);
          }
          return response;
        }).catch(error => {
          logFontEvent('FETCH_EXCEPTION', 'Fetch exception', url, error.message);
          throw error;
        });
      };

      // 2. Override XMLHttpRequest to log font requests
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
        let modifiedUrl: string | URL = url;
        if (typeof url === 'string') {
          if (url.includes('MaterialIcons') || url.includes('materialicons') || 
              (url.includes('/assets/') && url.includes('.ttf'))) {
            logFontEvent('XHR_REQUEST', 'XHR font request detected', url);
            
            modifiedUrl = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
            logFontEvent('XHR_REDIRECT', 'Redirecting XHR font request to Google Fonts', url, `Redirected to: ${modifiedUrl}`);
          }
        }
        // Ensure we pass the correct type to the original function
        if (typeof modifiedUrl === 'string') {
          return originalXHROpen.call(this, method, modifiedUrl, ...args);
        } else {
          return originalXHROpen.call(this, method, modifiedUrl.toString(), ...args);
        }
      };

      // 3. Override Expo font loader if it exists
      if ((window as any).__EXPO_FONT_LOADER__) {
        logFontEvent('EXPO_LOADER', 'Expo font loader found, patching...');
        const originalLoader = (window as any).__EXPO_FONT_LOADER__;
        (window as any).__EXPO_FONT_LOADER__ = new Proxy(originalLoader, {
          get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
              return function(this: any, ...args: any[]) {
                logFontEvent('EXPO_LOADER_CALL', `Expo font loader called with prop: ${String(prop)}`, undefined, `Args: ${JSON.stringify(args)}`);
                
                // Replace any font URLs with Google Fonts
                const patchedArgs = args.map(arg => {
                  if (typeof arg === 'string' && (arg.includes('MaterialIcons') || arg.includes('.ttf'))) {
                    const patched = 'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2';
                    logFontEvent('EXPO_LOADER_PATCH', 'Patching font loader argument', arg, `Patched to: ${patched}`);
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

      // 4. Monitor font loading events
      document.addEventListener('DOMContentLoaded', () => {
        logFontEvent('DOM_READY', 'DOM content loaded');
      });

      // 5. Monitor font loading errors globally
      window.addEventListener('error', (event) => {
        if (event.message.includes('font') || event.message.includes('MaterialIcons') || 
            event.filename?.includes('font') || event.filename?.includes('MaterialIcons')) {
          logFontEvent('GLOBAL_ERROR', 'Global font error detected', event.filename, event.message);
        }
      });

      // 6. Monitor unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && (event.reason.message?.includes('font') || event.reason.message?.includes('MaterialIcons'))) {
          logFontEvent('UNHANDLED_REJECTION', 'Unhandled font promise rejection', undefined, event.reason.message);
        }
      });

      // 7. Try to load Google Fonts
      logFontEvent('GOOGLE_FONTS', 'Attempting to load Google Fonts CSS');
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      link.onload = () => logFontEvent('GOOGLE_FONTS_SUCCESS', 'Google Fonts CSS loaded successfully');
      link.onerror = () => logFontEvent('GOOGLE_FONTS_ERROR', 'Google Fonts CSS failed to load');
      document.head.appendChild(link);

      // 8. Try to load the font directly
      logFontEvent('FONT_FACE', 'Attempting to load MaterialIcons font directly');
      const fontFace = new FontFace(
        'MaterialIcons',
        'url(https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2)'
      );
      
      fontFace.load().then(() => {
        (document.fonts as any).add(fontFace);
        logFontEvent('FONT_FACE_SUCCESS', 'MaterialIcons font loaded successfully from Google Fonts');
      }).catch((error) => {
        logFontEvent('FONT_FACE_ERROR', 'Google Fonts loading failed', undefined, error.message);
      });

      // 9. Create a function to download the log file
      (window as any).downloadFontLog = () => {
        const logText = JSON.stringify(fontLog, null, 2);
        const blob = new Blob([logText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `font-loading-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        logFontEvent('LOG_DOWNLOAD', 'Font log downloaded by user');
      };

      // 9b. Create a function to display logs in console
      (window as any).showFontLog = () => {
        console.log('=== FONT LOADING LOG ===');
        console.log(`Total log entries: ${fontLog.length}`);
        console.log('Latest 20 entries:');
        fontLog.slice(-20).forEach((entry, index) => {
          console.log(`[${index + 1}] ${entry.timestamp} - ${entry.type}: ${entry.message}`);
          if (entry.url) console.log(`    URL: ${entry.url}`);
          if (entry.error) console.log(`    Error: ${entry.error}`);
        });
        console.log('=== END LOG ===');
        logFontEvent('LOG_DISPLAY', 'Font log displayed in console');
      };

      // 9c. Create a function to get log summary
      (window as any).getFontLogSummary = () => {
        const summary = {
          totalEntries: fontLog.length,
          byType: {} as { [key: string]: number },
          latestEntries: fontLog.slice(-10),
          errors: fontLog.filter(entry => entry.error),
          fontRequests: fontLog.filter(entry => entry.type.includes('FETCH') || entry.type.includes('XHR'))
        };
        
        fontLog.forEach(entry => {
          summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
        });
        
        console.log('=== FONT LOG SUMMARY ===');
        console.log(JSON.stringify(summary, null, 2));
        console.log('=== END SUMMARY ===');
        
        return summary;
      };

      // 10. Log the setup completion
      logFontEvent('SETUP_COMPLETE', 'Comprehensive font loading logging setup complete with icon fallback mapping');
      
      console.log('[FONT-LOG] Setup complete. Available functions:');
      console.log('[FONT-LOG] - window.downloadFontLog() - Download log as JSON file');
      console.log('[FONT-LOG] - window.showFontLog() - Display latest 20 entries in console');
      console.log('[FONT-LOG] - window.getFontLogSummary() - Get log summary and statistics');
      console.log('[FONT-LOG] - Global icon mapping created with fallback icons');
      console.log('[FONT-LOG] Log entries will be saved to localStorage every 10 entries.');
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
