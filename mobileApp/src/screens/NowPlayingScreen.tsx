import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

const { width } = Dimensions.get("window");

interface Song {
  title: string;
  artist: string;
  imageUrl: ImageSourcePropType;
}

const NowPlayingScreen = ({ navigation, route }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3);

  // Extract song data safely with defaults
  const song = route.params?.song || {
    title: "Unknown Title",
    artist: "Unknown Artist",
    imageUrl: require("../assets/default-song.png"),
  };
  const songTitle = song?.title || "Unknown Title";
  const artistName = song?.artist || "Unknown Artist";

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={32} color={COLORS.background} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.background }]}>NOW PLAYING</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <Image
            source={song.imageUrl}
            style={styles.artwork}
            defaultSource={require("../assets/default-song.png")}
          />
        </View>

        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <Text style={styles.artistName}>{artistName}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>1:23</Text>
            <Text style={styles.timeText}>4:56</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="shuffle" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color={COLORS.background}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="repeat" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="list-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
  },
  artworkContainer: {
    width: width - SIZES.padding * 4,
    height: width - SIZES.padding * 4,
    borderRadius: SIZES.radius * 2,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    marginVertical: SIZES.padding * 2,
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  songInfo: {
    alignItems: "center",
    marginBottom: SIZES.padding * 2,
  },
  songTitle: {
    fontSize: SIZES.extraLarge,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  artistName: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    width: "100%",
    marginBottom: SIZES.padding * 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: `${COLORS.textSecondary}20`,
    borderRadius: 2,
  },
  progress: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.base,
  },
  timeText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: SIZES.padding * 2,
  },
  controlButton: {
    padding: SIZES.base,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingBottom: SIZES.padding,
  },
});

export default NowPlayingScreen;
