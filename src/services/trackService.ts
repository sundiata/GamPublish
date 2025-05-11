import api from './api';

const API_URL = 'http://localhost:4001';

export interface Track {
  _id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackData {
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  description?: string;
}

export interface UpdateTrackData {
  title?: string;
  artist?: string;
  coverImage?: string;
  audioFile?: string;
  description?: string;
}

const trackService = {
  getAllTracks: async (): Promise<Track[]> => {
    try {
      const response = await api.get('/tracks', { skipAuth: true });
      const tracks = response.data.data.tracks;
      // Add full URLs to file paths
      return tracks.map((track: Track) => ({
        ...track,
        coverImage: `${API_URL}${track.coverImage}`,
        audioFile: `${API_URL}${track.audioFile}`,
      }));
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  },

  getTrack: async (id: string): Promise<Track> => {
    try {
      const response = await api.get(`/tracks/${id}`, { skipAuth: true });
      const track = response.data.data.track;
      // Add full URLs to file paths
      return {
        ...track,
        coverImage: `${API_URL}${track.coverImage}`,
        audioFile: `${API_URL}${track.audioFile}`,
      };
    } catch (error) {
      console.error('Error fetching track:', error);
      throw error;
    }
  },

  createTrack: async (data: CreateTrackData): Promise<Track> => {
    try {
      const response = await api.post('/tracks', data, { skipAuth: true });
      const track = response.data.data.track;
      // Add full URLs to file paths
      return {
        ...track,
        coverImage: `${API_URL}${track.coverImage}`,
        audioFile: `${API_URL}${track.audioFile}`,
      };
    } catch (error) {
      console.error('Error creating track:', error);
      throw error;
    }
  },

  updateTrack: async (id: string, data: UpdateTrackData): Promise<Track> => {
    try {
      const response = await api.put(`/tracks/${id}`, data, { skipAuth: true });
      const track = response.data.data.track;
      // Add full URLs to file paths
      return {
        ...track,
        coverImage: `${API_URL}${track.coverImage}`,
        audioFile: `${API_URL}${track.audioFile}`,
      };
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  },

  deleteTrack: async (id: string): Promise<void> => {
    try {
      await api.delete(`/tracks/${id}`, { skipAuth: true });
    } catch (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  },

  uploadTrackFile: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/tracks/upload/track', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        skipAuth: true
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading track file:', error);
      throw error;
    }
  },

  uploadCoverImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/tracks/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        skipAuth: true
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw error;
    }
  },
};

export default trackService; 