import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import { LoadingScreen } from "@components/LoadingScreen";
import { useAuthNext } from "@providers/auth-provider-next";

import type { RootStackParamList } from "../types/navigation";

import {
  AiAssistantScreen,
  BookingHistoryScreen,
  MyWalletScreen,
  ProfileScreen,
  StaffDashboardScreen,
  TechnicianDashboardScreen,
} from "../screen";
import StationSelectScreen from "../styles/StationSelect";
import { BottomTabBar } from "./bottom-tab-bar";

const Tab = createBottomTabNavigator<RootStackParamList>();

function MainTabNavigator() {
  const { status, isAuthenticated, isTechnician, user } = useAuthNext();
  const canUseStaffTools = user?.role === "STAFF" || user?.role === "AGENCY";
  const initialRouteName = canUseStaffTools || isTechnician
    ? "Công cụ"
    : isAuthenticated
      ? "Booking"
      : "Trạm";

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <BottomTabBar {...props} />}
    >
      {canUseStaffTools || isTechnician
        ? (
            <>
              <Tab.Screen
                name="Công cụ"
                component={isTechnician ? TechnicianDashboardScreen : StaffDashboardScreen}
              />
              <Tab.Screen name="Tôi" component={ProfileScreen} />
            </>
          )
        : (
            <>
              {isAuthenticated
                ? (
                    <Tab.Screen
                      name="Booking"
                      component={BookingHistoryScreen}
                      options={{ tabBarLabel: "Chuyến đi" }}
                    />
                  )
                : null}
              <Tab.Screen
                name="Trạm"
                component={StationSelectScreen}
              />
              {isAuthenticated
                ? (
                    <Tab.Screen
                      name="AiAssistant"
                      component={AiAssistantScreen}
                      options={{ tabBarLabel: "Trợ lý" }}
                    />
                  )
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
