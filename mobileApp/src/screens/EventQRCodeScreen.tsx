import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";
import { SafeAreaView } from 'react-native-safe-area-context';

const EventQRCodeScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'EventQRCode'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'EventQRCode'>['route']>();
  const { event, seatNumber, bookingDetails } = route.params;
  const { colors, isDarkMode } = useTheme();
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

  const generateQRData = () => {
    const qrData = {
      eventId: event.id,
      eventName: event.name,
      date: event.date,
      seatNumber,
      attendeeName: bookingDetails.name,
      bookingDate: new Date().toISOString(),
    };
    return JSON.stringify(qrData);
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
          showBackButton={true}
        />

        <View style={styles.content}>
          <View style={[styles.qrContainer, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
            <QRCode
              value={generateQRData()}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>

          <View style={[styles.detailsContainer, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
            <Text style={[styles.eventName, { color: 'black' }]}>{event.name}</Text>
            <Text style={[styles.date, { color: 'black' }]}>{event.date}</Text>
            <Text style={[styles.location, { color: 'black' }]}>{event.location}</Text>
            <Text style={[styles.seatNumber, { color: 'black' }]}>Seat: {seatNumber}</Text>
            <Text style={[styles.attendeeName, { color: 'black' }]}>Attendee: {bookingDetails.name}</Text>
          </View>

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}
            onPress={() => {
              // Implement download functionality
            }}
          >
            <Text style={[styles.downloadButtonText, { color: 'black' }]}>Download Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    marginBottom: 4,
  },
  seatNumber: {
    fontSize: 16,
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 16,
  },
  downloadButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventQRCodeScreen; 