import express from 'express';
import {
  getAllNotifications,
  createNotification,
  deleteNotification,
  updateNotification,
  getSettings,
  updateSettings,
  testPushNotification,
} from '../controllers/notificationController';
// import { protect } from '../middleware/auth';

const router = express.Router();

// Temporarily remove authentication
// router.use(protect);

// Notification routes
router.route('/')
  .get(getAllNotifications)
  .post(createNotification);

router.route('/:id')
  .put(updateNotification)
  .delete(deleteNotification);

// Settings routes
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

// Test push notification
router.post('/test-push', testPushNotification);

export default router; 