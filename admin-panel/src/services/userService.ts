import api from './api';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const userService = {
  getCurrentUser: async (): Promise<IUser> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<IUser>): Promise<IUser> => {
    try {
      const response = await api.put('/auth/profile', data);
      return response.data.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};

export default userService; 