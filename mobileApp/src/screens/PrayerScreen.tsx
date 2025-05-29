import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import axios from 'axios';

// Import local images
const defaultImage = require('../assets/hussary.jpg');

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

const PrayerScreen = ({ navigation }) => {
  const [currentPrayer, setCurrentPrayer] = useState<Prayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prayers on mount
  useEffect(() => {
    fetchPrayers();
  }, []);

  // Fetch prayers from API
  const fetchPrayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<Prayer[]>(`${API_URL}/prayers`);
      console.log(response.data);
      
      if (response.data) {
        // Sort prayers by time
        const sortedPrayers = response.data.sort((a, b) => {
          return a.time.localeCompare(b.time);
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

  // Render prayer item
  const renderPrayerItem = ({ item }: { item: Prayer }) => {
    return (
      <TouchableOpacity 
        style={styles.prayerItem}
        onPress={() => {
          setCurrentPrayer(item);
          setIsModalVisible(true);
        }}
      >
        <Image 
          source={defaultImage} 
          style={styles.prayerImage}
        />
        <View style={styles.prayerInfo}>
          <Text style={styles.prayerTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.prayerCategory} numberOfLines={1}>{item.category}</Text>
          <Text style={styles.prayerTime}>{item.time}</Text>
        </View>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => {
            setCurrentPrayer(item);
            setIsModalVisible(true);
          }}
        >
          <Ionicons 
            name="information-circle" 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render the modal
  const renderPrayerModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setIsModalVisible(false)}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        {currentPrayer && (
          <View style={styles.modalContent}>
            <Image 
              source={defaultImage} 
              style={styles.modalImage}
            />
            <Text style={styles.modalTitle}>{currentPrayer.title}</Text>
            <Text style={styles.modalSubtitle}>Hallo worls</Text>
            <Text style={styles.modalSubtitle}>{currentPrayer.category}</Text>
            <Text style={styles.modalTime}>Time: {currentPrayer.time}</Text>
            <Text style={styles.modalDescription}>{currentPrayer.description}</Text>
            <Text style={styles.modalDate}>
              Date: {new Date(currentPrayer.date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time" size={50} color="black" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Prayer Times</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Prayer Times List */}
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.prayersContainer}>
              {prayers.map((item) => (
                <TouchableOpacity 
                  key={item._id}
                  style={styles.prayerItem}
                  onPress={() => {
                    setCurrentPrayer(item);
                    setIsModalVisible(true);
                  }}
                >
                  <Image 
                    source={defaultImage} 
                    style={styles.prayerImage}
                  />
                  <View style={styles.prayerInfo}>
                    <Text style={styles.prayerTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.prayerCategory} numberOfLines={1}>{item.category}</Text>
                    <Text style={styles.prayerTime}>{item.time}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => {
                      setCurrentPrayer(item);
                      setIsModalVisible(true);
                    }}
                  >
                    <Ionicons 
                      name="information-circle" 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {renderPrayerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  contentContainer: {
    flex: 1,
    marginTop: 25,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'rgba(241, 236, 236, 0.93)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    zIndex: 1,
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  prayerImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  prayerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  prayerCategory: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 12,
    color: '#000000',
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    ...SHADOWS.medium,
  },
  prayersContainer: {
    paddingHorizontal: 16,
  },
  modalTime: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
});

export default PrayerScreen; 