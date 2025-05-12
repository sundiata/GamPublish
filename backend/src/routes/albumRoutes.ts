import express from 'express';
import {
  getAllAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addTrackToAlbum,
  removeTrackFromAlbum,
} from '../controllers/albumController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for cover image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'album-cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Album routes
router.route('/')
  .get(getAllAlbums)
  .post(createAlbum);

router.route('/:id')
  .get(getAlbum)
  .put(updateAlbum)
  .delete(deleteAlbum);

// Track management routes
router.post('/:albumId/tracks/:trackId', addTrackToAlbum);
router.delete('/:albumId/tracks/:trackId', removeTrackFromAlbum);

export default router; 