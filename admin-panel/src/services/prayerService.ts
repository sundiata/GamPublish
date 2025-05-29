import api from './api';

export interface Prayer {
  _id: string;
  title: string;
  date: string;
  time: string;
  category: 'Fajr' | 'Duha' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Jumu\'ah';
  status: 'Published' | 'Draft';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrayerData {
  title: string;
  date: string;
  time: string;
  category: Prayer['category'];
  status: Prayer['status'];
  description: string;
}

export type UpdatePrayerData = Partial<CreatePrayerData>;

export interface PrayerResponse {
  status: string;
  data: {
    prayer: Prayer;
  };
}

export interface PrayersResponse {
  status: string;
  data: {
    prayers: Prayer[];
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface PrayerTimesResponse {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const prayerService = {
  // Get all prayers with pagination and filters
  getAllPrayers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PrayersResponse['data']> => {
    try {
      console.log('Fetching prayers with params:', params);
      const response = await api.get<PrayersResponse>('/prayers', { params });
      console.log('Raw prayers response:', response);
      
      // Check if response has the expected structure
      if (response.data && response.data.data && Array.isArray(response.data.data.prayers)) {
        return response.data.data;
      } else {
        // If response is just an array, wrap it in the expected structure
        return {
          prayers: Array.isArray(response.data) ? response.data : [],
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1,
          currentPage: 1
        };
      }
    } catch (error) {
      console.error('Error fetching prayers:', error);
      throw error;
    }
  },

  // Get single prayer by ID
  getPrayer: async (id: string): Promise<Prayer> => {
    try {
      console.log('Fetching prayer by ID:', id);
      const response = await api.get<PrayerResponse>(`/prayers/${id}`);
      console.log('Prayer response:', response.data);
      return response.data.data.prayer;
    } catch (error) {
      console.error('Error fetching prayer:', error);
      throw error;
    }
  },

  // Create new prayer
  createPrayer: async (data: CreatePrayerData): Promise<Prayer> => {
    try {
      console.log('Creating prayer with data:', data);
      const response = await api.post<Prayer>('/prayers', data);
      console.log('Create prayer response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  },

  // Update prayer
  updatePrayer: async (id: string, data: UpdatePrayerData): Promise<Prayer> => {
    try {
      console.log('Updating prayer:', id, 'with data:', data);
      const response = await api.put<Prayer>(`/prayers/${id}`, data);
      console.log('Update prayer response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating prayer:', error);
      throw error;
    }
  },

  // Delete prayer
  deletePrayer: async (id: string): Promise<void> => {
    try {
      console.log('Deleting prayer:', id);
      await api.delete(`/prayers/${id}`);
      console.log('Prayer deleted successfully');
    } catch (error) {
      console.error('Error deleting prayer:', error);
      throw error;
    }
  },

  // Get prayer times
  getPrayerTimes: async (date?: string): Promise<PrayerTimesResponse> => {
    try {
      console.log('Fetching prayer times for date:', date);
      const url = date ? `/prayer-times/date/${date}` : '/prayer-times';
      const response = await api.get<PrayerTimesResponse>(url);
      console.log('Prayer times response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      throw error;
    }
  },

  // Get today's prayer times
  getTodayPrayerTimes: async (): Promise<PrayerTimesResponse> => {
    try {
      console.log('Fetching today\'s prayer times');
      const response = await api.get<PrayerTimesResponse>('/prayer-times/today');
      console.log('Today\'s prayer times response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s prayer times:', error);
      throw error;
    }
  }
};

export default prayerService; 