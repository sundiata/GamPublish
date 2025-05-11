import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
  title: string;
  artist: string;
  coverImage: string;
  audioFile: string;
  description?: string;
  uploadDate: Date;
  duration?: string;
  album?: mongoose.Types.ObjectId;
}

const trackSchema = new Schema<ITrack>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required'],
    },
    audioFile: {
      type: String,
      required: [true, 'Audio file is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: String,
    },
    album: {
      type: Schema.Types.ObjectId,
      ref: 'Album',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITrack>('Track', trackSchema); 