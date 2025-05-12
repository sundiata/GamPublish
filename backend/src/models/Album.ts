import mongoose, { Document, Schema } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  artist: string;
  coverImage: string;
  description?: string;
  releaseDate: Date;
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
    releaseDate: {
      type: Date,
      default: Date.now,
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