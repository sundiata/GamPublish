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

const router = express.Router();

// Album routes
router.route('/')
  .get(getAllAlbums)
  .post(createAlbum);

router.route('/:id')
  .get(getAlbum)
  .put(updateAlbum)
  .delete(deleteAlbum);

// Track management in albums
router.route('/:albumId/tracks/:trackId')
  .post(addTrackToAlbum)
  .delete(removeTrackFromAlbum);

export default router; 