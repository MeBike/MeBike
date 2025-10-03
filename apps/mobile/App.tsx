import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from './types/navigation';

// Import screens
import HomeScreen from './screen/Home';
import LoginScreen from './screen/Login';
import IntroScreen from './screen/Intro';
import RegisterScreen from './screen/Register';
import StationDetailScreen from './screen/StationDetail';
import StationSelectScreen from './styles/StationSelect';
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
  <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ 
            title: 'Đăng nhập',
          }}
        />
        <Stack.Screen 
          name="Intro" 
          component={IntroScreen} 
          options={{ 
            title: 'Giới thiệu',
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ 
            title: 'Đăng ký',
          }}
        />
        <Stack.Screen 
          name="StationDetail" 
          component={StationDetailScreen} 
          options={{ 
            title: 'Chi tiết trạm',
          }}
        />
        <Stack.Screen 
          name="StationSelect" 
          component={StationSelectScreen} 
          options={{ 
            title: 'Chọn trạm xe',
          }}
        />
        {/* Add more screens here as you create them */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
