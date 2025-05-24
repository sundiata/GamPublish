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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getSurah } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../types/navigation';

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

  useEffect(() => {
    loadSurahDetails();
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

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.surahName}>{surahName}</Text>
          <Text style={styles.verseCount}>{totalAyahs} Verses</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderVerse = ({ item }: { item: Verse }) => (
    <View style={styles.verseCard}>
      <View style={styles.verseNumberContainer}>
        <Text style={styles.verseNumber}>{item.number}</Text>
      </View>
      <View style={styles.verseContent}>
        <Text style={styles.arabicText}>{item.text}</Text>
        <Text style={styles.translationText}>{item.translation}</Text>
      </View>
      <View style={styles.verseActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="play" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Surah...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {verses.map((verse) => renderVerse({ item: verse }))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 160,
    width: '100%',
    marginTop: -60,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  surahName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: 8,
  },
  verseCount: {
    fontSize: 16,
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
  },
  verseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  verseNumberContainer: {
    position: 'absolute',
    top: -12,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  verseContent: {
    padding: 16,
    paddingTop: 24,
  },
  arabicText: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
    fontFamily: 'Amiri-Regular',
    lineHeight: 40,
  },
  translationText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textSecondary}15`,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SurahDetailScreen;
