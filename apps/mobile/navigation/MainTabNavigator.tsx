
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import BookingHistoryScreen from "../screen/BookingHistoryScreen";
import HomeScreen from "../screen/Home";
import ProfileScreen from "../screen/ProfileScreen";
import StationSelectScreen from "../styles/StationSelect";
import { useAuth } from "@providers/auth-providers";
import { RootStackParamList } from "../types/navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

function MainTabNavigator() {
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
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
