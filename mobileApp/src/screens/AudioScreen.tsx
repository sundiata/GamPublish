import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, StatusBar, ActivityIndicator, Modal, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { getAllTracks, getAllAlbums, API_URL, Track, Album, getMediaUrl } from '../services/api';
import fetch from 'node-fetch';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Import local images
const misharyImage = require('../assets/fattyima.jpg');
const maherImage = require('../assets/ukuk.jpg');
const sudaisImage = require('../assets/halal.jpeg');
const defaultImage = require('../assets/hussary.jpg');

// Track Types
interface RecitationItem {
  id: string;
  title: string;
  reciter: string;
  image: { uri: string };
  fileUrl: string;
  duration: string;
}

interface Category {
  id: string;
  title: string;
  items: RecitationItem[];
}

// Dummy data for testing
const dummyTracks = [
  {
    id: '1',
    title: 'Surah Al-Fatiha',
    reciter: 'Mishary Rashid Alafasy',
    image: { uri: 'https://i.ytimg.com/vi/7HXg7VvXxYc/maxresdefault.jpg' },
    fileUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
    duration: '3:45'
  },
  {
    id: '2',
    title: 'Surah Al-Baqarah',
    reciter: 'Abdul Rahman Al-Sudais',
    image: { uri: 'https://i.ytimg.com/vi/7HXg7VvXxYc/maxresdefault.jpg' },
    fileUrl: 'https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/002.mp3',
    duration: '45:20'
  },
  {
    id: '3',
    title: 'Surah Yasin',
    reciter: 'Saad Al-Ghamdi',
    image: { uri: 'https://i.ytimg.com/vi/7HXg7VvXxYc/maxresdefault.jpg' },
    fileUrl: 'https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/036.mp3',
    duration: '15:30'
  },
  {
    id: '4',
    title: 'Surah Ar-Rahman',
    reciter: 'Maher Al Muaiqly',
    image: { uri: 'https://i.ytimg.com/vi/7HXg7VvXxYc/maxresdefault.jpg' },
    fileUrl: 'https://download.quranicaudio.com/quran/maher_al_muaiqly/055.mp3',
    duration: '12:15'
  },
  {
    id: '5',
    title: 'Surah Al-Mulk',
    reciter: 'Abdul Basit',
    image: { uri: 'https://i.ytimg.com/vi/7HXg7VvXxYc/maxresdefault.jpg' },
    fileUrl: 'https://download.quranicaudio.com/quran/abdul_basit_murattal/067.mp3',
    duration: '8:45'
  }
];

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

// Add a purple accent color for the play button
const PURPLE = '#A259FF';

const AudioScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums'>('tracks');
  const [currentTrack, setCurrentTrack] = useState<RecitationItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tracks, setTracks] = useState<RecitationItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrackList, setShowTrackList] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const scrollY = useSharedValue(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [200, 100],
      Extrapolate.CLAMP
    );
    return { height };
  });

  // Setup audio with better error handling
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: 1, // DoNotMix
          interruptionModeAndroid: 1, // DoNotMix
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
        setError('Failed to initialize audio. Please restart the app.');
      }
    };

    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  // Enhanced playAudio function with better error handling
  const playAudio = async (item: RecitationItem) => {
    try {
      setIsBuffering(true);
      setPlaybackError(null);

      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Create and load the new sound with retry logic
      const loadSound = async (retryAttempt = 0) => {
        try {
          const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: item.fileUrl },
            { 
              shouldPlay: true,
              progressUpdateIntervalMillis: 1000,
              positionMillis: 0,
              volume: 1.0,
              rate: 1.0,
              shouldCorrectPitch: true,
            }
          );

          if (!status.isLoaded) {
            throw new Error('Failed to load audio');
          }

          setSound(newSound);
          setIsPlaying(true);
          setCurrentTrack({
            ...item,
            duration: getDurationFormatted(status.durationMillis || 0)
          });
          setIsModalVisible(true);
          setRetryCount(0);

          // Add playback status listener with error handling
          newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              const successStatus = status as AVPlaybackStatusSuccess;
              setIsBuffering(successStatus.isBuffering);
              setIsPlaying(successStatus.isPlaying);
              
              if (successStatus.didJustFinish) {
                setIsPlaying(false);
              }
            } else {
              console.error('Audio not loaded in status update:', status);
              setPlaybackError('Playback error occurred');
              setIsPlaying(false);
            }
          });

        } catch (error) {
          console.error(`Error loading sound (attempt ${retryAttempt + 1}):`, error);
          if (retryAttempt < MAX_RETRIES) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return loadSound(retryAttempt + 1);
          } else {
            throw new Error('Failed to load audio after multiple attempts');
          }
        }
      };

      await loadSound();

    } catch (error) {
      console.error('Error playing audio:', error);
      setPlaybackError('Failed to play audio. Please try again.');
      setIsPlaying(false);
      setCurrentTrack(null);
      
      Alert.alert(
        'Playback Error',
        'Failed to play audio. Please check your internet connection and try again.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } finally {
      setIsBuffering(false);
    }
  };

  // Enhanced togglePlayback with error handling
  const togglePlayback = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();

      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(!isPlaying);
      } else {
        throw new Error('Sound not loaded');
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setPlaybackError('Failed to control playback. Please try again.');
      Alert.alert(
        'Playback Error',
        'Failed to control playback. Please try again.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  };

  // Helper function to format duration
  const getDurationFormatted = (milliseconds: number) => {
    const minutes = milliseconds / 1000 / 60;
    const seconds = Math.round((minutes - Math.floor(minutes)) * 60);
    return seconds < 10 ? `${Math.floor(minutes)}:0${seconds}` : `${Math.floor(minutes)}:${seconds}`;
  };

  // Enhanced fetchTracks with retry logic
  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getAllTracks({
        page: 1,
        limit: 50,
        search: ''
      });
      
      if (!response || !response.data || !response.data.tracks) {
        throw new Error('Invalid response from API');
      }

      const processedTracks = response.data.tracks.map(track => ({
        id: track._id,
        title: track.title,
        reciter: track.artist,
        image: typeof track.coverImage === 'string' ? 
          { uri: getMediaUrl(track.coverImage) } : 
          track.coverImage || defaultImage,
        fileUrl: getMediaUrl(track.audioFile),
        duration: track.duration || '0:00'
      }));

      setTracks(processedTracks);
      setRetryCount(0);
    } catch (error) {
      console.error('Error in fetchTracks:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchTracks, 1000 * (retryCount + 1));
      } else {
        setError('Failed to load tracks. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fetchAlbums with retry logic
  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getAllAlbums();
      
      if (!response || !response.data || !response.data.albums) {
        throw new Error('Invalid response from API');
      }

      const processedAlbums = response.data.albums.map(album => ({
        ...album,
        coverImage: album.coverImage ? getMediaUrl(album.coverImage) : defaultImage,
        tracks: album.tracks.map(track => ({
          ...track,
          coverImage: track.coverImage ? getMediaUrl(track.coverImage) : defaultImage,
          audioFile: getMediaUrl(track.audioFile)
        }))
      }));

      setAlbums(processedAlbums);
      setRetryCount(0);
    } catch (error) {
      console.error('Error in fetchAlbums:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchAlbums, 1000 * (retryCount + 1));
      } else {
        setError('Failed to load albums. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchTracks();
    fetchAlbums();
  }, []);

  // Render loading state with better feedback
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>
        {retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRIES})` : 'Loading...'}
      </Text>
    </View>
  );

  // Render error state with retry option
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color={COLORS.error} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          setRetryCount(0);
          setIsLoading(true);
          activeTab === 'tracks' ? fetchTracks() : fetchAlbums();
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Render buffering indicator
  const renderBufferingIndicator = () => (
    isBuffering && (
      <View style={styles.bufferingContainer}>
        <ActivityIndicator size="small" color="white" />
        <Text style={styles.bufferingText}>Buffering...</Text>
      </View>
    )
  );

  // Render track item
  const renderTrackItem = ({ item }: { item: RecitationItem }) => {
    return (
      <TouchableOpacity 
        style={styles.trackItem}
        onPress={() => playAudio(item)}
      >
        <Image 
          source={item.image} 
          style={styles.trackImage}
          defaultSource={defaultImage}
        />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.reciter}</Text>
          <Text style={styles.trackDuration}>{item.duration}</Text>
        </View>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => playAudio(item)}
        >
          <Ionicons 
            name={currentTrack?.id === item.id && isPlaying ? "pause" : "play"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Handle track selection from list
  const handleTrackSelect = async (track: RecitationItem) => {
    try {
      // Stop current playback if any
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Set the new track and start playback
      setCurrentTrack(track);
      await playAudio(track);
    } catch (error) {
      console.error('Error selecting track:', error);
      setError('Failed to play selected track');
    }
  };

  // Render the audio player modal
  const renderAudioPlayerModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            setIsModalVisible(false);
            setShowTrackList(false);
            if (sound) {
              sound.stopAsync();
              setIsPlaying(false);
            }
          }}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        {currentTrack && (
          <View style={styles.modalContent}>
            <Image 
              source={currentTrack.image} 
              style={styles.modalImage}
              defaultSource={defaultImage}
            />
            <Text style={styles.modalTitle}>{currentTrack.title}</Text>
            <Text style={styles.modalSubtitle}>{currentTrack.reciter}</Text>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressTimeRow}>
                <Text style={styles.progressTime}>0:00</Text>
                <Text style={styles.progressTime}>{currentTrack.duration || '0:00'}</Text>
              </View>
              <View style={styles.progressBar} />
              {/* If you want a thumb, you can add a View with styles.progressThumb and position it based on progress */}
            </View>
            {/* Controls Row */}
            <View style={styles.modalControls}>
              <TouchableOpacity style={styles.modalSecondaryButton}>
                <Ionicons name="play-skip-back" size={24} style={styles.modalSecondaryIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalControlButton} onPress={togglePlayback}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={36} style={styles.modalControlIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSecondaryButton}>
                <Ionicons name="play-skip-forward" size={24} style={styles.modalSecondaryIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  // Render album item
  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity 
      style={styles.albumItem}
      onPress={() => setSelectedAlbum(item)}
    >
      <Image 
        source={{ uri: getMediaUrl(item.coverImage) }} 
        style={styles.albumImage}
        defaultSource={defaultImage}
      />
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle}>{item.title}</Text>
        <Text style={styles.albumArtist}>{item.artist}</Text>
        <Text style={styles.trackCount}>{item.tracks.length} tracks</Text>
      </View>
    </TouchableOpacity>
  );

  // Render album tracks modal
  const renderAlbumTracksModal = () => (
    <Modal
      visible={!!selectedAlbum}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSelectedAlbum(null)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedAlbum(null)}
          >
            <Ionicons name="close-circle" size={32} color={COLORS.primary} />
          </TouchableOpacity>

          {selectedAlbum && (
            <>
              <Image 
                source={{ uri: getMediaUrl(selectedAlbum.coverImage) }} 
                style={styles.modalImage}
                defaultSource={defaultImage}
              />
              <Text style={styles.modalTitle}>{selectedAlbum.title}</Text>
              <Text style={styles.modalSubtitle}>{selectedAlbum.artist}</Text>
              
              <FlatList
                data={selectedAlbum.tracks}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.trackListItem}
                    onPress={() => handleTrackSelect({
                      id: item._id,
                      title: item.title,
                      reciter: item.artist,
                      image: { uri: getMediaUrl(item.coverImage) },
                      fileUrl: getMediaUrl(item.audioFile),
                      duration: item.duration || '0:00'
                    })}
                  >
                    <Image 
                      source={{ uri: getMediaUrl(item.coverImage) }} 
                      style={styles.trackListItemImage}
                      defaultSource={defaultImage}
                    />
                    <View style={styles.trackListItemInfo}>
                      <Text style={styles.trackListItemTitle}>{item.title}</Text>
                      <Text style={styles.trackListItemArtist}>{item.artist}</Text>
                    </View>
                    <Text style={styles.trackListItemDuration}>{item.duration || '0:00'}</Text>
                    <TouchableOpacity style={styles.trackListItemPlay}>
                      <Ionicons name="play" size={20} color="black" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                style={styles.trackListContent}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.landingContainer}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="musical-notes" size={50} color="black" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>GamQuran</Text>
        </View>
        {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={22} color="#222" />
          </TouchableOpacity>
          <Image source={defaultImage} style={styles.headerAvatar} />
        </View> */}
      </View>

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Top Artist */}
          <Text style={styles.sectionTitle}>Top Reciers</Text>
          <FlatList
            data={tracks.slice(0, 5)}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            renderItem={({ item }) => (
              <View style={styles.artistCircleContainer}>
                <Image source={item.image} style={styles.artistCircle} />
                <Text style={styles.artistName} numberOfLines={1}>{item.reciter}</Text>
              </View>
            )}
          />

          {/* Tabs Section */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'tracks' && styles.activeTabButton]} 
              onPress={() => setActiveTab('tracks')}
            >
              <Text style={[styles.tabText, activeTab === 'tracks' && styles.activeTabText]}>
                Single Track
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'albums' && styles.activeTabButton]} 
              onPress={() => setActiveTab('albums')}
            >
              <Text style={[styles.tabText, activeTab === 'albums' && styles.activeTabText]}>
                Album
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'tracks' ? (
            <View style={styles.tracksContainer}>
              {tracks.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.trackItem}
                  onPress={() => {
                    setCurrentTrack(item);
                    setIsModalVisible(true);
                    playAudio(item);
                  }}
                >
                  <Image 
                    source={item.image} 
                    style={styles.trackImage}
                    defaultSource={defaultImage}
                  />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{item.reciter}</Text>
                    <Text style={styles.trackDuration}>{item.duration}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => {
                      setCurrentTrack(item);
                      setIsModalVisible(true);
                      playAudio(item);
                    }}
                  >
                    <Ionicons 
                      name={currentTrack?.id === item.id && isPlaying ? "pause" : "play"} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.albumsContainer}>
              {albums.map((album) => (
                <TouchableOpacity 
                  key={album._id}
                  style={styles.albumItem}
                  onPress={() => setSelectedAlbum(album)}
                >
                  <Image 
                    source={{ uri: getMediaUrl(album.coverImage) }} 
                    style={styles.albumImage}
                    defaultSource={defaultImage}
                  />
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                    <Text style={styles.albumArtist} numberOfLines={1}>{album.artist}</Text>
                    <View style={styles.albumMeta}>
                      <Text style={styles.trackCount}>{album.tracks.length} tracks</Text>
                      <TouchableOpacity 
                        style={styles.albumPlayButton}
                        onPress={() => {
                          if (album.tracks.length > 0) {
                            const firstTrack = album.tracks[0];
                            handleTrackSelect({
                              id: firstTrack._id,
                              title: firstTrack.title,
                              reciter: firstTrack.artist,
                              image: { uri: getMediaUrl(firstTrack.coverImage) },
                              fileUrl: getMediaUrl(firstTrack.audioFile),
                              duration: firstTrack.duration || '0:00'
                            });
                          }
                        }}
                      >
                        <Ionicons name="play" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Now Playing Bar */}
      {currentTrack && (
        <BlurView intensity={80} style={styles.nowPlaying}>
          <TouchableOpacity 
            style={styles.nowPlayingContent}
            onPress={() => setIsModalVisible(true)}
          >
            <Image 
              source={currentTrack.image} 
              style={styles.nowPlayingImage}
              defaultSource={defaultImage}
            />
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.nowPlayingSubtitle} numberOfLines={1}>{currentTrack.reciter}</Text>
            </View>
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={togglePlayback}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </TouchableOpacity>
          {renderBufferingIndicator()}
        </BlurView>
      )}

      {renderAudioPlayerModal()}
      {renderAlbumTracksModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  headerIconButton: {
    padding: 8,
    marginRight: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contentContainer: {
    flex: 1,
    marginTop: 25, // Height of header
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  artistCircleContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  artistCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    width: 80,
  },
  newAlbumContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  newAlbumImage: {
    width: '100%',
    height: '100%',
  },
  newAlbumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  newAlbumText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newAlbumTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  newAlbumPlayButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentlyPlayedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  recentlyPlayedItem: {
    width: '33.33%',
    padding: 8,
  },
  recentlyPlayedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  recentlyPlayedPlayButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentlyPlayedTitle: {
    fontSize: 12,
    color: '#222',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'rgba(241, 236, 236, 0.93)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  modalControlButton: {
    backgroundColor: '#000000',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#000000',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalControlIcon: {
    color: '#FFFFFF',
  },
  modalSecondaryIcon: {
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    zIndex: 1,
  },
  nowPlaying: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(12, 7, 7, 0.72)",
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  nowPlayingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nowPlayingTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nowPlayingSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  playPauseButton: {
    padding: 8,
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  bufferingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bufferingText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTime: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  trackImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 12,
    color: '#999',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    ...SHADOWS.medium,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  albumCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.light,
  },
  albumsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  albumItem: {
    width: '48%', // Slightly less than 50% to account for spacing
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  albumImage: {
    width: '100%',
    height: 160, // Reduced height
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  albumOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  albumInfo: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackCount: {
    fontSize: 11,
    color: '#999',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  albumPlayButton: {
    backgroundColor: '#000000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    ...SHADOWS.light,
  },
  trackListItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  trackListItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackListItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  trackListItemArtist: {
    fontSize: 13,
    color: '#666',
  },
  trackListItemDuration: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  trackListItemPlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  trackListContent: {
    width: '100%',
    marginTop: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
  },
  activeTabButton: {
    borderBottomColor: 'black',
  },
  tabText: {
    fontSize: 16,
    color: 'Black',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'black',
    fontWeight: '600',
  },
  tracksContainer: {
    paddingHorizontal: 16,
  },
});

export default AudioScreen;