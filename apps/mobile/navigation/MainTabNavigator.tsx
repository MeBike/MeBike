import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@providers/auth-providers";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import type { RootStackParamList } from "../types/navigation";

import BookingHistoryScreen from "../screen/booking-history";
import HomeScreen from "../screen/Home";
import MyWalletScreen from "../screen/my-wallet-screen";
import ProfileScreen from "../screen/ProfileScreen";
import SOSAgentDashboardScreen from "../screen/SOSAgentDashboardScreen";
import StaffDashboardScreen from "../screen/StaffDashboardScreen";
import StationSelectScreen from "../screen/station-select";

const Tab = createBottomTabNavigator<RootStackParamList>();

function MainTabNavigator() {
  const { isAuthenticated, isStaff, isSOS } = useAuth();

  return (
    <Tab.Navigator>
      {isSOS
        ? (
            <>
              <Tab.Screen
                name="SOS Dashboard"
                component={SOSAgentDashboardScreen}
                options={{
                  headerShown: false,
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons
                      name="alert-circle-outline"
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
          )
        : isStaff
          ? (
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
            )
          : (
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
