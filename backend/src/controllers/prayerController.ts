import { Request, Response } from 'express';
import { Prayer, IPrayer } from '../models/Prayer';

// @desc    Get all prayers
// @route   GET /api/prayers
// @access  Public
export const getPrayers = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all prayers...');
    
    const prayers = await Prayer.find()
      .sort({ date: -1, time: -1 })
      .lean();

    console.log(`Found ${prayers.length} prayers`);

    res.status(200).json({
      status: 'success',
      data: {
        prayers,
        total: prayers.length,
        totalPages: 1,
        currentPage: 1
      }
    });
  } catch (error) {
    console.error('Error in getPrayers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prayers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// @desc    Get single prayer
// @route   GET /api/prayers/:id
// @access  Private
export const getPrayer = async (req: Request, res: Response) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    if (!prayer) {
      return res.status(404).json({ message: 'Prayer not found' });
    }
    res.json(prayer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create prayer
// @route   POST /api/prayers
// @access  Private
export const createPrayer = async (req: Request, res: Response) => {
  try {
    const { title, date, time, category, status, description } = req.body;

    const prayer = await Prayer.create({
      title,
      date,
      time,
      category,
      status,
      description,
    });

    res.status(201).json(prayer);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Update prayer
// @route   PUT /api/prayers/:id
// @access  Private
export const updatePrayer = async (req: Request, res: Response) => {
  try {
    const { title, date, time, category, status, description } = req.body;

    const prayer = await Prayer.findById(req.params.id);
    if (!prayer) {
      return res.status(404).json({ message: 'Prayer not found' });
    }

    prayer.title = title || prayer.title;
    prayer.date = date || prayer.date;
    prayer.time = time || prayer.time;
    prayer.category = category || prayer.category;
    prayer.status = status || prayer.status;
    prayer.description = description || prayer.description;

    const updatedPrayer = await prayer.save();
    res.json(updatedPrayer);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Delete prayer
// @route   DELETE /api/prayers/:id
// @access  Private
export const deletePrayer = async (req: Request, res: Response) => {
  try {
    const prayer = await Prayer.findById(req.params.id);
    if (!prayer) {
      return res.status(404).json({ message: 'Prayer not found' });
    }

    await prayer.deleteOne();
    res.json({ message: 'Prayer removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 