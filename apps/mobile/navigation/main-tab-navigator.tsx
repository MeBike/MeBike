import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
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
import { BottomTabBar } from "./bottom-tab-bar";

const Tab = createBottomTabNavigator<RootStackParamList>();

function StationTabRedirectScreen() {
  const navigation = useNavigation();

  React.useEffect(() => {
    navigation.getParent()?.navigate("StationSelectFlow");
  }, [navigation]);

  return null;
}

function MainTabNavigator() {
  const { status, isAuthenticated, isTechnician, user } = useAuthNext();
  const canUseStaffTools = user?.role === "STAFF" || user?.role === "AGENCY";

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
