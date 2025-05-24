import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/theme';

interface Song {
  id: string;
  title: string;
  artist: string;
  imageUrl: any;
  duration: string;
}

const AudioDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: { song: Song } }, 'params'>>();
  const { song } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={28} color={COLORS.background} />
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="heart-outline" size={24} color={COLORS.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Feather name="share-2" size={22} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image */}
      <Image source={song.imageUrl} style={styles.image} />

      {/* Info */}
      <Text style={styles.surah}>{song.title}</Text>
      <Text style={styles.surahSub}>The Cow • Madani</Text>
      <Text style={styles.narrator}>
        Narrated by <Text style={{ fontWeight: 'bold' }}>Abdullah Haking Quick</Text>
      </Text>
      <Text style={styles.duration}>{song.duration}</Text>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Slider
          minimumValue={0}
          maximumValue={170}
          value={10}
          minimumTrackTintColor="#2c87f0"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#2c87f0"
        />
        <View style={styles.progressLabels}>
          <Text>10:15</Text>
          <Text>2:50:00</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity>
          <Ionicons name="play-back" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="replay-10" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <MaterialIcons name="forward-10" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="play-forward" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.optionsRow}>
        <Text style={styles.option}>Speed</Text>
        <Text style={styles.option}>Timer</Text>
        <Text style={styles.option}>Library</Text>
        <Text style={styles.option}>Download</Text>
      </View>

      {/* Swipe */}
      <Text style={styles.swipeText}>Swipe for Reading</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  icon: {
    padding: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 30,
  },
  surah: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  surahSub: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
  },
  narrator: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    color: '#444',
  },
  duration: {
    fontSize: 14,
    textAlign: 'center',
    color: '#777',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 30,
  },
  playButton: {
    width: 60,
    height: 60,
    backgroundColor: '#2c87f0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
  },
  option: {
    fontSize: 14,
    color: '#2c87f0',
    fontWeight: '600',
  },
  swipeText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 25,
    fontSize: 13,
  },
});

export default AudioDetailsScreen;
