import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';

// @desc    Get prayer times for a specific date
// @route   GET /api/prayers/times
// @access  Public
export const getPrayerTimes = catchAsync(async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    // For now, return hardcoded prayer times
    // In a real application, you would calculate these based on location and date
    const prayerTimes = {
      fajr: "05:15",
      sunrise: "06:45",
      dhuhr: "12:30",
      asr: "15:45",
      maghrib: "18:15",
      isha: "19:45"
    };

    res.status(200).json({
      status: 'success',
      data: prayerTimes
    });
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prayer times'
    });
  }
});

// @desc    Get prayer times by location
// @route   GET /api/prayers/times/location
// @access  Public
export const getPrayerTimesByLocation = catchAsync(async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    // For now, return hardcoded prayer times
    // In a real application, you would calculate these based on the provided coordinates
    const prayerTimes = {
      fajr: "05:15",
      sunrise: "06:45",
      dhuhr: "12:30",
      asr: "15:45",
      maghrib: "18:15",
      isha: "19:45"
    };

    res.status(200).json({
      status: 'success',
      data: prayerTimes
    });
  } catch (error) {
    console.error('Error fetching prayer times by location:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prayer times by location'
    });
  }
}); 