import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";

const { width } = Dimensions.get('window');

// Import local images
const ramadanImage = require('../assets/maher.jpeg');
const eidFitrImage = require('../assets/maher.jpeg');
const eidAdhaImage = require('../assets/maher.jpeg');

const islamicEvents = [
  {
    id: 1,
    name: 'Ramadan',
    date: 'March 10, 2024',
    hijriDate: '1 Ramadan 1445',
    description: 'Join us for the blessed month of Ramadan. Special Taraweeh prayers and Iftar gatherings daily.',
    daysUntil: 30,
    image: ramadanImage,
    location: 'Central Mosque, Banjul',
    availableSeats: 200,
    price: 'Free',
  },
  {
    id: 2,
    name: 'Eid al-Fitr Celebration',
    date: 'April 9, 2024',
    hijriDate: '1 Shawwal 1445',
    description: 'Community Eid celebration with special prayers, activities for children, and communal feast.',
    daysUntil: 60,
    image: eidFitrImage,
    location: 'Eid Prayer Ground, Serekunda',
    availableSeats: 500,
    price: 'Free',
  },
  {
    id: 3,
    name: 'Eid al-Adha Festival',
    date: 'June 16, 2024',
    hijriDate: '10 Dhul Hijjah 1445',
    description: 'Join the community for Eid prayers and the traditional sacrifice ceremony.',
    daysUntil: 128,
    image: eidAdhaImage,
    location: 'Main Prayer Ground, Brikama',
    availableSeats: 300,
    price: 'Free',
  },
];

const IslamicEventsScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState(islamicEvents);
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');

  useEffect(() => {
    loadIslamicDate();
    loadLocation();
  }, []);

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

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredEvents(islamicEvents);
    } else {
      const filtered = islamicEvents.filter(event => 
        event.name.toLowerCase().includes(text.toLowerCase()) ||
        event.description.toLowerCase().includes(text.toLowerCase()) ||
        event.location.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleBooking = (event) => {
    // Generate a random seat number
    const seatNumber = Math.floor(Math.random() * event.availableSeats) + 1;
    navigation.navigate('EventPayment', {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        image: event.image
      },
      seatNumber: `SEAT-${seatNumber}`,
    });
  };

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
        />

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={'black'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: 'black' }]}
            placeholder="Search events..."
            placeholderTextColor={'black'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setFilteredEvents(islamicEvents);
              }}
            >
              <Ionicons name="close-circle" size={20} color={'black'} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredEvents.map((event) => (
            <View key={event.id} style={[styles.eventCard, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
              <Image 
                source={event.image} 
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View>
                    <Text style={[styles.eventName, { color: 'black' }]}>{event.name}</Text>
                    <Text style={[styles.eventDate, { color: 'black' }]}>{event.date}</Text>
                    <Text style={[styles.hijriDate, { color: 'black' }]}>{event.hijriDate}</Text>
                  </View>
                  <View style={styles.daysContainer}>
                    <Text style={[styles.daysNumber, { color: 'black' }]}>{event.daysUntil}</Text>
                    <Text style={[styles.daysText, { color: 'black' }]}>days left</Text>
                  </View>
                </View>
                <Text style={[styles.eventDescription, { color: 'black' }]}>{event.description}</Text>
                <View style={styles.eventFooter}>
                  <TouchableOpacity style={[styles.reminderButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
                    <Ionicons name="notifications-outline" size={20} color={'black'} />
                    <Text style={[styles.reminderText, { color: 'black' }]}>Remind me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bookingButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}
                    onPress={() => handleBooking(event)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={'black'} />
                    <Text style={[styles.bookingText, { color: 'black' }]}>Book Seat</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventCard: {
    borderRadius: 15,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  hijriDate: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  daysContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
  },
  daysNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  daysText: {
    fontSize: 12,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  reminderText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  bookingText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default IslamicEventsScreen; 