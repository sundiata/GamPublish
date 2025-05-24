import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getPrayerTimes, getAllPrayers, Prayer, PrayerTimes } from '../services/api';

interface DisplayPrayer {
  id: string;
  name: string;
  time: string;
  icon: 'sunrise' | 'sun' | 'sunset' | 'moon';
}

const { width } = Dimensions.get('window');

const PrayerTimesScreen: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [nextPrayer, setNextPrayer] = useState({ name: 'Fajr', time: '05:00', remaining: '2h 30m' });
  const [prayers, setPrayers] = useState<DisplayPrayer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrayerTimes();
    fetchAllPrayers();
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const fetchAllPrayers = async () => {
    try {
      console.log('Fetching all prayers...');
      const response = await getAllPrayers();
      console.log('Prayers response:', response);
      
      // Transform API prayers into display format
      const displayPrayers: DisplayPrayer[] = response.prayers.map(prayer => ({
        id: prayer._id,
        name: prayer.title,
        time: prayer.time,
        icon: getPrayerIcon(prayer.category)
      }));

      setPrayers(displayPrayers);
    } catch (error) {
      console.error('Error fetching prayers:', error);
      setError('Failed to load prayers. Please try again.');
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
    setHijriDate('28 Rabi\'ul awal, 1445 H');
  };

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      setError(null);
      const times = await getPrayerTimes();
      console.log('Fetched prayer times:', times);
      setPrayerTimes(times);
      updateNextPrayer(times);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      setError('Failed to load prayer times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateNextPrayer = (times: PrayerTimes) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.location}>Gambia, Kanifing Layout</Text>
            <Text style={styles.date}>{currentDate}</Text>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.background} />
          </TouchableOpacity>
        </View>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading prayer times...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchPrayerTimes}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : prayerTimes ? (
          Object.entries(prayerTimes).map(([name, time]) => (
            <View key={name} style={styles.prayerItem}>
              <View style={styles.prayerItemLeft}>
                <View style={styles.iconContainer}>
                  <Feather 
                    name={getPrayerIcon(name)} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                </View>
                <View style={styles.prayerInfo}>
                  <Text style={styles.prayerName}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
                  <Text style={styles.prayerTime}>{time}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons 
                  name="notifications-outline" 
                  size={22} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
          ))
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  location: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.background,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.background,
    opacity: 0.9,
    marginBottom: 2,
  },
  hijriDate: {
    fontSize: 14,
    color: COLORS.background,
    opacity: 0.8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPrayerCard: {
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  nextPrayerContent: {
    padding: 20,
    alignItems: 'center',
  },
  nextPrayerLabel: {
    fontSize: 14,
    color: COLORS.background,
    opacity: 0.9,
    marginBottom: 8,
  },
  nextPrayerName: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.background,
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 8,
  },
  remainingTime: {
    fontSize: 16,
    color: COLORS.background,
    opacity: 0.9,
  },
  prayerList: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  prayerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  prayerInfo: {
    flex: 1,
    marginRight: 12,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PrayerTimesScreen;
