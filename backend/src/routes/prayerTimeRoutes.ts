import express from 'express';
import { getPrayerTimes, getPrayerTimesByLocation } from '../controllers/prayerTimeController';

const router = express.Router();

router.get('/times', getPrayerTimes);
router.get('/times/location', getPrayerTimesByLocation);

export default router; 