import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import PrayerTimesScreen from "../screens/PrayerTimesScreen";
import QuranScreen from "../screens/QuranScreen";
import SurahDetailScreen from "../screens/SurahDetailScreen";
import AudioScreen from "../screens/AudioScreen";
import NowPlayingScreen from "../screens/NowPlayingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AlbumDetailScreen from "../screens/AlbumDetailScreen";
import AudioDetailsScreen from "../screens/AudioDetailsScreen";
import AudioDetailScreen from "../screens/AudioDetailScreen";
import IslamicEventsScreen from "../screens/IslamicEventsScreen";
import EventPaymentScreen from "../screens/EventPaymentScreen";
import EventQRCodeScreen from "../screens/EventQRCodeScreen";
import QiblaScreen from "../screens/QiblaScreen";
import { COLORS, SIZES } from "../constants/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const QuranStack = createNativeStackNavigator();
const AudioStack = createNativeStackNavigator();
const EventsStack = createNativeStackNavigator();

const QuranNavigator = () => {
  return (
    <QuranStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.background,
        headerTitle: '',
        contentStyle: {
          backgroundColor: COLORS.primary,
        }
      }}
    >
      <QuranStack.Screen name="QuranList" component={QuranScreen} />
      <QuranStack.Screen
        name="SurahDetailScreen"
        component={SurahDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </QuranStack.Navigator>
  );
};

const AudioNavigator = () => {
  return (
    <AudioStack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.background,
        headerTitle: '',
        contentStyle: {
          backgroundColor: COLORS.primary,
        }
      }}
    >
      <AudioStack.Screen name="AudioList" component={AudioScreen} />
      <AudioStack.Screen
        name="NowPlayingScreen"
        component={NowPlayingScreen}
      />
      <AudioStack.Screen
        name="AudioDetailsScreen"
        component={AudioDetailsScreen}
      />
      <AudioStack.Screen
        name="AudioDetail"
        component={AudioDetailScreen}
        options={{
          headerShown: false
        }}
      />
      <AudioStack.Screen
        name="AlbumDetail"
        component={AlbumDetailScreen}
      />
    </AudioStack.Navigator>
  );
};

const EventsNavigator = () => {
  return (
    <EventsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.background,
        headerTitle: '',
        contentStyle: {
          backgroundColor: COLORS.primary,
        }
      }}
    >
      <EventsStack.Screen name="EventsList" component={IslamicEventsScreen} />
      <EventsStack.Screen name="EventPayment" component={EventPaymentScreen} />
      <EventsStack.Screen name="EventQRCode" component={EventQRCodeScreen} />
    </EventsStack.Navigator>
  );
};

const HomeNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Qibla"
        component={QiblaScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }} edges={["top"]}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: `${COLORS.textSecondary}10`,
            height: Platform.OS === "ios" ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 28 : 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 4,
          },
          tabBarIconStyle: {
            marginBottom: -3,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Prayer Times"
          component={PrayerTimesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Quran"
          component={QuranNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Events"
          component={EventsNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Audio"
          component={AudioNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="headset" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default TabNavigator;
