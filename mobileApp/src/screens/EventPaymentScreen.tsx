import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackScreenProps } from '../types/navigation';

const EventPaymentScreen = () => {
  const navigation = useNavigation<RootStackScreenProps<'EventPayment'>['navigation']>();
  const route = useRoute<RootStackScreenProps<'EventPayment'>['route']>();
  const { event, seatNumber } = route.params;

  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  const handlePaymentComplete = () => {
    navigation.navigate('EventQRCode', {
      event,
      seatNumber,
      bookingDetails,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Booking</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventDate}>{event.date}</Text>
          <Text style={styles.seatNumber}>Seat: {seatNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={bookingDetails.name}
            onChangeText={(text) => setBookingDetails(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={bookingDetails.email}
            onChangeText={(text) => setBookingDetails(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={bookingDetails.phone}
            onChangeText={(text) => setBookingDetails(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'card' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card" size={24} color={paymentMethod === 'card' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.paymentMethodText, paymentMethod === 'card' && styles.selectedPaymentText]}>
                Credit/Debit Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paymentMethod, paymentMethod === 'mobile' && styles.selectedPayment]}
              onPress={() => setPaymentMethod('mobile')}
            >
              <Ionicons name="phone-portrait" size={24} color={paymentMethod === 'mobile' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.paymentMethodText, paymentMethod === 'mobile' && styles.selectedPaymentText]}>
                Mobile Money
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.payButton}
          onPress={handlePaymentComplete}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.background,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  eventInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  seatNumber: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  selectedPayment: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  paymentMethodText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectedPaymentText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventPaymentScreen; 