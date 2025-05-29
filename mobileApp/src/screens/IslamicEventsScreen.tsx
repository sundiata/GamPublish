import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import Header from '../components/Header';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  EventPayment: {
    event: {
      id: string;
      name: string;
      date: string;
      location: string;
      image: any;
    };
    seatNumber: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// API URL based on platform
const API_URL = Platform.select({
  ios: 'http://127.0.0.1:4001/api',
  android: 'http://10.0.2.2:4001/api',
  default: 'http://127.0.0.1:4001/api'
});

// Default image for events
const DEFAULT_EVENT_IMAGE = 'https://via.placeholder.com/400x200?text=Islamic+Event';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image: string;
  price: number;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  organizer: string;
  attendees: string[];
  createdAt: string;
  updatedAt: string;
}

interface EventResponse {
  status: string;
  data: {
    currentPage: number;
    events: Event[];
    total: number;
    totalPages: number;
  };
}

export default function IslamicEventsScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [islamicDate, setIslamicDate] = useState('');
  const [location, setLocation] = useState('Loading location...');
  const [imageLoadErrors, setImageLoadErrors] = useState<{ [key: string]: boolean }>({});
  const [isBooking, setIsBooking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<EventResponse>(`${API_URL}/events`);
      
      if (response.data.status === 'success' && response.data.data.events) {
        // Sort events by date
        const sortedEvents = response.data.data.events.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        setEvents(sortedEvents);
      } else {
        setError('Failed to load events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageError = (eventId: string) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [eventId]: true
    }));
  };

  const renderEventImage = (event: Event) => {
    const imageUrl = event.image 
      ? `http://127.0.0.1:4001${event.image}`
      : DEFAULT_EVENT_IMAGE;

    return (
      <View style={styles.imageContainer}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.eventImage}
          resizeMode="cover"
          onError={() => handleImageError(event._id)}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          >
            <View style={styles.eventBadges}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{event.category}</Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: event.status === 'upcoming' ? '#4CAF50' : 
                               event.status === 'ongoing' ? '#2196F3' : '#9E9E9E'
              }]}>
                <Text style={styles.badgeText}>{event.status}</Text>
              </View>
            </View>
            <View style={styles.seatsContainer}>
              <Ionicons name="people-outline" size={16} color="white" />
              <Text style={styles.seatsText}>
                {event.capacity - event.attendees.length} seats left
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const handleBookSeat = async (event: Event) => {
    try {
      setIsBooking(prev => ({ ...prev, [event._id]: true }));
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      navigation.navigate('EventPayment', {
        event: {
          id: event._id,
          name: event.title,
          date: event.date,
          location: event.location,
          image: event.image
        },
        seatNumber: '1'
      });
    } finally {
      setIsBooking(prev => ({ ...prev, [event._id]: false }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          islamicDate={islamicDate}
          location={location}
          onNotificationPress={() => {}}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading events...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        islamicDate={islamicDate}
        location={location}
        onNotificationPress={() => {}}
      />
      <ScrollView style={styles.scrollView}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchEvents}
            >
              <Text style={[styles.retryButtonText, { color: colors.background }]}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {events.map((event) => (
              <View
                key={event._id}
                style={[styles.eventCard, { backgroundColor: colors.cardBackground }]}
              >
                {renderEventImage(event)}
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>
                    {event.title}
                  </Text>
                  <View style={styles.eventInfoRow}>
                    <View style={styles.eventInfoItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                        {formatDate(event.date)}
                      </Text>
                    </View>
                    <View style={styles.eventInfoItem}>
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.eventLocation, { color: colors.textSecondary }]}>
                        {event.location}
                      </Text>
                    </View>
                  </View>
                  <Text 
                    style={[styles.eventDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {event.description}
                  </Text>
                  <View style={styles.eventFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price</Text>
                      <Text style={[styles.priceText, { color: colors.primary }]}>
                        {formatPrice(event.price)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.bookButton, 
                        { 
                          opacity: isBooking[event._id] ? 0.7 : 1
                        }
                      ]}
                      onPress={() => handleBookSeat(event)}
                      disabled={isBooking[event._id]}
                    >
                      <LinearGradient
                        colors={['#4A90E2', '#357ABD']}
                        style={styles.bookButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isBooking[event._id] ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <View style={styles.bookButtonContent}>
                            <Ionicons name="ticket-outline" size={16} color="white" style={styles.bookButtonIcon} />
                            <Text style={[styles.bookButtonText, { color: 'white' }]}>
                              Book a Seat
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventsContainer: {
    padding: 16,
  },
  eventCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  eventBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  seatsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  seatsText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    fontSize: 14,
  },
  eventLocation: {
    fontSize: 14,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bookButton: {
    borderRadius: 12,
    minWidth: 140,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonIcon: {
    marginRight: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 