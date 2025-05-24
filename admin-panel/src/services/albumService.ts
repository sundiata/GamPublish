import api from './api';
import { Track as BaseTrack } from './trackService';

const API_URL = 'http://localhost:4001';

export type Track = BaseTrack;

export interface Album {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  description: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumData {
  title: string;
  artist: string;
  coverImage: string;
  description?: string;
}

export interface UpdateAlbumData {
  title?: string;
  artist?: string;
  coverImage?: string;
  description?: string;
}

const albumService = {
  getAllAlbums: async (): Promise<Album[]> => {
    try {
      const response = await api.get('/albums', { skipAuth: true });
      const albums = response.data.data.albums;
      // Add full URLs to file paths
      return albums.map((album: Album) => ({
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      }));
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  },

  getAlbum: async (id: string): Promise<Album> => {
    try {
      const response = await api.get(`/albums/${id}`, { skipAuth: true });
      const album = response.data.data.album;
      // Add full URLs to file paths
      return {
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      };
    } catch (error) {
      console.error('Error fetching album:', error);
      throw error;
    }
  },

  createAlbum: async (data: CreateAlbumData): Promise<Album> => {
    try {
      const response = await api.post('/albums', data, { skipAuth: true });
      const album = response.data.data.album;
      // Add full URLs to file paths
      return {
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      };
    } catch (error) {
      console.error('Error creating album:', error);
      throw error;
    }
  },

  updateAlbum: async (id: string, data: UpdateAlbumData): Promise<Album> => {
    try {
      const response = await api.put(`/albums/${id}`, data, { skipAuth: true });
      const album = response.data.data.album;
      // Add full URLs to file paths
      return {
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      };
    } catch (error) {
      console.error('Error updating album:', error);
      throw error;
    }
  },

  deleteAlbum: async (id: string): Promise<void> => {
    try {
      await api.delete(`/albums/${id}`, { skipAuth: true });
    } catch (error) {
      console.error('Error deleting album:', error);
      throw error;
    }
  },

  addTrackToAlbum: async (albumId: string, trackId: string): Promise<Album> => {
    try {
      const response = await api.post(`/albums/${albumId}/tracks/${trackId}`, {}, { skipAuth: true });
      const album = response.data.data.album;
      // Add full URLs to file paths
      return {
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      };
    } catch (error) {
      console.error('Error adding track to album:', error);
      throw error;
    }
  },

  removeTrackFromAlbum: async (albumId: string, trackId: string): Promise<Album> => {
    try {
      const response = await api.delete(`/albums/${albumId}/tracks/${trackId}`, { skipAuth: true });
      const album = response.data.data.album;
      // Add full URLs to file paths
      return {
        ...album,
        coverImage: `${API_URL}${album.coverImage}`,
        tracks: album.tracks.map((track: Track) => ({
          ...track,
          coverImage: `${API_URL}${track.coverImage}`,
          audioFile: `${API_URL}${track.audioFile}`,
        })),
      };
    } catch (error) {
      console.error('Error removing track from album:', error);
      throw error;
    }
  },
};

export default albumService; 