import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import { LoadingScreen } from "@components/LoadingScreen";
import { useAuthNext } from "@providers/auth-provider-next";

import type { RootStackParamList } from "../types/navigation";

import {
  BookingHistoryScreen,
  HomeScreen,
  MyWalletScreen,
  ProfileScreen,
  StaffDashboardScreen,
} from "../screen";
import { BottomTabBar } from "./bottom-tab-bar";

const Tab = createBottomTabNavigator<RootStackParamList>();

function StationTabRedirectScreen() {
  return null;
}

function MainTabNavigator() {
  const { status, isAuthenticated, isStaff } = useAuthNext();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <BottomTabBar {...props} />}
    >
      {isStaff
        ? (
            <>
              <Tab.Screen name="Công cụ" component={StaffDashboardScreen} />
              <Tab.Screen name="Tôi" component={ProfileScreen} />
            </>
          )
        : (
            <>
              <Tab.Screen name="Nhà" component={HomeScreen} />
              <Tab.Screen
                name="Trạm"
                component={StationTabRedirectScreen}
                listeners={({ navigation }) => ({
                  tabPress: (event) => {
                    event.preventDefault();
                    navigation.getParent()?.navigate("StationSelectFlow");
                  },
                })}
              />
              {isAuthenticated
                ? <Tab.Screen name="Booking" component={BookingHistoryScreen} />
                : null}
              {isAuthenticated
                ? <Tab.Screen name="Ví" component={MyWalletScreen} />
                : null}
              {isAuthenticated
                ? <Tab.Screen name="Tôi" component={ProfileScreen} />
                : null}
            </>
          )}
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
