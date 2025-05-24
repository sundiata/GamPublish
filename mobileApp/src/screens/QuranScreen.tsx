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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import { getSurahs, Surah } from "../services/api";
import { LinearGradient } from "expo-linear-gradient";

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

  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = async () => {
    try {
      const data = await getSurahs();
      setSurahs(data);
    } catch (error) {
      console.error("Error loading surahs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahPress = (surah: Surah) => {
    navigation.navigate("SurahDetailScreen", {
      surahNumber: surah.number,
      surahName: surah.englishName,
      totalAyahs: surah.numberOfAyahs,
    });
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
            <Text style={styles.surahNumber}>{item.number}</Text>
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
    <View style={styles.container}>
      {renderHeader()}
      <Animated.FlatList
        data={surahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  surahNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  surahNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
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
