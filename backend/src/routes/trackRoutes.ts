import express from 'express';
import {
  getAllTracks,
  getTrack,
  createTrack,
  updateTrack,
  deleteTrack,
  uploadTrackFile,
  uploadCoverImage,
} from '../controllers/trackController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.mimetype.startsWith('audio/') 
      ? 'uploads/tracks'
      : 'uploads/images';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload routes
router.post('/upload/track', upload.single('file'), uploadTrackFile);
router.post('/upload/image', upload.single('file'), uploadCoverImage);

// Track routes
router.route('/')
  .get(getAllTracks)
  .post(createTrack);

router.route('/:id')
  .get(getTrack)
  .put(updateTrack)
  .delete(deleteTrack);

export default router; 