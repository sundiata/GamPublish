"use client";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');

  useEffect(() => {
    loadIslamicDate();
    loadLocation();
  }, []);

  const loadIslamicDate = async () => {
    try {
      const hijriDate = await fetchIslamicDate();
      setIslamicDate(hijriDate.format);
    } catch (error) {
      console.error("Error loading Islamic date:", error);
      setIslamicDate('Loading date...');
    }
  };

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({});
        const geocode = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (geocode && geocode[0]) {
          const { city, country } = geocode[0];
          const locationName = `${city || "Unknown"}, ${country || "Unknown"}`;
          setLocation(locationName);
        }
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setLocation('Location unavailable');
    }
  };

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    profileImage: 'https://via.placeholder.com/150',
    stats: {
      prayersCompleted: 156,
      quranRead: 23,
      eventsAttended: 5,
    },
  };

  const menuItems = [
    { icon: 'person-outline' as const, label: 'Account Settings', color: COLORS.primary },
    { icon: 'notifications-outline' as const, label: 'Notifications', color: COLORS.primary },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy', color: COLORS.success },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', color: COLORS.info },
    { icon: 'information-circle-outline' as const, label: 'About', color: COLORS.primary },
    { icon: 'log-out-outline' as const, label: 'Logout', color: COLORS.error },
  ];

  const handleMenuItemPress = (label: string) => {
    // Handle menu item press based on label
    console.log(`Pressed: ${label}`);
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.primary }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        <Header 
          islamicDate={islamicDate}
          location={location}
          onNotificationPress={() => {
            console.log('Notification pressed');
          }}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)']}
              style={styles.profileGradient}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.profileImage}
                />
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </LinearGradient>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time-outline" size={24} color="black" />
              </View>
              <Text style={styles.statValue}>{user.stats.prayersCompleted}</Text>
              <Text style={styles.statLabel}>Prayers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="book-outline" size={24} color="black" />
              </View>
              <Text style={styles.statValue}>{user.stats.quranRead}</Text>
              <Text style={styles.statLabel}>Quran</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="black" />
              </View>
              <Text style={styles.statValue}>{user.stats.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.label)}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
                  <Ionicons name={item.icon} size={24} color="black" />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  profileGradient: {
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'black',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'black',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
  },
});

export default ProfileScreen;
