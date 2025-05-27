import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import { getSurahs, Surah, fetchIslamicDate } from "../services/api";
import { LinearGradient } from "expo-linear-gradient";
import Header from '../components/Header';
import * as Location from "expo-location";

type QuranStackParamList = {
  QuranList: undefined;
  SurahDetailScreen: {
    surahNumber: number;
    surahName: string;
    totalAyahs: number;
  };
};

const QuranScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<QuranStackParamList>>();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = new Animated.Value(0);
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');

  useEffect(() => {
    loadSurahs();
    loadIslamicDate();
    loadLocation();
  }, []);

  const loadSurahs = async () => {
    try {
      const data = await getSurahs();
      setSurahs(data);
      setFilteredSurahs(data);
    } catch (error) {
      console.error("Error loading surahs:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSurahPress = (surah: Surah) => {
    navigation.navigate("SurahDetailScreen", {
      surahNumber: surah.number,
      surahName: surah.englishName,
      totalAyahs: surah.numberOfAyahs,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = surahs.filter(surah => surah.name.toLowerCase().includes(query.toLowerCase()));
    setFilteredSurahs(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredSurahs(surahs);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>The Holy Quran</Text>
        <Text style={styles.headerSubtitle}>Read and listen to the Quran</Text>
      </LinearGradient>
    </View>
  );

  const renderSurahItem = ({ item, index }: { item: Surah; index: number }) => {
    const inputRange = [-1, 0, 100 * index, 100 * (index + 2)];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });

    return (
      <Animated.View
        style={[
          styles.surahCard,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.surahCardContent}
          onPress={() => handleSurahPress(item)}
        >
          <View style={styles.surahNumberContainer}>
            <Text style={styles.numberText}>{item.number}</Text>
          </View>
          <View style={styles.surahInfo}>
            <View>
              <Text style={styles.surahName}>{item.englishName}</Text>
              <Text style={styles.surahTranslation}>
                {item.englishNameTranslation}
              </Text>
            </View>
            <View style={styles.surahMetadata}>
              <Text style={styles.surahType}>{item.revelationType}</Text>
              <Text style={styles.versesCount}>{item.numberOfAyahs} verses</Text>
            </View>
          </View>
          <Text style={styles.arabicName}>{item.name}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Surahs...</Text>
      </View>
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
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
            <Ionicons name="search" size={20} color={'black'} />
            <TextInput
              style={[styles.searchInput, { color: 'black' }]}
              placeholder="Search Surah"
              placeholderTextColor={'black'}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={'black'} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Surah List */}
          <View style={styles.surahList}>
            {filteredSurahs.map((surah) => (
              <TouchableOpacity
                key={surah.number}
                style={[styles.surahItem, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}
                onPress={() => handleSurahPress(surah)}
              >
                <View style={styles.surahNumberContainer}>
                  <Text style={[styles.numberText, { color: 'black' }]}>
                    {surah.number}
                  </Text>
                </View>
                <View style={styles.surahInfo}>
                  <Text style={[styles.surahName, { color: 'black' }]}>
                    {surah.name}
                  </Text>
                  <Text style={[styles.surahDetails, { color: 'black' }]}>
                    {surah.englishName} • {surah.numberOfAyahs} Verses
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={'black'} />
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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
  },
  surahList: {
    padding: 16,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  surahNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: 'black',
  },
  surahDetails: {
    fontSize: 14,
    color: 'black',
  },
  header: {
    height: 140,
    marginBottom: 16,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.background,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  surahCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    ...SHADOWS.medium,
  },
  surahCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  surahTranslation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  surahMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahType: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  versesCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  arabicName: {
    fontSize: 24,
    color: COLORS.primary,
    fontFamily: 'Amiri-Regular',
  },
});

export default QuranScreen;
