import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { AuthProvider, useAuth } from "@providers/auth-providers";
import Providers from "@providers/providers";

import { LoadingScreen } from "./components/LoadingScreen";

import type { RootStackParamList } from "./types/navigation";

import BookingHistoryDetail from "./screen/BookingHistoryDetail";
import BookingHistoryScreen from "./screen/BookingHistoryScreen";
import ChangePasswordScreen from "./screen/ChangePasswordScreen";
import ForgotPasswordScreen from "./screen/ForgotPassword";
import HomeScreen from "./screen/Home";
import IntroScreen from "./screen/Intro";
import LoginScreen from "./screen/Login";
import MyWalletScreen from "./screen/MyWalletScreen";
import ProfileScreen from "./screen/ProfileScreen";
import RegisterScreen from "./screen/Register";
import ReservationDetailScreen from "./screen/ReservationDetailScreen";
import ReservationScreen from "./screen/ReservationScreen";
import StationDetailScreen from "./screen/StationDetail";
import UpdateProfileScreen from "./screen/UpdateProfileScreen";
import StationSelectScreen from "./styles/StationSelect";
import SupportScreen from "./screen/SupportScreen";
import ReportScreen from "./screen/ReportScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();
function BottomTab() {
  const { isAuthenticated } = useAuth();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Nhà"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size ?? 24}
              color={color ?? "#222"}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Trạm"
        component={StationSelectScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="map-outline"
              size={size ?? 24}
              color={color ?? "#222"}
            />
          ),
        }}
      />
      {isAuthenticated && (
        <Tab.Screen
          name="Booking"
          component={BookingHistoryScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="calendar-outline"
                size={size ?? 24}
                color={color ?? "#222"}
              />
            ),
          }}
        />
      )}
      {isAuthenticated && (
        <Tab.Screen
          name="Tôi"
          component={ProfileScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="person-outline"
                size={size ?? 24}
                color={color ?? "#222"}
              />
            ),
          }}
        />
      )}
      {/* <Tab.Screen
        name="Xe"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bicycle"
              size={size ?? 24}
              color={color ?? "#222"}
            />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Providers>
      <NavigationContainer>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack.Navigator initialRouteName="Main">
            <Stack.Screen
              name="Main"
              component={BottomTab}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Intro"
              component={IntroScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="StationDetail"
              component={StationDetailScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Trạm"
              component={StationSelectScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="BookingHistoryDetail"
              component={BookingHistoryDetail}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="UpdateProfile"
              component={UpdateProfileScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="MyWallet"
              component={MyWalletScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Reservations"
              component={ReservationScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="ReservationDetail"
              component={ReservationDetailScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Support"
              component={SupportScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </Stack.Navigator>
        </AuthProvider>
      </NavigationContainer>
    </Providers>
  );
}
