import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'alert' | 'reminder';
  sentAt: Date;
  status: 'sent' | 'scheduled';
  targetAudience: 'all' | 'group';
  groupId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['info', 'alert', 'reminder'],
      default: 'info',
    },
    sentAt: {
      type: Date,
      required: [true, 'Sent date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['sent', 'scheduled'],
      default: 'scheduled',
    },
    targetAudience: {
      type: String,
      required: [true, 'Target audience is required'],
      enum: ['all', 'group'],
      default: 'all',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
notificationSchema.index({ sentAt: 1, status: 1 });
notificationSchema.index({ type: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema); 