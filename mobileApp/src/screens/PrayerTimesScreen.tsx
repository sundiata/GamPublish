import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { getPrayerTimes, PrayerTimes } from '../services/api';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";

const { width } = Dimensions.get('window');

const PrayerTimesScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '', remaining: '' });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState('Loading location...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeScreen();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const initializeScreen = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user location
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

      // Get Islamic Date
      const hijriDate = await fetchIslamicDate();
      setHijriDate(hijriDate.format);

      // Get Prayer Times
      const times = await getPrayerTimes();
      console.log('Fetched prayer times:', times);
      setPrayerTimes(times);
      updateNextPrayer(times);

    } catch (error) {
      console.error("Error initializing screen:", error);
      setError("Failed to load prayer times. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPrayerIcon = (category: string): 'sunrise' | 'sun' | 'sunset' | 'moon' => {
    switch (category.toLowerCase()) {
      case 'fajr':
        return 'sunrise';
      case 'sunrise':
      case 'duha':
      case 'dhuhr':
      case 'asr':
        return 'sun';
      case 'maghrib':
        return 'sunset';
      case 'isha':
        return 'moon';
      default:
        return 'sun';
    }
  };

  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }));
    setCurrentDate(now.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));
    if (prayerTimes) {
      updateNextPrayer(prayerTimes);
    }
  };

  const updateNextPrayer = (times: PrayerTimes) => {
    if (!times) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const prayerTimesArray = [
      { name: 'Fajr', time: times.fajr },
      { name: 'Sunrise', time: times.sunrise },
      { name: 'Dhuhr', time: times.dhuhr },
      { name: 'Asr', time: times.asr },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isha', time: times.isha }
    ];

    // Find the next prayer
    let nextPrayer = prayerTimesArray[0];
    let remainingTime = '';

    for (const prayer of prayerTimesArray) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTimeInMinutes = hours * 60 + minutes;

      if (prayerTimeInMinutes > currentTimeInMinutes) {
        nextPrayer = prayer;
        const remainingMinutes = prayerTimeInMinutes - currentTimeInMinutes;
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        remainingTime = `${remainingHours}h ${remainingMins}m`;
        break;
      }
    }

    setNextPrayer({
      name: nextPrayer.name,
      time: nextPrayer.time,
      remaining: remainingTime
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header 
          islamicDate={hijriDate}
          location={location}
          onNotificationPress={() => {
            console.log('Notification pressed');
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Loading prayer times...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header 
          islamicDate={hijriDate}
          location={location}
          onNotificationPress={() => {
            console.log('Notification pressed');
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeScreen}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header 
        islamicDate={hijriDate}
        location={location}
        onNotificationPress={() => {
          console.log('Notification pressed');
        }}
      />

      {/* Current Time and Date */}
      <View style={styles.timeDisplay}>
        <Text style={styles.currentTime}>{currentTime}</Text>
        <Text style={styles.currentDate}>{currentDate}</Text>
      </View>

      {/* Next Prayer Card */}
      <View style={styles.nextPrayerCard}>
        <View style={styles.nextPrayerContent}>
          <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
          <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
          <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
          <Text style={styles.remainingTime}>Remaining Time: {nextPrayer.remaining}</Text>
        </View>
      </View>

      {/* Prayer Times List */}
      <ScrollView style={styles.prayerList} showsVerticalScrollIndicator={false}>
        {prayerTimes && Object.entries(prayerTimes).map(([name, time]) => (
          <View key={name} style={styles.prayerItem}>
            <View style={styles.prayerItemLeft}>
              <View style={styles.iconContainer}>
                <Feather 
                  name={getPrayerIcon(name)} 
                  size={24} 
                  color="black" 
                />
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerName}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
                <Text style={styles.prayerTime}>{time}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.prayerNotificationButton}>
              <Ionicons 
                name="notifications-outline" 
                size={22} 
                color="black" 
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: 'black',
  },
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'black',
  },
  currentDate: {
    fontSize: 16,
    color: 'black',
    opacity: 0.8,
    marginTop: 8,
  },
  nextPrayerCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 15,
  },
  nextPrayerContent: {
    alignItems: 'center',
  },
  nextPrayerLabel: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
  },
  nextPrayerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 20,
    color: 'black',
    marginBottom: 8,
  },
  remainingTime: {
    fontSize: 16,
    color: 'black',
    opacity: 0.8,
  },
  prayerList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: 10,
  },
  prayerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 14,
    color: 'black',
    opacity: 0.8,
  },
  prayerNotificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrayerTimesScreen;
