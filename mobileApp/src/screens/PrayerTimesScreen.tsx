import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Header from '../components/Header';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

// API URL based on platform
const API_URL = Platform.select({
  ios: 'http://127.0.0.1:4001/api',
  android: 'http://10.0.2.2:4001/api',
  default: 'http://127.0.0.1:4001/api'
});

// Prayer Types
interface Prayer {
  _id: string;
  title: string;
  date: string;
  time: string;
  category: 'Fajr' | 'Duha' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Jumu\'ah';
  status: 'Published' | 'Draft';
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface PrayerResponse {
  status: string;
  data: {
    currentPage: number;
    prayers: Prayer[];
    total: number;
    totalPages: number;
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'PrayerTimes'>;

const PrayerTimesScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ prayer: Prayer | null; remainingMinutes: number }>({
    prayer: null,
    remainingMinutes: 0
  });
  const [alarms, setAlarms] = useState<{ [key: string]: boolean }>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Request notification permissions
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
    }
  };

  // Schedule adhan notification
  const scheduleAdhanNotification = async (prayer: Prayer) => {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes - 15, 0); // 15 minutes before prayer

    if (notificationTime > new Date()) {
      const seconds = Math.floor((notificationTime.getTime() - new Date().getTime()) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Adhan for ${prayer.title}`,
          body: `It's time for ${prayer.title} prayer in 15 minutes`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
          repeats: false
        },
      });
    }
  };

  // Toggle alarm for a prayer
  const toggleAlarm = async (prayer: Prayer) => {
    const newAlarmState = !alarms[prayer._id];
    setAlarms(prev => ({
      ...prev,
      [prayer._id]: newAlarmState
    }));

    if (newAlarmState) {
      await scheduleAdhanNotification(prayer);
    } else {
      // Cancel notification if alarm is turned off
      await Notifications.cancelScheduledNotificationAsync(prayer._id);
    }
  };

  // Fetch prayers on mount
  useEffect(() => {
    fetchPrayers();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (prayers.length > 0) {
        updateNextPrayer();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [prayers]);

  const updateNextPrayer = () => {
    const now = currentTime;
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the next prayer
    let nextPrayerFound = false;
    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;

      if (prayerTime > currentTimeInMinutes) {
        const remainingMinutes = prayerTime - currentTimeInMinutes;
        setNextPrayer({
          prayer,
          remainingMinutes
        });
        nextPrayerFound = true;
        break;
      }
    }

    // If no next prayer found today, set to first prayer of next day
    if (!nextPrayerFound && prayers.length > 0) {
      const firstPrayer = prayers[0];
      const [hours, minutes] = firstPrayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      const remainingMinutes = (24 * 60 - currentTimeInMinutes) + prayerTime;
      setNextPrayer({
        prayer: firstPrayer,
        remainingMinutes
      });
    }
  };

  // Fetch prayers from API
  const fetchPrayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<PrayerResponse>(`${API_URL}/prayers`);
      console.log('API Response:', response.data);
      
      if (response.data.status === 'success' && response.data.data.prayers) {
        // Sort prayers by category
        const sortedPrayers = response.data.data.prayers.sort((a, b) => {
          const categoryOrder = {
            'Fajr': 1,
            'Duha': 2,
            'Dhuhr': 3,
            'Asr': 4,
            'Maghrib': 5,
            'Isha': 6,
            'Jumu\'ah': 7
          };
          return (categoryOrder[a.category] || 0) - (categoryOrder[b.category] || 0);
        });
        setPrayers(sortedPrayers);
      } else {
        setError('Failed to load prayers');
      }
    } catch (err) {
      console.error('Error fetching prayers:', err);
      setError('Failed to load prayers');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRemainingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Helper function to get prayer icon
  const getPrayerIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category.toLowerCase()) {
      case 'fajr':
        return 'sunny';
      case 'duha':
      case 'dhuhr':
      case 'asr':
        return 'sunny';
      case 'maghrib':
        return 'sunny';
      case 'isha':
        return 'moon';
      case 'jumu\'ah':
        return 'calendar';
      default:
        return 'time';
    }
  };

  // Helper function to get prayer color
  const getPrayerColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'fajr':
        return '#FF6B6B';
      case 'duha':
        return '#FFD93D';
      case 'dhuhr':
        return '#4ECDC4';
      case 'asr':
        return '#45B7D1';
      case 'maghrib':
        return '#FF8B94';
      case 'isha':
        return '#6C5CE7';
      case 'jumu\'ah':
        return '#A8E6CF';
      default:
        return '#000000';
    }
  };

  // Animated styles
  const nextPrayerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value }
      ]
    };
  });

  const alarmButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` }
      ]
    };
  });

  // Handle alarm toggle with animation
  const handleAlarmToggle = async (prayer: Prayer) => {
    rotation.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    await toggleAlarm(prayer);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header 
        islamicDate="23.45.2025"
        location="Gambia International airline"
        onNotificationPress={() => {}}
        showBackButton={false}
      />

      <View style={styles.contentContainer}>
        {/* Next Prayer Card */}
        {nextPrayer.prayer && (
          <Animated.View style={[styles.nextPrayerCard, nextPrayerStyle]}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.nextPrayerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.nextPrayerContent}>
                <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
                <View style={styles.nextPrayerHeader}>
                  <Ionicons 
                    name={getPrayerIcon(nextPrayer.prayer.category)} 
                    size={32} 
                    color="white" 
                    style={styles.nextPrayerIcon}
                  />
                  <Text style={styles.nextPrayerName}>{nextPrayer.prayer.title}</Text>
                </View>
                <Text style={styles.nextPrayerTime}>{nextPrayer.prayer.time}</Text>
                <View style={styles.remainingTimeContainer}>
                  <Ionicons name="time" size={20} color="white" style={styles.remainingTimeIcon} />
                  <Text style={styles.remainingTime}>
                    {formatRemainingTime(nextPrayer.remainingMinutes)} remaining
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.prayersContainer}>
              {prayers.map((item) => (
                <View key={item._id} style={styles.prayerItem}>
                  <View style={[styles.prayerIconContainer, { backgroundColor: getPrayerColor(item.category) }]}>
                    <Ionicons 
                      name={getPrayerIcon(item.category)} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.prayerInfo}>
                    <Text style={styles.prayerTitle}>{item.title}</Text>
                    <Text style={styles.prayerCategory}>{item.category}</Text>
                    <Text style={styles.prayerTime}>{item.time}</Text>
                  </View>
                  <Animated.View style={alarmButtonStyle}>
                    <TouchableOpacity 
                      style={[
                        styles.alarmButton,
                        alarms[item._id] && styles.alarmButtonActive
                      ]}
                      onPress={() => handleAlarmToggle(item)}
                    >
                      <Ionicons 
                        name={alarms[item._id] ? "notifications" : "notifications-outline"} 
                        size={24} 
                        color={alarms[item._id] ? "white" : '#666666'} 
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: 'white',
  },
  nextPrayerCard: {
    width: '90%',
    margin: 12,
    marginTop: 4,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    bottom: 40,
    maxWidth: 500,
    alignSelf: 'center',
  },
  nextPrayerGradient: {
    padding: 16,
  },
  nextPrayerContent: {
    alignItems: 'center',
  },
  nextPrayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  nextPrayerIcon: {
    marginRight: 8,
  },
  nextPrayerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextPrayerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  nextPrayerTime: {
    fontSize: 42,
    color: 'white',
    marginVertical: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  remainingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
    marginTop: 4,
  },
  remainingTimeIcon: {
    marginRight: 10,
  },
  remainingTime: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 16,
  },
  prayersContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'white',
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  prayerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  prayerCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  prayerTime: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  alarmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  alarmButtonActive: {
    backgroundColor: COLORS.primary,
  },
});

export default PrayerTimesScreen;
