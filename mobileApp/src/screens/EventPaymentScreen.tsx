import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import * as Location from "expo-location";
import { fetchIslamicDate } from "../services/api";

const EventPaymentScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'EventPayment'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'EventPayment'>['route']>();
  const { event, seatNumber } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');

  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');

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

  const handlePaymentComplete = () => {
    navigation.navigate('EventQRCode', {
      event,
      seatNumber,
      bookingDetails,
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
          showBackButton={true}
        />

        <ScrollView style={styles.content}>
          <View style={[styles.eventInfo, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
            <Text style={[styles.eventName, { color: 'black' }]}>{event.name}</Text>
            <Text style={[styles.eventDate, { color: 'black' }]}>{event.date}</Text>
            <Text style={[styles.seatNumber, { color: 'black' }]}>Seat: {seatNumber}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: 'black' }]}>Personal Information</Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(0, 0, 0, 0.1)', color: 'black' }]}
              placeholder="Full Name"
              placeholderTextColor={'black'}
              value={bookingDetails.name}
              onChangeText={(text) => setBookingDetails(prev => ({ ...prev, name: text }))}
            />
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(0, 0, 0, 0.1)', color: 'black' }]}
              placeholder="Email"
              placeholderTextColor={'black'}
              value={bookingDetails.email}
              onChangeText={(text) => setBookingDetails(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(0, 0, 0, 0.1)', color: 'black' }]}
              placeholder="Phone Number"
              placeholderTextColor={'black'}
              value={bookingDetails.phone}
              onChangeText={(text) => setBookingDetails(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: 'black' }]}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity 
                style={[
                  styles.paymentMethod, 
                  { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                  paymentMethod === 'card' && { borderColor: 'black', borderWidth: 1 }
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <Ionicons name="card" size={24} color={'black'} />
                <Text style={[styles.paymentMethodText, { color: 'black' }]}>
                  Credit/Debit Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.paymentMethod, 
                  { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
                  paymentMethod === 'mobile' && { borderColor: 'black', borderWidth: 1 }
                ]}
                onPress={() => setPaymentMethod('mobile')}
              >
                <Ionicons name="phone-portrait" size={24} color={'black'} />
                <Text style={[styles.paymentMethodText, { color: 'black' }]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.payButton, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}
            onPress={handlePaymentComplete}
          >
            <Text style={[styles.payButtonText, { color: 'black' }]}>Pay Now</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  eventInfo: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    marginBottom: 4,
  },
  seatNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
  },
  payButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventPaymentScreen; 