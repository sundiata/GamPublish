import express from 'express';
import {
  getPrayers,
  getPrayer,
  createPrayer,
  updatePrayer,
  deletePrayer,
} from '../controllers/prayerController';

const router = express.Router();

// Routes without authentication
router.route('/')
  .get(getPrayers)
  .post(createPrayer);

router.route('/:id')
  .get(getPrayer)
  .put(updatePrayer)
  .delete(deletePrayer);

export default router; 