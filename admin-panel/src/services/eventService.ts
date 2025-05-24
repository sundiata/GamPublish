import api from './api';

const API_URL = 'http://localhost:4001';

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  price: number;
  capacity: number;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  attendees: {
    _id: string;
    name: string;
    email: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  price: number;
  capacity: number;
  category: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  image?: string;
  price?: number;
  capacity?: number;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface EventFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

const eventService = {
  getAllEvents: async (filters?: EventFilters): Promise<{ events: Event[]; total: number; totalPages: number; currentPage: number }> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }

      const response = await api.get(`/events?${params.toString()}`);
      console.log("response.data", response.data);
      const { events, total, totalPages, currentPage } = response.data.data;
      
      // Add full URLs to image paths
      return {
        events: events.map((event: Event) => ({
          ...event,
          image: event.image ? `${API_URL}${event.image}` : '',
        })),
        total,
        totalPages,
        currentPage,
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  getEvent: async (id: string): Promise<Event> => {
    try {
      const response = await api.get(`/events/${id}`);
      const event = response.data.data.event;
      return {
        ...event,
        image: event.image ? `${API_URL}${event.image}` : '',
      };
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  createEvent: async (data: CreateEventData): Promise<Event> => {
    try {
      const response = await api.post('/events', data);
      const event = response.data.data.event;
      return {
        ...event,
        image: event.image ? `${API_URL}${event.image}` : '',
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  updateEvent: async (id: string, data: UpdateEventData): Promise<Event> => {
    try {
      const response = await api.put(`/events/${id}`, data);
      const event = response.data.data.event;
      return {
        ...event,
        image: event.image ? `${API_URL}${event.image}` : '',
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  registerForEvent: async (id: string): Promise<Event> => {
    try {
      const response = await api.post(`/events/${id}/register`);
      return response.data.data.event;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  unregisterFromEvent: async (id: string): Promise<Event> => {
    try {
      const response = await api.delete(`/events/${id}/unregister`);
      return response.data.data.event;
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  },

  uploadEventImage: async (file: File): Promise<string> => {
    try {
      console.log('Uploading file:', file);
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/events/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      const imageUrl = response.data.data.url;
      console.log('Image URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading event image:', error);
      throw error;
    }
  },
};

export default eventService; 