import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Share, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';

const EventQRCodeScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'EventQRCode'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'EventQRCode'>['route']>();
  const { event, seatNumber, bookingDetails } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');
  const [isDownloading, setIsDownloading] = useState(false);
  const viewShotRef = React.useRef<ViewShot>(null);

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

  const handleDownloadTicket = async () => {
    try {
      setIsDownloading(true);
      
      if (!viewShotRef.current) {
        throw new Error('ViewShot reference not found');
      }

      // Capture the ticket view
      const uri = await viewShotRef.current.capture();
      
      // Create a temporary file name
      const fileName = `ticket_${event.id}_${seatNumber}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Copy the captured image to the cache directory
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      // Share the ticket
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Download Event Ticket',
        UTI: 'public.png'
      });

    } catch (error) {
      console.error('Error downloading ticket:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDownloading(false);
    }
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
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1,
              result: 'tmpfile'
            }}
            style={styles.ticketContainer}
          >
            <View style={[styles.ticket, { backgroundColor: 'white' }]}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle}>Event Ticket</Text>
              </View>
              
              <View style={styles.qrContainer}>
                <QRCode
                  value={generateQRData()}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>

              <View style={styles.detailsContainer}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.date}>{event.date}</Text>
                <Text style={styles.location}>{event.location}</Text>
                <Text style={styles.seatNumber}>Seat: {seatNumber}</Text>
                <Text style={styles.attendeeName}>Attendee: {bookingDetails.name}</Text>
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: '#4A90E2' }]}
            onPress={handleDownloadTicket}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.downloadButtonContent}>
                <Ionicons name="download-outline" size={20} color="white" style={styles.downloadIcon} />
                <Text style={styles.downloadButtonText}>Download Ticket</Text>
              </View>
            )}
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
  ticketContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ticket: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ticketHeader: {
    marginBottom: 20,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  date: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  location: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  seatNumber: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  attendeeName: {
    fontSize: 16,
    color: '#666',
  },
  downloadButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  downloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    marginRight: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default EventQRCodeScreen; 