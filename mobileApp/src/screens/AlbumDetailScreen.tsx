import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

interface Track {
  id: string;
  title: string;
  duration: string;
  imageUrl?: ImageSourcePropType;
}

interface Album {
  title: string;
  artist: string;
  imageUrl: ImageSourcePropType;
  year?: string;
  tracks?: number;
}

// Dummy tracks data for the album
const DUMMY_TRACKS: Track[] = [
  { id: "1", title: "Introduction", duration: "2:30" },
  { id: "2", title: "Chapter 1", duration: "15:45" },
  { id: "3", title: "Chapter 2", duration: "12:20" },
  { id: "4", title: "Chapter 3", duration: "18:15" },
  { id: "5", title: "Chapter 4", duration: "14:30" },
  { id: "6", title: "Chapter 5", duration: "16:40" },
  { id: "7", title: "Chapter 6", duration: "13:55" },
  { id: "8", title: "Chapter 7", duration: "17:25" },
  { id: "9", title: "Chapter 8", duration: "15:10" },
  { id: "10", title: "Conclusion", duration: "5:30" },
];

const AlbumDetailScreen = ({ route, navigation }) => {
  const { album } = route.params || {
    title: "Unknown Album",
    artist: "Unknown Artist",
    imageUrl: require("../assets/default-song.png"),
  };

  const renderTrackItem = ({ item, index }: { item: Track; index: number }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() =>
        navigation.navigate("NowPlaying", {
          song: {
            title: item.title,
            artist: album.artist,
            imageUrl: album.imageUrl, // Use album image for all tracks
          },
        })
      }
    >
      <View style={styles.trackNumberContainer}>
        <Text style={styles.trackNumber}>
          {(index + 1).toString().padStart(2, "0")}
        </Text>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{item.title}</Text>
        <Text style={styles.trackDuration}>{item.duration}</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.background }]}>Album Details</Text>
      </View>

      <View style={styles.albumHeader}>
        <Image
          source={album.imageUrl}
          style={styles.albumCover}
          defaultSource={require("../assets/default-song.png")}
        />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{album.title}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          <Text style={styles.albumDetails}>
            {album.year || "2023"} • {album.tracks || DUMMY_TRACKS.length}{" "}
            tracks
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() =>
            navigation.navigate("NowPlaying", {
              song: {
                title: album.title,
                artist: album.artist,
                imageUrl: album.imageUrl,
              },
            })
          }
        >
          <Ionicons name="play-circle" size={56} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shuffleButton}>
          <Ionicons name="shuffle" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_TRACKS}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.trackList}
      />
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
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: "600",
    color: COLORS.text,
  },
  albumHeader: {
    padding: SIZES.padding,
    alignItems: "center",
  },
  albumCover: {
    width: 200,
    height: 200,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  albumInfo: {
    alignItems: "center",
  },
  albumTitle: {
    fontSize: SIZES.extraLarge,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SIZES.base,
  },
  albumArtist: {
    fontSize: SIZES.large,
    color: COLORS.textSecondary,
    marginBottom: SIZES.base,
  },
  albumDetails: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.padding,
  },
  playButton: {
    marginRight: SIZES.padding,
  },
  shuffleButton: {
    backgroundColor: COLORS.card,
    padding: SIZES.base,
    borderRadius: SIZES.radius,
  },
  trackList: {
    padding: SIZES.padding,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.base,
  },
  trackNumberContainer: {
    width: 40,
    alignItems: "center",
  },
  trackNumber: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  trackInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: SIZES.base,
  },
  trackTitle: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    flex: 1,
  },
  trackDuration: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: SIZES.padding,
  },
  moreButton: {
    padding: SIZES.base,
  },
});

export default AlbumDetailScreen;
