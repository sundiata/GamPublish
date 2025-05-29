import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView, StatusBar, ActivityIndicator, Modal, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { getAllTracks, getAllAlbums, getMediaUrl, Track, Album } from '../services/api';
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
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressUpdateInterval = useRef(null);
  const progressBarRef = useRef<View>(null);

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

  // Add progress tracking
  useEffect(() => {
    if (sound && isPlaying) {
      progressUpdateInterval.current = setInterval(async () => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            const currentPosition = status.positionMillis;
            const totalDuration = status.durationMillis;
            setCurrentTime(currentPosition);
            setDuration(totalDuration);
            setProgress(currentPosition / totalDuration);
          }
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }, 1000);
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [sound, isPlaying]);

  // Enhanced playAudio function with better error handling
  const playAudio = async (item: RecitationItem) => {
    try {
      setIsBuffering(true);
      setPlaybackError(null);

      // Log the audio URL we're trying to play
      console.log('Attempting to play audio from URL:', item.fileUrl);

      // Validate the URL
      if (!item.fileUrl) {
        throw new Error('No audio URL provided');
      }

      // Unload any existing sound
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error unloading previous sound:', error);
        }
        setSound(null);
      }

      // Create and load the new sound with retry logic
      const loadSound = async (retryAttempt = 0) => {
        try {
          console.log(`Loading sound attempt ${retryAttempt + 1}...`);
          
          const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: item.fileUrl },
            { 
              shouldPlay: true,
              progressUpdateIntervalMillis: 1000,
              positionMillis: 0,
              volume: 1.0,
              rate: 1.0,
              shouldCorrectPitch: true,
            },
            (status) => {
              console.log('Playback status update:', status);
              if (status.isLoaded) {
                setIsBuffering(status.isBuffering);
                setIsPlaying(status.isPlaying);
                
                if (status.didJustFinish) {
                  setIsPlaying(false);
                }
              } else {
                console.log('Audio not loaded in status update:', status);
                if (!status.isLoaded && 'error' in status) {
                  console.error('Playback error:', status.error);
                  setPlaybackError(status.error);
                }
              }
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

  // Enhanced togglePlayback with better error handling
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
        // If sound is not loaded, try to reload it
        if (currentTrack) {
          await playAudio(currentTrack);
        }
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

  // Format time in mm:ss
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar seek
  const handleSeek = async (value: number) => {
    if (sound) {
      try {
        const newPosition = value * duration;
        await sound.setPositionAsync(newPosition);
        setCurrentTime(newPosition);
        setProgress(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  // Handle next track
  const handleNextTrack = async () => {
    if (!currentTrack) return;

    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      await playAudio(nextTrack);
    }
  };

  // Handle previous track
  const handlePreviousTrack = async () => {
    if (!currentTrack) return;

    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex > 0) {
      const previousTrack = tracks[currentIndex - 1];
      await playAudio(previousTrack);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchTracks();
    fetchAlbums();
  }, []);

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('State Update:', {
      tracksCount: tracks.length,
      albumsCount: albums.length,
      isLoading,
      error,
      activeTab
    });
  }, [tracks, albums, isLoading, error, activeTab]);

  // Enhanced fetchTracks with retry logic
  const fetchTracks = async () => {
    try {
      console.log('Starting to fetch tracks...');
      setIsLoading(true);
      setError(null);
      const response = await getAllTracks();
      console.log('Raw Tracks API Response:', JSON.stringify(response, null, 2));
      
      if (response.status === 'success' && response.data.tracks) {
        // Process tracks to ensure proper URLs
        const processedTracks = response.data.tracks.map(track => {
          // Construct full URLs by prepending the base URL
          const baseUrl = 'http://localhost:4001'; // or your actual base URL
          const audioUrl = `${baseUrl}${track.audioFile}`;
          const coverUrl = `${baseUrl}${track.coverImage}`;
          
          console.log('Processing track:', {
            id: track._id,
            title: track.title,
            audioUrl,
            coverUrl
          });
          
          return {
            id: track._id,
            title: track.title,
            reciter: track.artist,
            image: { uri: coverUrl },
            fileUrl: audioUrl,
            duration: track.duration || '0:00'
          };
        });
        console.log('Setting tracks state with:', processedTracks.length, 'tracks');
        setTracks(processedTracks);
      } else {
        console.error('Invalid tracks response:', response);
        setError('Failed to load tracks');
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fetchAlbums with retry logic
  const fetchAlbums = async () => {
    try {
      console.log('Starting to fetch albums...');
      setIsLoading(true);
      setError(null);
      const response = await getAllAlbums();
      console.log('Raw Albums API Response:', JSON.stringify(response, null, 2));
      
      if (response.status === 'success' && response.data.albums) {
        // Process albums to ensure proper URLs
        const processedAlbums = response.data.albums.map(album => {
          const baseUrl = 'http://localhost:4001'; // or your actual base URL
          const albumCoverUrl = `${baseUrl}${album.coverImage}`;
          
          console.log('Processing album:', {
            id: album._id,
            title: album.title,
            coverUrl: albumCoverUrl
          });
          
          return {
            ...album,
            coverImage: albumCoverUrl,
            tracks: album.tracks.map(track => {
              const trackAudioUrl = `${baseUrl}${track.audioFile}`;
              const trackCoverUrl = `${baseUrl}${track.coverImage}`;
              
              console.log('Processing album track:', {
                id: track._id,
                title: track.title,
                audioUrl: trackAudioUrl,
                coverUrl: trackCoverUrl
              });
              
              return {
                ...track,
                coverImage: trackCoverUrl,
                audioFile: trackAudioUrl
              };
            })
          };
        });
        console.log('Setting albums state with:', processedAlbums.length, 'albums');
        setAlbums(processedAlbums);
      } else {
        console.error('Invalid albums response:', response);
        setError('Failed to load albums');
      }
    } catch (err) {
      console.error('Error fetching albums:', err);
      setError('Failed to load albums');
    } finally {
      setIsLoading(false);
    }
  };

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
    console.log('Rendering track item:', item);
    if (!item) return null;
    
    return (
      <TouchableOpacity 
        style={styles.trackItem}
        onPress={() => playAudio(item)}
      >
        <Image 
          source={item.image || defaultImage} 
          style={styles.trackImage}
          defaultSource={defaultImage}
        />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.reciter || 'Unknown Artist'}</Text>
          <Text style={styles.trackDuration}>{item.duration || '0:00'}</Text>
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

  // Handle track selection from album
  const handleTrackSelect = async (track: RecitationItem) => {
    try {
      console.log('Handling track selection:', track);
      // Stop current playback if any
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.log('Error unloading previous sound:', error);
        }
        setSound(null);
      }

      // Set the new track and start playback
      setCurrentTrack(track);
      await playAudio(track);
      setSelectedAlbum(null); // Close album modal after selection
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
                <Text style={styles.progressTime}>{formatTime(currentTime)}</Text>
                <Text style={styles.progressTime}>{formatTime(duration)}</Text>
              </View>
              <TouchableOpacity 
                ref={progressBarRef}
                style={styles.progressBar}
                onPress={(event) => {
                  if (progressBarRef.current) {
                    progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
                      const { locationX } = event.nativeEvent;
                      const newProgress = locationX / width;
                      handleSeek(newProgress);
                    });
                  }
                }}
              >
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
              </TouchableOpacity>
            </View>

            {/* Controls Row */}
            <View style={styles.modalControls}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={handlePreviousTrack}
              >
                <Ionicons name="play-skip-back" size={24} style={styles.modalSecondaryIcon} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalControlButton} 
                onPress={togglePlayback}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={36} 
                  style={styles.modalControlIcon} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={handleNextTrack}
              >
                <Ionicons name="play-skip-forward" size={24} style={styles.modalSecondaryIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  // Render album item
  const renderAlbumItem = ({ item }: { item: Album }) => {
    console.log('Rendering album item:', item);
    if (!item) return null;
    
    return (
      <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => setSelectedAlbum(item)}
      >
        <Image 
          source={{ uri: getMediaUrl(item.coverImage) || defaultImage }} 
          style={styles.albumImage}
          defaultSource={defaultImage}
        />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle} numberOfLines={1}>{item.title || 'Untitled Album'}</Text>
          <Text style={styles.albumArtist} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
          <Text style={styles.trackCount}>{item.tracks?.length || 0} tracks</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
                source={{ uri: selectedAlbum.coverImage }} 
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
                      image: { uri: item.coverImage },
                      fileUrl: item.audioFile,
                      duration: item.duration || '0:00'
                    })}
                  >
                    <Image 
                      source={{ uri: item.coverImage }} 
                      style={styles.trackListItemImage}
                      defaultSource={defaultImage}
                    />
                    <View style={styles.trackListItemInfo}>
                      <Text style={styles.trackListItemTitle}>{item.title}</Text>
                      <Text style={styles.trackListItemArtist}>{item.artist}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.trackListItemPlay}
                      onPress={() => handleTrackSelect({
                        id: item._id,
                        title: item.title,
                        reciter: item.artist,
                        image: { uri: item.coverImage },
                        fileUrl: item.audioFile,
                        duration: item.duration || '0:00'
                      })}
                    >
                      <Ionicons 
                        name={currentTrack?.id === item._id && isPlaying ? "pause" : "play"} 
                        size={20} 
                        color="white" 
                      />
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

  // Modify the content rendering section
  const renderContent = () => {
    console.log('Rendering content with:', {
      activeTab,
      tracksCount: tracks.length,
      albumsCount: albums.length,
      isLoading,
      error
    });

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
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
    }

    if (activeTab === 'tracks') {
      if (tracks.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tracks available</Text>
          </View>
        );
      }
      return (
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
                source={item.image || defaultImage} 
                style={styles.trackImage}
                defaultSource={defaultImage}
              />
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.reciter || 'Unknown Artist'}</Text>
                <Text style={styles.trackDuration}>{item.duration || '0:00'}</Text>
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
      );
    } else {
      if (albums.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No albums available</Text>
          </View>
        );
      }
      return (
        <View style={styles.albumsContainer}>
          {albums.map((album) => (
            <TouchableOpacity 
              key={album._id}
              style={styles.albumItem}
              onPress={() => setSelectedAlbum(album)}
            >
              <Image 
                source={{ uri: album.coverImage || defaultImage }} 
                style={styles.albumImage}
                defaultSource={defaultImage}
              />
              <View style={styles.albumInfo}>
                <Text style={styles.albumTitle} numberOfLines={1}>{album.title || 'Untitled Album'}</Text>
                <Text style={styles.albumArtist} numberOfLines={1}>{album.artist || 'Unknown Artist'}</Text>
                <Text style={styles.trackCount}>{album.tracks?.length || 0} tracks</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.landingContainer}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="musical-notes" size={50} color="black" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>GamQuran</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Top Artists */}
          <Text style={styles.sectionTitle}>Top Reciters</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
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
          )}

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

          {/* Content */}
          {renderContent()}
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
    maxHeight: '80%',
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
    backgroundColor: "rgba(0, 0, 0, 0.72)",
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
    color: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000000',
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
    color: '#000000',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
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
    color: '#000000',
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 12,
    color: '#000000',
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
    borderColor: '#000000',
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
    color: '#000000',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 6,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackCount: {
    fontSize: 11,
    color: '#000000',
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
    color: '#000000',
    marginBottom: 4,
  },
  trackListItemArtist: {
    fontSize: 13,
    color: '#000000',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AudioScreen;