import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  islamicDate: string;
  location: string;
  onNotificationPress: () => void;
  showBackButton?: boolean;
  isLoadingLocation?: boolean;
  onLocationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  islamicDate,
  location,
  onNotificationPress,
  showBackButton = false,
  isLoadingLocation = false,
  onLocationPress,
}) => {
  const navigation = useNavigation();

  const isLocationLoading = location === 'Loading location...' || isLoadingLocation;
  const isLocationError = location === 'Please enable location services' || 
                         location === 'Location permission denied' || 
                         location === 'Location unavailable';

  return (
    <View style={styles.header}>
      <StatusBar 
        barStyle="dark-content"
        translucent={true}
        backgroundColor="transparent"
      />
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
        ) : (
          <View style={styles.dateLocationContainer}>
            <Text style={styles.islamicDate}>{islamicDate}</Text>
            {isLocationLoading ? (
              <View style={styles.locationLoading}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.locationText}>Loading location...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={isLocationError ? onLocationPress : undefined}
                style={isLocationError ? styles.locationError : undefined}
              >
                <Text 
                  style={[
                    styles.location, 
                    isLocationError && styles.locationErrorText
                  ]} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {location || 'Location not available'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginTop: Platform.OS === 'android' ? -10 : -40,
  },
  dateLocationContainer: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  islamicDate: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif',
        marginTop: 2,
      },
    }),
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      android: {
        marginTop: 2,
      },
    }),
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  locationError: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationErrorText: {
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
});

export default Header; 