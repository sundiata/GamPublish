import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Dimensions, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

const AudioDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showAlbumTracks, setShowAlbumTracks] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  
  // Sample tracks from the same reciter (in a real app, these would come from an API)
  const albumTracks = [
    { id: '1', title: 'Surah Al-Fatiha', reciter: item.reciter, image: item.image },
    { id: '2', title: 'Surah Al-Baqarah', reciter: item.reciter, image: item.image },
    { id: '3', title: 'Surah Al-Imran', reciter: item.reciter, image: item.image },
    { id: '4', title: 'Surah An-Nisa', reciter: item.reciter, image: item.image },
    { id: '5', title: 'Surah Al-Ma\'idah', reciter: item.reciter, image: item.image },
    { id: '6', title: 'Surah Al-An\'am', reciter: item.reciter, image: item.image },
    { id: '7', title: 'Surah Al-A\'raf', reciter: item.reciter, image: item.image },
  ];

  useEffect(() => {
    loadAudio();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentItem]); // Reload audio when current item changes

  const loadAudio = async () => {
    try {
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      setIsLoading(true);
      setLoadError(false);
      
      // Use a reliable MP3 file from a CDN for testing
      // In production, you would use your actual audio file URL
      const audioSources = [
        'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3', // Primary source - Al-Fatiha by Mishary Rashid Alafasy
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Fallback source
        'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav' // Second fallback (WAV format)
      ];
      
      let newSound = null;
      
      // Try each audio source until one works
      for (const audioUrl of audioSources) {
        try {
          console.log(`Attempting to load audio from: ${audioUrl}`);
          
          // Configure audio mode first
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: false },
            onPlaybackStatusUpdate
          );
          
          newSound = sound;
          console.log('Audio loaded successfully');
          break; // Exit the loop if we successfully loaded the sound
        } catch (error) {
          console.log(`Error loading audio source ${audioUrl}:`, error);
          // Continue to the next source
        }
      }
      
      if (newSound) {
        setSound(newSound);
        setIsLoading(false);
      } else {
        console.error('All audio sources failed to load');
        Alert.alert(
          'Audio Error',
          'Could not load audio. Please try again later.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        setLoadError(true);
      }
    } catch (error) {
      console.error('Error in audio loading function:', error);
      Alert.alert(
        'Audio Error',
        'Could not load audio. Please try again later.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
      setLoadError(true);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const playPause = async () => {
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const skipForward = async () => {
    if (!sound) return;
    
    const newPosition = Math.min(position + 10000, duration);
    await sound.setPositionAsync(newPosition);
  };

  const skipBackward = async () => {
    if (!sound) return;
    
    const newPosition = Math.max(position - 10000, 0);
    await sound.setPositionAsync(newPosition);
  };

  const onSliderValueChange = async (value) => {
    if (!sound) return;
    
    await sound.setPositionAsync(value);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle track selection from the album
  const selectTrack = (selectedItem) => {
    setCurrentItem(selectedItem);
    setShowAlbumTracks(false);
  };
  
  // Render album track item
  const renderTrackItem = ({ item: trackItem }) => (
    <TouchableOpacity 
      style={[
        styles.trackItem, 
        currentItem.id === trackItem.id && styles.selectedTrackItem
      ]}
      onPress={() => selectTrack(trackItem)}
    >
      <Image source={trackItem.image} style={styles.trackItemImage} />
      <View style={styles.trackItemInfo}>
        <Text style={styles.trackItemTitle}>{trackItem.title}</Text>
        <Text style={styles.trackItemSubtitle}>{trackItem.reciter}</Text>
      </View>
      {currentItem.id === trackItem.id && (
        <View style={styles.nowPlayingIndicator}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={COLORS.accent1} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.accent1} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Now Playing</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.accent1} />
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Image source={currentItem.image} style={styles.coverArt} />
        
        <View style={styles.trackInfoContainer}>
          <Text style={styles.trackTitle}>{currentItem.title}</Text>
          <Text style={styles.reciterName}>{currentItem.reciter}</Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent1} />
              <Text style={styles.loadingText}>Loading audio...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load audio</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAudio}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onSlidingComplete={onSliderValueChange}
                minimumTrackTintColor={COLORS.accent1}
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={COLORS.accent2}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </>
          )}
        </View>
        
        {/* Playback Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.secondaryControl} onPress={skipBackward}>
            <Ionicons name="play-skip-back" size={22} color={COLORS.accent1} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryControl} onPress={playPause}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryControl} onPress={skipForward}>
            <Ionicons name="play-skip-forward" size={22} color={COLORS.accent1} />
          </TouchableOpacity>
        </View>
        
        {/* Additional Controls */}
        <View style={styles.additionalControlsContainer}>
          <TouchableOpacity style={styles.iconButtonContainer}>
            <Ionicons name="heart-outline" size={22} color={COLORS.accent1} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButtonContainer}
            onPress={() => setShowAlbumTracks(!showAlbumTracks)}
          >
            <Ionicons 
              name={showAlbumTracks ? "list" : "list-outline"} 
              size={22} 
              color={showAlbumTracks ? COLORS.accent2 : COLORS.accent1} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonContainer}>
            <Ionicons name="share-outline" size={22} color={COLORS.accent1} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonContainer}>
            <Ionicons name="download-outline" size={22} color={COLORS.accent1} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Album Tracks Bottom Sheet */}
      {showAlbumTracks && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>More from {currentItem.reciter}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAlbumTracks(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={albumTracks}
            renderItem={renderTrackItem}
            keyExtractor={item => item.id}
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 25,
    ...SHADOWS.medium,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 25,
    ...SHADOWS.medium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  coverArt: {
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').width * 0.7,
    borderRadius: 20,
    marginTop: 30,
    ...SHADOWS.dark,
  },
  trackInfoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  reciterName: {
    color: COLORS.accent2,
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  progressContainer: {
    width: '90%',
    marginTop: 20,
    backgroundColor: COLORS.cardBackground,
    padding: 15,
    borderRadius: 15,
    ...SHADOWS.medium,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: -10,
  },
  timeText: {
    color: COLORS.accent2,
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryControl: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.accent1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    ...SHADOWS.dark,
  },
  secondaryControl: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  additionalControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  iconButtonContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '70%',
    ...SHADOWS.dark,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...SHADOWS.medium,
  },
  trackList: {
    paddingHorizontal: 24,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 10,
    ...SHADOWS.light,
  },
  selectedTrackItem: {
    backgroundColor: COLORS.accent1,
  },
  trackItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  trackItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  trackItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  trackItemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  nowPlayingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accent2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.accent1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
});

export default AudioDetailScreen; 