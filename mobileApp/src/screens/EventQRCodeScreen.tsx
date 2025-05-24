import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';
import { COLORS } from '../constants/theme';

const EventQRCodeScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'EventQRCode'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'EventQRCode'>['route']>();
  const { event, seatNumber, bookingDetails } = route.params;

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Confirmation</Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={generateQRData()}
          size={200}
          backgroundColor="white"
          color={COLORS.primary}
        />
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.date}>{event.date}</Text>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.seatNumber}>Seat: {seatNumber}</Text>
        <Text style={styles.attendeeName}>Attendee: {bookingDetails.name}</Text>
      </View>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => {
          // Implement download functionality
        }}
      >
        <Text style={styles.downloadButtonText}>Download Ticket</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  seatNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  attendeeName: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventQRCodeScreen; 