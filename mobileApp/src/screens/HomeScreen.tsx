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
  getPrayerTimes,
  getAllPrayers,
  getAllTracks,
  getQuranAudio,
  getQuranReciters,
  getQuranAudioUrl 
} from "../services/api";
import * as Location from "expo-location";
import { PrayerTimes } from "../services/api";
const DEFAULT_LATITUDE = 13.4549;
const DEFAULT_LONGITUDE = -16.579;

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
  const [prayerStatuses, setPrayerStatuses] = useState({});
  const [animation] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

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

        // Get Prayer Times
        const times = await getPrayerTimes();
        console.log('Fetched prayer times:', times);
        setPrayerTimes(times);
        updatePrayerTimesAndStatuses(times);

      } catch (error) {
        console.error("Error initializing app:", error);
        setError("Failed to load prayer times. Please try again.");
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
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

    // Update current time display
    const hours = now.getHours();
    const minutes = now.getMinutes();
    setCurrentTime(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`
    );

    // Update prayer times and statuses if available
    if (prayerTimes) {
      updatePrayerTimesAndStatuses(prayerTimes);
    }
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

  // Handle search input
  const handleSearch = (text) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to simulate API call delay
    if (text.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        // Mock search results
        const mockResults = [
          {
            surahNumber: 1,
            surahName: "Al-Fatiha",
            verseNumber: 1,
            text: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          },
          {
            surahNumber: 2,
            surahName: "Al-Baqarah",
            verseNumber: 255,
            text: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence.",
          },
          {
            surahNumber: 112,
            surahName: "Al-Ikhlas",
            verseNumber: 1,
            text: 'Say, "He is Allah, [who is] One."',
          },
        ].filter(
          (item) =>
            item.surahName.toLowerCase().includes(text.toLowerCase()) ||
            item.text.toLowerCase().includes(text.toLowerCase())
        );

        setSearchResults(mockResults);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
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

  const renderFeatureButton = (icon, label, screenName) => (
    <TouchableOpacity
      style={styles.featureButton}
      onPress={() => handleFeaturePress(screenName)}
    >
      <View
        style={[
          styles.featureIconContainer,
          { backgroundColor: colors.primary },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.featureLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

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

  // Render search results
  const renderSearchResults = () => {
    if (searchQuery.length < 3) return null;

    if (isSearching) {
      return (
        <View
          style={[
            styles.searchResultsContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <ActivityIndicator color={colors.background} />
          <Text style={[styles.searchingText, { color: colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery.length >= 3) {
      return (
        <View
          style={[
            styles.searchResultsContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No results found
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.searchResultsContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
          Search Results
        </Text>
        {searchResults.slice(0, 5).map((result, index) => (
          <TouchableOpacity key={index} style={styles.searchResultItem}>
            <Text style={[styles.searchResultSurah, { color: colors.primary }]}>
              {result.surahNumber}. {result.surahName} - Verse{" "}
              {result.verseNumber}
            </Text>
            <Text
              style={[styles.searchResultText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {result.text}
            </Text>
          </TouchableOpacity>
        ))}
        {searchResults.length > 5 && (
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={[styles.viewMoreText, { color: colors.primary }]}>
              View more results
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
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
        {/* Header with Search */}
        <View
          style={[styles.header, { backgroundColor: colors.primary }]}
        >
          {/* Top Header Row */}
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.islamicDate, { color: colors.background }]}>
                {islamicDate}
              </Text>
              <Text style={[styles.location, { color: colors.background }]}>
                {location}
              </Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.background}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.background }]}
              placeholder="Search surah, narrators or keywords"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.background}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {renderSearchResults()}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Time Display */}
          <View
            style={[
              styles.timeDisplay,
              { backgroundColor: colors.headerBackground },
            ]}
          >
            <Text style={[styles.currentTime, { color: colors.textLight }]}>
              {currentTime}
            </Text>
            <Text style={[styles.timeInfo, { color: colors.textLight }]}>
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
                      color={colors.textLight}
                    />
                    <Text style={[styles.prayerTimeLabel, { color: colors.textLight }]}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Text>
                    <Text style={[styles.prayerTimeValue, { color: colors.textLight }]}>
                      {time}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Indicator */}
            <View style={styles.indicator}>
              <View style={[styles.indicatorDot, { backgroundColor: colors.secondary }]} />
            </View>
          </View>

          {/* All Features */}
          <View
            style={[
              styles.featuresSection,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              All Features
            </Text>
            <View style={styles.featuresGrid}>
              {renderFeatureButton(
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={colors.textLight}
                />,
                "Quran",
                "Quran"
              )}
              {renderFeatureButton(
                <Ionicons
                  name="volume-high-outline"
                  size={24}
                  color={colors.textLight}
                />,
                "Adzan",
                "Adzan"
              )}
              {renderFeatureButton(
                <Ionicons
                  name="compass-outline"
                  size={24}
                  color={colors.textLight}
                />,
                "Qibla",
                "Qibla"
              )}
              {renderFeatureButton(
                <Ionicons
                  name="heart-outline"
                  size={24}
                  color={colors.textLight}
                />,
                "Donation",
                "Donation"
              )}
              {renderFeatureButton(
                <Ionicons
                  name="grid-outline"
                  size={24}
                  color={colors.textLight}
                />,
                "All",
                "AllFeatures"
              )}
            </View>
          </View>

          {/* Favorites */}
          <View
            style={[
              styles.favoritesSection,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
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
                  { backgroundColor: colors.primaryTransparent },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 67,
                    surahName: "Al-Mulk",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: colors.primary }]}
                >
                  67. Al-Mulk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.favoriteChip,
                  { backgroundColor: colors.primaryTransparent },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 2,
                    surahName: "Al-Baqarah",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: colors.primary }]}
                >
                  2. Al-Baqarah
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.favoriteChip,
                  { backgroundColor: colors.primaryTransparent },
                ]}
                onPress={() =>
                  navigation.navigate("SurahDetailScreen", {
                    surahNumber: 19,
                    surahName: "Maryam",
                  })
                }
              >
                <Text
                  style={[styles.favoriteChipText, { color: colors.primary }]}
                >
                  19. Maryam
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Continue Listening */}
          <View
            style={[
              styles.continueListeningSection,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Continue Listening
            </Text>
            <TouchableOpacity
              style={[
                styles.continueListeningCard,
                { backgroundColor: colors.cardBackground },
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
                  { backgroundColor: colors.primaryTransparent },
                ]}
              />
              <View style={styles.continueListeningInfo}>
                <Text
                  style={[styles.continueListeningTitle, { color: colors.text }]}
                >
                  2. Al-Baqarah
                </Text>
                <Text
                  style={[
                    styles.continueListeningSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  The Cow
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.progressText, { color: colors.textSecondary }]}
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
                <Ionicons name="play" size={24} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Daily Prayers */}
          <View
            style={[
              styles.dailyPrayersSection,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Daily Prayers
              </Text>
              <TouchableOpacity onPress={navigateToPrayerTimes}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.prayersListContainer,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              {Object.entries(prayerStatuses).map(([name, status]) => {
                const statusStyle = getPrayerStatusStyle(status);
                const isNext = status === "next";

                // Create animated styles for the "next" prayer
                const animatedStyle = isNext
                  ? {
                      transform: [
                        {
                          scale: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.03],
                          }),
                        },
                      ],
                      shadowOpacity: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.1, 0.3],
                      }),
                    }
                  : {};

                return (
                  <Animated.View
                    key={name}
                    style={[
                      styles.enhancedPrayerItem,
                      isNext && styles.nextPrayerItem,
                      { borderBottomColor: colors.divider },
                      animatedStyle,
                    ]}
                  >
                    <View
                      style={[
                        styles.prayerIconContainer,
                        { backgroundColor: "rgba(0, 0, 0, 0.05)" },
                      ]}
                    >
                      <Feather
                        name={getPrayerIcon(name)}
                        size={24}
                        color={isNext ? colors.secondary : colors.primary}
                      />
                    </View>
                    <View style={styles.prayerNameTime}>
                      <Text
                        style={[
                          styles.prayerName,
                          { color: colors.text },
                          isNext && [
                            styles.nextPrayerText,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </Text>
                      <Text
                        style={[
                          styles.prayerSchedule,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {prayerTimes[name]}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.prayerStatus,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusStyle.color }]}
                      >
                        {statusStyle.text}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  islamicDate: {
    fontSize: 16,
    fontWeight: "500",
  },
  location: {
    fontSize: 14,
    opacity: 0.8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 8,
  },
  searchResultsContainer: {
    borderRadius: 8,
    marginTop: 8,
    padding: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  searchResultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchResultSurah: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchResultText: {
    fontSize: 14,
    marginTop: 2,
  },
  searchingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: "center",
  },
  viewMoreButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  timeDisplay: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
  timeInfo: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
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
  },
  prayerTimeValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  indicator: {
    alignItems: "center",
    marginTop: 16,
  },
  indicatorDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  // Favorites Section
  favoritesSection: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
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
  },
  favoriteChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Continue Listening Section
  continueListeningSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  continueListeningCard: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    alignItems: "center",
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
  },
  continueListeningSubtitle: {
    fontSize: 14,
    marginBottom: 4,
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
  },
  progressText: {
    fontSize: 10,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Features Section
  featuresSection: {
    padding: 16,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureButton: {
    width: "18%",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  // Daily Prayers Section - Enhanced
  dailyPrayersSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "500",
  },
  prayersListContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  enhancedPrayerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  nextPrayerItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  prayerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  prayerNameTime: {
    flex: 1,
    marginLeft: 8,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  nextPrayerText: {
    fontWeight: "700",
  },
  prayerSchedule: {
    fontSize: 14,
  },
  prayerStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
