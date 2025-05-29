import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'reminder';
  sentAt: Date;
  status: 'sent' | 'scheduled';
  targetAudience: 'all' | 'group';
  groupId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: Notification['type'];
  sentAt: Date;
  targetAudience: Notification['targetAudience'];
  groupId?: string;
  imageUrl?: string;
}

export interface UpdateNotificationData extends Partial<CreateNotificationData> {
  status?: Notification['status'];
}

export interface NotificationSettings {
  pushEnabled: boolean;
  apiKey?: string;
  provider?: 'firebase' | 'onesignal';
}

const notificationService = {
  // Get all notifications
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Create new notification
  createNotification: async (notificationData: CreateNotificationData): Promise<Notification> => {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },

  // Update notification
  updateNotification: async (id: string, notificationData: UpdateNotificationData): Promise<Notification> => {
    try {
      const response = await api.put(`/notifications/${id}`, notificationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating notification ${id}:`, error);
      throw error;
    }
  },

  // Get notification settings
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  // Update notification settings
  updateSettings: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Test push notification
  testPushNotification: async (): Promise<void> => {
    try {
      await api.post('/notifications/test-push');
    } catch (error) {
      console.error('Error testing push notification:', error);
      throw error;
    }
  }
};

export default notificationService; 