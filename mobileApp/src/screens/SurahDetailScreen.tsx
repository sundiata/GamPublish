"use client";

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getSurah } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";

const { width } = Dimensions.get('window');

type Verse = {
  number: number;
  text: string;
  translation: string;
};

const SurahDetailScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'SurahDetailScreen'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'SurahDetailScreen'>['route']>();
  const { surahNumber, surahName, totalAyahs } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVerses, setExpandedVerses] = useState<Set<number>>(new Set());
  const { colors, isDarkMode } = useTheme();
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');

  useEffect(() => {
    loadSurahDetails();
    loadIslamicDate();
    loadLocation();
  }, []);

  const loadSurahDetails = async () => {
    try {
      const arabicData = await getSurah(surahNumber, "quran-uthmani");
      const translationData = await getSurah(surahNumber, "en.asad");
      
      if (arabicData?.ayahs && translationData?.ayahs) {
        const formattedVerses = arabicData.ayahs.map((ayah, index) => ({
          number: ayah.number,
          text: ayah.text,
          translation: translationData.ayahs[index]?.text || '',
        }));
        setVerses(formattedVerses);
      }
    } catch (error) {
      console.error('Error loading surah details:', error);
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

  const toggleVerseTranslation = (verseNumber: number) => {
    setExpandedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseNumber)) {
        newSet.delete(verseNumber);
      } else {
        newSet.add(verseNumber);
      }
      return newSet;
    });
  };

  const renderVerse = ({ item }: { item: Verse }) => (
    <View style={styles.verseContainer}>
      <View style={styles.verseHeader}>
        <View style={styles.verseNumber}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <TouchableOpacity
          style={[styles.translationToggle, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}
          onPress={() => toggleVerseTranslation(item.number)}
        >
          <Ionicons 
            name={expandedVerses.has(item.number) ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color={'black'} 
          />
          <Text style={[styles.toggleText, { color: 'black' }]}>
            {expandedVerses.has(item.number) ? 'Hide Translation' : 'Show Translation'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.verseContent}>
        <Text style={styles.arabicText}>{item.text}</Text>
        {expandedVerses.has(item.number) && (
          <View style={styles.translationContainer}>
            <Text style={styles.translationText}>{item.translation}</Text>
          </View>
        )}
      </View>
      <View style={styles.verseActions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
          <Ionicons name="play" size={20} color={'black'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
          <Ionicons name="bookmark-outline" size={20} color={'black'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
          <Ionicons name="share-outline" size={20} color={'black'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.text} />
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
            console.log('Notification pressed');
          }}
          showBackButton={true}
        />

        

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
           
            <View style={styles.surahInfo}>
              <Text style={[styles.surahName, { color: 'black' }]}>{surahName}</Text>
              <Text style={[styles.verseCount, { color: 'black' }]}>{totalAyahs} Verses</Text>
            </View>
          </View>


          {verses.map((verse) => (
            <View key={verse.number}>
              {renderVerse({ item: verse })}
            </View>
          ))}
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
    bottom: 45,
  },
  listContainer: {
    padding: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 8,
  },
  surahInfo: {
    alignItems: 'center',
  },
  surahName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  verseCount: {
    fontSize: 16,
    opacity: 0.7,
    color: 'black',
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: 'black',
  },
  verseContainer: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  verseContent: {
    flex: 1,
  },
  arabicText: {
    fontSize: 26,
    lineHeight: 45,
    marginBottom: 16,
    color: 'black',
    textAlign: 'right',
    fontFamily: 'Amiri-Regular',
  },
  translationContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  translationText: {
    fontSize: 16,
    lineHeight: 26,
    color: 'black',
    opacity: 0.8,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default SurahDetailScreen;
