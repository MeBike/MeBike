import { useAuthNext } from "@providers/auth-provider-next";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import type { RootStackParamList } from "../types/navigation";

import BookingHistoryScreen from "../screen/booking-history";
import HomeScreen from "../screen/Home";
import MyWalletScreen from "../screen/my-wallet-screen";
import ProfileScreen from "../screen/profile-screen";
import SOSAgentDashboardScreen from "../screen/SOSAgentDashboardScreen";
import StaffDashboardScreen from "../screen/StaffDashboardScreen";
import StationSelectScreen from "../styles/StationSelect";
import { BottomTabBar } from "./bottom-tab-bar";

const Tab = createBottomTabNavigator<RootStackParamList>();

function MainTabNavigator() {
  const { isAuthenticated, isStaff, isSOS } = useAuthNext();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <BottomTabBar {...props} />}
    >
      {isSOS
        ? (
            <>
              <Tab.Screen name="SOS Dashboard" component={SOSAgentDashboardScreen} />
              <Tab.Screen name="Tôi" component={ProfileScreen} />
            </>
          )
        : isStaff
          ? (
              <>
                <Tab.Screen name="Công cụ" component={StaffDashboardScreen} />
                <Tab.Screen name="Tôi" component={ProfileScreen} />
              </>
            )
          : (
              <>
                <Tab.Screen name="Nhà" component={HomeScreen} />
                <Tab.Screen name="Trạm" component={StationSelectScreen} />
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
