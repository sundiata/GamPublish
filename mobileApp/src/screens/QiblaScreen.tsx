import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const QiblaScreen = () => {
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Kaaba coordinates (Makkah)
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Start watching heading
      Location.watchHeadingAsync((heading) => {
        setHeading(heading.magHeading);
      });
    })();
  }, []);

  const calculateQiblaDirection = () => {
    if (!location) return 0;

    const { latitude, longitude } = location.coords;
    const lat1 = latitude * Math.PI / 180;
    const lat2 = KAABA_LAT * Math.PI / 180;
    const lng1 = longitude * Math.PI / 180;
    const lng2 = KAABA_LNG * Math.PI / 180;

    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    let qiblaDirection = Math.atan2(y, x) * 180 / Math.PI;
    
    // Adjust for compass heading
    qiblaDirection = (qiblaDirection + 360) % 360;
    return qiblaDirection;
  };

  const qiblaDirection = calculateQiblaDirection();
  const rotation = qiblaDirection - heading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Qibla Direction</Text>
      </View>

      <View style={styles.compassContainer}>
        <View style={styles.compass}>
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
          <Image
            source={require('../assets/kompas.png')} // Compass image
            style={[
              styles.compassImage,
              { transform: [{ rotate: `${-rotation}deg` }] }
            ]}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
          <View style={styles.arrowContainer}>
            <Image
              source={{ uri: 'https://shop.signbox.co.uk/uploads/assets/2018%20-%20Assets/INTERIOR/qibla-sticker-sign-signbox-design-3.jpg' }} // Qibla arrow image
              style={styles.qiblaArrow}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.directionText}>
          {errorMsg || `Qibla Direction: ${Math.round(qiblaDirection)}°`}
        </Text>
        <Text style={styles.instructionText}>
          Point your device towards the Kaaba in Makkah
        </Text>
        {imageError && (
          <Text style={styles.errorText}>
            Error loading images. Please check your internet connection.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    alignItems: 'center',
  },
  title: {
    color: COLORS.background,
    fontSize: SIZES.h2,
    fontWeight: 'bold',
  },
  compassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compass: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
  },
  compassImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qiblaArrow: {
    width: width * 0.2,
    height: width * 0.2,
    resizeMode: 'contain',
  },
  infoContainer: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  directionText: {
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  instructionText: {
    fontSize: SIZES.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.body2,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
});

export default QiblaScreen; 