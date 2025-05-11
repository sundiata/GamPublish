import mongoose, { Document, Schema } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  artist: string;
  coverImage: string;
  description?: string;
  releaseYear: number;
  tracks: mongoose.Types.ObjectId[];
}

const albumSchema = new Schema<IAlbum>(
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
    description: {
      type: String,
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
      min: [1900, 'Release year must be after 1900'],
      max: [new Date().getFullYear(), 'Release year cannot be in the future'],
    },
    tracks: [{
      type: Schema.Types.ObjectId,
      ref: 'Track',
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAlbum>('Album', albumSchema); 