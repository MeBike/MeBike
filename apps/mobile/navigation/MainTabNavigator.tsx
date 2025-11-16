import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import BookingHistoryScreen from "../screen/booking-history";
import HomeScreen from "../screen/Home";
import MyWalletScreen from "../screen/my-wallet-screen";
import ProfileScreen from "../screen/ProfileScreen";
import StaffDashboardScreen from "../screen/StaffDashboardScreen";
import StationSelectScreen from "../styles/StationSelect";
import { useAuth } from "@providers/auth-providers";
import { RootStackParamList } from "../types/navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

function MainTabNavigator() {
  const { isAuthenticated, isStaff } = useAuth();

  return (
    <Tab.Navigator>
      {isStaff ? (
        <>
          <Tab.Screen
            name="Công cụ"
            component={StaffDashboardScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="build-outline"
                  size={size ?? 24}
                  color={color ?? "#222"}
                />
              ),
            }}
          />
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
        </>
      ) : (
        <>
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
              name="Ví"
              component={MyWalletScreen}
              options={{
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                  <Ionicons
                    name="wallet-outline"
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
        </>
      )}
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
