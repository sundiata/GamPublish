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

export interface UpdatePrayerData extends Partial<CreatePrayerData> {
  title?: string;
  date?: string;
  time?: string;
  category?: Prayer['category'];
  status?: Prayer['status'];
  description?: string;
}

export const prayerService = {
  // Get all prayers
  getAllPrayers: async (): Promise<Prayer[]> => {
    try {
      const response = await api.get('/prayers');
      return response.data;
    } catch (error) {
      console.error('Error fetching prayers:', error);
      throw error;
    }
  },

  // Get single prayer
  getPrayer: async (id: string): Promise<Prayer> => {
    try {
      const response = await api.get(`/prayers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching prayer ${id}:`, error);
      throw error;
    }
  },

  // Create new prayer
  createPrayer: async (prayerData: CreatePrayerData): Promise<Prayer> => {
    try {
      const response = await api.post('/prayers', prayerData);
      return response.data;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  },

  // Update prayer
  updatePrayer: async (id: string, prayerData: UpdatePrayerData): Promise<Prayer> => {
    try {
      const response = await api.put(`/prayers/${id}`, prayerData);
      return response.data;
    } catch (error) {
      console.error(`Error updating prayer ${id}:`, error);
      throw error;
    }
  },

  // Delete prayer
  deletePrayer: async (id: string): Promise<void> => {
    try {
      await api.delete(`/prayers/${id}`);
    } catch (error) {
      console.error(`Error deleting prayer ${id}:`, error);
      throw error;
    }
  }
}; 