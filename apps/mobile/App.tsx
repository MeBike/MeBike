import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from './types/navigation';
import { Ionicons } from '@expo/vector-icons';
// Import screens
import HomeScreen from './screen/Home';
import LoginScreen from './screen/Login';
import IntroScreen from './screen/Intro';
import RegisterScreen from './screen/Register';
import Booking from './screen/Booking';
import StationDetailScreen from './screen/StationDetail';
import StationSelectScreen from './styles/StationSelect';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();
const BottomTab = () => {
  return (
    <Tab.Navigator>
       <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ 
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size ?? 24} color={color ?? '#222'} />
              )
            }}
          />
           <Tab.Screen 
            name="QR" 
            component={HomeScreen} 
            options={{ 
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size ?? 24} color={color ?? '#222'} />
              )
            }}
          />
      <Tab.Screen 
        name="StationSelect" 
        component={StationSelectScreen} 
        options={{ headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size ?? 24} color={color ?? '#222'} />
          )
        }}
      />
      <Tab.Screen 
        name="Booking" 
        component={Booking} 
        options={{ headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size ?? 24} color={color ?? '#222'} />
          )
         }}
      />
    </Tab.Navigator>
  );
}
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen 
          name="Main" 
          component={BottomTab} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Intro" 
          component={IntroScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StationDetail" 
          component={StationDetailScreen} 
          options={{ headerShown: false }}
        />
        {/* Add more screens here as you create them */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
