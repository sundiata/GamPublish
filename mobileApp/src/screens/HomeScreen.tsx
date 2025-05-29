"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Animated,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { 
  fetchIslamicDate, 
  // getPrayerTimes,
  // getAllPrayers,
  getAllTracks,
  getQuranAudio,
  getQuranReciters,
  getQuranAudioUrl 
} from "../services/api";
import * as Location from "expo-location";
import Header from '../components/Header';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const DEFAULT_LATITUDE = 13.4549;
const DEFAULT_LONGITUDE = -16.579;

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

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  [key: string]: string;
}

// Add News interface
interface News {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  category: string;
}

// Add Notification interface
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'reminder';
  sentAt: string;
  status: 'sent' | 'scheduled';
  targetAudience: 'all' | 'group';
  groupId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomeScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const [currentTime, setCurrentTime] = useState("");
  const [countdown, setCountdown] = useState("00:00:00");
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    hour: number;
    minute: number;
    tomorrow?: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [islamicDate, setIslamicDate] = useState("");
  const [location, setLocation] = useState("Loading location...");
  const [coordinates, setCoordinates] = useState({
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
  });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerStatuses, setPrayerStatuses] = useState<{ [key: string]: string }>({});
  const [animation] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [news, setNews] = useState<News[]>([
    {
      id: '1',
      title: 'Ramadan 2024 Announcement',
      description: 'Important dates and guidelines for the upcoming holy month',
      imageUrl: 'https://example.com/ramadan.jpg',
      date: '2024-03-10',
      category: 'Announcement'
    },
    {
      id: '2',
      title: 'New Mosque Opening',
      description: 'Community celebrates the opening of a new mosque in the city',
      imageUrl: 'https://example.com/mosque.jpg',
      date: '2024-03-09',
      category: 'Community'
    },
    {
      id: '3',
      title: 'Islamic Education Program',
      description: 'Free Quran classes for children starting next week',
      imageUrl: 'https://example.com/education.jpg',
      date: '2024-03-08',
      category: 'Education'
    }
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and update time-related states
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get user location
        let userLocation = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const position = await Location.getCurrentPositionAsync({});
            userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            const geocode = await Location.reverseGeocodeAsync({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            });

            if (geocode && geocode[0]) {
              const { city, country } = geocode[0];
              const locationName = `${city || "Unknown"}, ${country || "Unknown"}`;
              setLocation(locationName);
            }

            setCoordinates(userLocation);
          } else {
            console.log("Location permission denied, using default location");
          }
        } catch (locationError) {
          console.error("Error getting location:", locationError);
        }

        // Get Islamic Date
        const hijriDate = await fetchIslamicDate();
        setIslamicDate(hijriDate.format);

        // Fetch prayers and notifications
        await Promise.all([fetchPrayers(), fetchNotifications()]);

      } catch (error) {
        console.error("Error initializing app:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Set up intervals for time updates
    const timeInterval = setInterval(() => {
      updateCurrentTime();
    }, 1000);

    // Set up countdown interval that updates every second
    countdownIntervalRef.current = setInterval(() => {
      updateCountdown();
    }, 1000);

    startAnimation();

    return () => {
      clearInterval(timeInterval);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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
        
        // Update prayer times and statuses
        const prayerTimes: PrayerTimes = sortedPrayers.reduce((acc: PrayerTimes, prayer: Prayer) => {
          acc[prayer.category.toLowerCase()] = prayer.time;
          return acc;
        }, {
          fajr: '',
          sunrise: '',
          dhuhr: '',
          asr: '',
          maghrib: '',
          isha: ''
        });
        
        setPrayerTimes(prayerTimes);
        updatePrayerTimesAndStatuses(prayerTimes);
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

  // Format time string from API (24-hour format) to time object
  const formatTimeObject = (timeStr) => {
    if (!timeStr) return { hour: 0, minute: 0 };

    const cleanTime = timeStr.split(" ")[0];
    const [hours, minutes] = cleanTime.split(":");
    return {
      hour: Number.parseInt(hours, 10),
      minute: Number.parseInt(minutes, 10),
    };
  };

  // Animation for prayer cards
  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Update current time
  const updateCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    setCurrentTime(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`
    );
  };

  // Update prayer times and statuses
  const updatePrayerTimesAndStatuses = (times: PrayerTimes) => {
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
    let nextPrayerIndex = -1;
    let statuses = {};

    for (let i = 0; i < prayerTimesArray.length; i++) {
      const prayer = prayerTimesArray[i];
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTimeInMinutes = hours * 60 + minutes;

      // Set status for each prayer
      if (currentTimeInMinutes > prayerTimeInMinutes) {
        statuses[prayer.name.toLowerCase()] = 'completed';
      } else if (nextPrayerIndex === -1) {
        nextPrayerIndex = i;
        statuses[prayer.name.toLowerCase()] = 'next';
      } else {
        statuses[prayer.name.toLowerCase()] = 'pending';
      }
    }

    // If all prayers are completed, next prayer is tomorrow's Fajr
    if (nextPrayerIndex === -1) {
      nextPrayerIndex = 0;
      const nextPrayer = prayerTimesArray[0];
      const [hours, minutes] = nextPrayer.time.split(':').map(Number);
      setNextPrayer({
        name: nextPrayer.name,
        hour: hours,
        minute: minutes,
        tomorrow: true
      });
    } else {
      const nextPrayer = prayerTimesArray[nextPrayerIndex];
      const [hours, minutes] = nextPrayer.time.split(':').map(Number);
      setNextPrayer({
        name: nextPrayer.name,
        hour: hours,
        minute: minutes
      });
    }

    setPrayerStatuses(statuses);
  };

  // Update countdown
  const updateCountdown = () => {
    if (!nextPrayer) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

    let targetTimeInSeconds = nextPrayer.hour * 3600 + nextPrayer.minute * 60;
    if (nextPrayer.tomorrow) {
      targetTimeInSeconds += 24 * 3600; // Add 24 hours if it's tomorrow
    }

    let remainingSeconds = targetTimeInSeconds - currentTimeInSeconds;
    if (remainingSeconds < 0) {
      remainingSeconds += 24 * 3600; // Add 24 hours if negative
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    setCountdown(
      `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );

    // Update progress
    const totalSecondsInDay = 24 * 3600;
    const progress = (currentTimeInSeconds / totalSecondsInDay) * 100;
    setProgress(progress);
  };

  // Navigate to prayer times page
  const navigateToPrayerTimes = () => {
    navigation.navigate("Prayer Times");
  };

  // Navigate to audio page
  const navigateToAudios = () => {
    navigation.navigate("Audio");
  };

  // Navigate to feature screens
  const navigateToFeature = (screenName) => {
    navigation.navigate(screenName);
  };

  const handleFeaturePress = (feature: string) => {
    switch (feature) {
      case 'Qibla':
        navigation.navigate('Qibla');
        break;
      // ... existing cases ...
    }
  };

  const getPrayerStatusStyle = (status) => {
    switch (status) {
      case "completed":
        return {
          backgroundColor: `${colors.prayerCompleted}20`,
          color: colors.prayerCompleted,
          text: "Completed",
        };
      case "next":
        return {
          backgroundColor: `${colors.prayerNext}30`,
          color: colors.prayerNext,
          text: "Next",
        };
      default:
        return {
          backgroundColor: `${colors.prayerPending}20`,
          color: colors.prayerPending,
          text: "Pending",
        };
    }
  };

  // Helper function to get prayer icon
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

  const renderPrayerItem = (prayer: Prayer) => {
    const status = prayerStatuses[prayer.category.toLowerCase()] || 'pending';
    const statusStyle = getPrayerStatusStyle(status);
    const isNext = status === "next";

    return (
      <Animated.View
        key={prayer._id}
        style={[
          styles.enhancedPrayerItem,
          isNext && [styles.nextPrayerItem, { borderLeftColor: colors.primary }],
        ]}
      >
        <View style={styles.prayerIconContainer}>
          <LinearGradient
            colors={isNext ? ['#4A90E2', '#357ABD'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']}
            style={styles.prayerIconGradient}
          >
            <Feather
              name={getPrayerIcon(prayer.category)}
              size={22}
              color={isNext ? 'white' : 'black'}
            />
          </LinearGradient>
        </View>
        <View style={styles.prayerNameTime}>
          <Text style={[styles.prayerName, isNext && styles.nextPrayerText]}>
            {prayer.title}
          </Text>
          <Text style={styles.prayerSchedule}>
            {prayer.time}
          </Text>
        </View>
        <View style={[styles.prayerStatus, { backgroundColor: isNext ? `${colors.primary}15` : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.statusText, { color: isNext ? colors.primary : 'black' }]}>
            {statusStyle.text}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Add fetchNotifications function
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await axios.get(`${API_URL}/notifications`);
      
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (response.data.status === 'success' && response.data.data?.notifications) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error status:', error.response.status);
      }
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Add a separate useEffect for notifications
  useEffect(() => {
    fetchNotifications();
  }, []); // Empty dependency array means it only runs once on mount

  useEffect(() => {
    // Update prayer times and statuses every minute
    const prayerUpdateInterval = setInterval(() => {
      if (prayerTimes) {
        updatePrayerTimesAndStatuses(prayerTimes);
      }
    }, 60000); // Update every minute

    return () => {
      clearInterval(prayerUpdateInterval);
    };
  }, [prayerTimes]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: colors.primary }]}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={colors.background} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>
          {error ? error : 'Loading...'}
        </Text>
      </SafeAreaView>
    );
  }

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
            // Handle notification press
            console.log('Notification pressed');
          }}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Time Display */}
          <View style={styles.timeDisplayContainer}>
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.timeDisplay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.currentTime, { color: 'white' }]}>
                {currentTime}
              </Text>
              <Text style={[styles.timeInfo, { color: 'white' }]}>
                {isLoading ? 'Loading prayer times...' : 
                 error ? error :
                 nextPrayer ? `${nextPrayer.name} · ${countdown} left` : 'No prayer times available'}
              </Text>

              {/* Prayer Times Row */}
              {prayerTimes && (
                <View style={styles.prayerTimesRow}>
                  {Object.entries(prayerTimes).map(([name, time]) => (
                    <View key={name} style={styles.prayerTimeItem}>
                      <Feather
                        name={getPrayerIcon(name)}
                        size={20}
                        color={'white'}
                      />
                      <Text style={[styles.prayerTimeLabel, { color: 'white' }]}>
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Text>
                      <Text style={[styles.prayerTimeValue, { color: 'white' }]}>
                        {time}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Indicator */}
              <View style={styles.indicator}>
                <View style={[styles.indicatorDot, { backgroundColor: 'white' }]} />
              </View>
            </LinearGradient>
          </View>

          {/* News Section */}
          <View style={[styles.newsSection, { backgroundColor: 'white' }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: 'black' }]}>
                Latest News
              </Text>
              <TouchableOpacity>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newsContainer}
            >
              {isLoadingNotifications ? (
                <View style={styles.newsLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : notifications && notifications.length > 0 ? (
                notifications.map((notification) => {
                  const imageSource = notification.imageUrl 
                    ? { uri: notification.imageUrl.startsWith('data:') 
                        ? notification.imageUrl 
                        : `data:image/jpeg;base64,${notification.imageUrl}` }
                    : { uri: 'https://via.placeholder.com/280x200?text=No+Image' };

                  return (
                    <TouchableOpacity
                      key={notification._id}
                      style={styles.newsCard}
                      onPress={() => {
                        // Handle notification press
                      }}
                    >
                      <Image
                        source={imageSource}
                        style={styles.newsImage}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={styles.newsGradient}
                      >
                        <View style={styles.newsContent}>
                          <Text style={styles.newsCategory}>{notification.title}</Text>
                          <Text style={[styles.newsTitle, { color: 'white' }]} numberOfLines={2}>
                            {notification.message || 'No Message'}
                          </Text>
                          <Text style={styles.newsDate}>
                            {new Date(notification.sentAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noNewsContainer}>
                  <Text style={styles.noNewsText}>No news available</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Favorites */}
          <View style={[styles.favoritesSection, { backgroundColor: 'white' }]}>
            <Text style={[styles.sectionLabel, { color: 'black' }]}>
              Favourites
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesContainer}
            >
              <TouchableOpacity
                style={[
                  styles.favoriteChip,
                  { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 67,
                    surahName: "Al-Mulk",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: 'black' }]}
                >
                  67. Al-Mulk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.favoriteChip,
                  { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 2,
                    surahName: "Al-Baqarah",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: 'black' }]}
                >
                  2. Al-Baqarah
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.favoriteChip,
                  { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 19,
                    surahName: "Maryam",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: 'black' }]}
                >
                  19. Maryam
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Continue Listening */}
          <View style={[styles.continueListeningSection, { backgroundColor: 'white' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Continue Listening
            </Text>
            <TouchableOpacity
              style={[
                styles.continueListeningCard,
                { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
              ]}
              onPress={() =>
                navigation.navigate("NowPlayingScreen", {
                  song: {
                    title: "2. Al-Baqarah",
                    artist: "Sheikh Mishary",
                    imageUrl: "https://placeholder-images.com/surahs/alBaqarah",
                  },
                })
              }
            >
              <Image
                source={{
                  uri: "https://placeholder-images.com/surahs/alBaqarah",
                }}
                style={[
                  styles.surahThumbnail,
                  { backgroundColor: 'white' },
                ]}
              />
              <View style={styles.continueListeningInfo}>
                <Text
                  style={[styles.continueListeningTitle, { color: 'black' }]}
                >
                  2. Al-Baqarah
                </Text>
                <Text
                  style={[
                    styles.continueListeningSubtitle,
                    { color: 'black' },
                  ]}
                >
                  The Cow
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%`, backgroundColor: 'black' },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.progressText, { color: 'black' }]}
                  >
                    {countdown}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  { backgroundColor: colors.secondaryTransparent },
                ]}
              >
                <Ionicons name="play" size={24} color={'black'} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Daily Prayers */}
          <View style={[styles.dailyPrayersSection, { backgroundColor: 'white' }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: 'black' }]}>
                Daily Prayers
              </Text>
              <TouchableOpacity onPress={navigateToPrayerTimes}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prayersListContainer}>
              {prayers.map((prayer) => renderPrayerItem(prayer))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  timeDisplayContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timeDisplay: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    color: '#000000',
  },
  timeInfo: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: '#000000',
  },
  prayerTimesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  prayerTimeItem: {
    alignItems: "center",
  },
  prayerTimeLabel: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
    color: '#000000',
  },
  prayerTimeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: '#000000',
  },
  indicator: {
    alignItems: "center",
    marginTop: 16,
  },
  indicatorDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  favoritesSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: '#000000',
  },
  favoritesContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  favoriteChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  favoriteChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: '#000000',
  },
  continueListeningSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: '#000000',
    marginBottom: 8,
  },
  continueListeningCard: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: '#FFFFFF',
  },
  surahThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  continueListeningInfo: {
    flex: 1,
  },
  continueListeningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#000000',
  },
  continueListeningSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    color: '#000000',
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  progressText: {
    fontSize: 10,
    color: '#000000',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dailyPrayersSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  prayersListContainer: {
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  enhancedPrayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
    backgroundColor: 'white',
  },
  nextPrayerItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderLeftWidth: 3,
  },
  prayerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    overflow: 'hidden',
  },
  prayerIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerNameTime: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: 'black',
  },
  nextPrayerText: {
    fontWeight: '700',
    color: '#4A90E2',
  },
  prayerSchedule: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  prayerStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  newsSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  newsContainer: {
    paddingRight: 16,
  },
  newsCard: {
    width: 280,
    height: 200,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newsImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  newsContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  newsCategory: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  newsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  newsDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  newsLoadingContainer: {  // Renamed from loadingContainer to avoid duplicate
    width: 280,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noNewsContainer: {
    width: 280,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  noNewsText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.5)',
  },
});
