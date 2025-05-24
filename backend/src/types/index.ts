import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Event extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prayer extends Document {
  name: string;
  time: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioTrack extends Document {
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  coverImage?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Album extends Document {
  title: string;
  artist: string;
  coverImage: string;
  tracks: AudioTrack[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
} 