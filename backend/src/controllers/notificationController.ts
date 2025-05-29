import { Request, Response } from 'express';
import Notification, { INotification } from '../models/Notification';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
export const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = await Notification.find().sort({ sentAt: -1 });
  res.json(notifications);
});

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, message, type, sentAt, targetAudience, groupId, imageUrl } = req.body;

  const notification = await Notification.create({
    title,
    message,
    type,
    sentAt: sentAt || new Date(),
    targetAudience,
    groupId,
    imageUrl,
    status: sentAt && new Date(sentAt) > new Date() ? 'scheduled' : 'sent',
  });

  // Send push notification if enabled
  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
    try {
      await sendPushNotification(notification);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Don't throw error, just log it
    }
  }

  res.status(201).json(notification);
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) {
    throw new AppError('No notification found with that ID', 404);
  }
  res.status(204).json({ status: 'success', data: null });
});

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private
export const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, message, type, sentAt, targetAudience, groupId, status, imageUrl } = req.body;

  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    throw new AppError('No notification found with that ID', 404);
  }

  notification.title = title || notification.title;
  notification.message = message || notification.message;
  notification.type = type || notification.type;
  notification.sentAt = sentAt || notification.sentAt;
  notification.targetAudience = targetAudience || notification.targetAudience;
  notification.groupId = groupId || notification.groupId;
  notification.status = status || notification.status;
  notification.imageUrl = imageUrl || notification.imageUrl;

  const updatedNotification = await notification.save();
  res.json(updatedNotification);
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
export const getSettings = catchAsync(async (req: Request, res: Response) => {
  res.json({
    pushEnabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    apiKey: process.env.PUSH_NOTIFICATIONS_API_KEY || '',
    provider: process.env.PUSH_NOTIFICATIONS_PROVIDER || 'firebase',
  });
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const { pushEnabled, apiKey, provider } = req.body;

  // In a real application, you would save these settings to a database
  // For now, we'll just return the updated settings
  res.json({
    pushEnabled,
    apiKey,
    provider,
  });
});

// @desc    Test push notification
// @route   POST /api/notifications/test-push
// @access  Private
export const testPushNotification = catchAsync(async (req: Request, res: Response) => {
  if (process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') {
    throw new AppError('Push notifications are not enabled', 400);
  }

  const testNotification = {
    title: 'Test Notification',
    message: 'This is a test push notification',
    type: 'info' as const,
    sentAt: new Date(),
    targetAudience: 'all' as const,
  };

  try {
    await sendPushNotification(testNotification);
    res.json({ status: 'success', message: 'Test push notification sent' });
  } catch (error) {
    console.error('Error sending test push notification:', error);
    throw new AppError('Failed to send test push notification', 500);
  }
});

// Helper function to send push notifications
async function sendPushNotification(notification: Partial<INotification>) {
  const provider = process.env.PUSH_NOTIFICATIONS_PROVIDER || 'firebase';
  const apiKey = process.env.PUSH_NOTIFICATIONS_API_KEY;

  if (!apiKey) {
    throw new Error('Push notification API key is not configured');
  }

  switch (provider) {
    case 'firebase':
      // Implement Firebase Cloud Messaging (FCM) logic here
      console.log('Sending FCM notification:', notification);
      break;
    case 'onesignal':
      // Implement OneSignal logic here
      console.log('Sending OneSignal notification:', notification);
      break;
    default:
      throw new Error(`Unsupported push notification provider: ${provider}`);
  }
} 