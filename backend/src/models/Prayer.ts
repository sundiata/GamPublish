import mongoose, { Document, Schema } from 'mongoose';

export interface IPrayer extends Document {
  title: string;
  date: Date;
  time: string;
  category: 'Fajr' | 'Duha' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Jumu\'ah';
  status: 'Published' | 'Draft';
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const prayerSchema = new Schema<IPrayer>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Fajr', 'Duha', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumu\'ah'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Published', 'Draft'],
      default: 'Draft',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
  },
  {
    timestamps: true,
  }
);

export const Prayer = mongoose.model<IPrayer>('Prayer', prayerSchema); 