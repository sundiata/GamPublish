import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState(islamicEvents);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Islamic Events</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={COLORS.textSecondary}
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
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <Image 
              source={event.image} 
              style={styles.eventImage}
            />
            <View style={styles.eventContent}>
              <View style={styles.eventHeader}>
                <View>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.hijriDate}>{event.hijriDate}</Text>
                </View>
                <View style={styles.daysContainer}>
                  <Text style={styles.daysNumber}>{event.daysUntil}</Text>
                  <Text style={styles.daysText}>days left</Text>
                </View>
              </View>
              <Text style={styles.eventDescription}>{event.description}</Text>
              <View style={styles.eventFooter}>
                <TouchableOpacity style={styles.reminderButton}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.reminderText}>Remind me</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.bookingButton}
                  onPress={() => handleBooking(event)}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.background} />
                  <Text style={styles.bookingText}>Book Seat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.background,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  clearButton: {
    padding: 5,
  },
  eventsList: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: COLORS.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  hijriDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  daysContainer: {
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    padding: 8,
    borderRadius: 10,
  },
  daysNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  daysText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: `${COLORS.primary}10`,
    padding: 8,
    borderRadius: 8,
  },
  reminderText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
  },
  bookingText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.background,
    fontWeight: '500',
  },
});

export default IslamicEventsScreen; 