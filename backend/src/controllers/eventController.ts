import { Request, Response } from 'express';
import { Event, IEvent } from '../models/Event';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import path from 'path';
import fs from 'fs';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({
      status: 'success',
      data: {
        events,
        total: events.length,
        totalPages: 1,
        currentPage: 1
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching events' 
    });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Event not found' 
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching event' 
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, category, image, price, capacity } = req.body;

    // Validate required fields
    if (!title || !description || !date || !location || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: title, description, date, location, category'
      });
    }

    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      image,
      price: price || 0,
      capacity: capacity || 0,
      status: 'upcoming',
      organizer: req.user?._id
    });

    const savedEvent = await event.save();
    res.status(201).json({
      status: 'success',
      data: {
        event: savedEvent
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error creating event' 
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, date, location, category, image, price, capacity, status } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Event not found' 
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        date,
        location,
        category,
        image,
        price,
        capacity,
        status
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error updating event' 
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Event not found' 
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ 
      status: 'success',
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error deleting event' 
    });
  }
};

// Register for event
export const registerForEvent = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('You must be logged in to register for an event', 401);
  }

  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('No event found with that ID', 404);
  }

  // Check if event is full
  if (event.attendees.length >= event.capacity) {
    throw new AppError('Event is already full', 400);
  }

  // Check if user is already registered
  if (event.attendees.includes(req.user._id)) {
    throw new AppError('You are already registered for this event', 400);
  }

  // Add user to attendees
  event.attendees.push(req.user._id);
  await event.save();

  const updatedEvent = await Event.findById(event._id)
    .populate('organizer', 'name email')
    .populate('attendees', 'name email');

  res.status(200).json({
    status: 'success',
    data: {
      event: updatedEvent,
    },
  });
});

// Unregister from event
export const unregisterFromEvent = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('You must be logged in to unregister from an event', 401);
  }

  const userId = req.user._id;
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('No event found with that ID', 404);
  }

  // Check if user is registered
  if (!event.attendees.includes(userId)) {
    throw new AppError('You are not registered for this event', 400);
  }

  // Remove user from attendees
  event.attendees = event.attendees.filter(
    (attendee) => attendee.toString() !== userId.toString()
  );
  await event.save();

  const updatedEvent = await Event.findById(event._id)
    .populate('organizer', 'name email')
    .populate('attendees', 'name email');

  res.status(200).json({
    status: 'success',
    data: {
      event: updatedEvent,
    },
  });
});

// Upload event image
export const uploadEventImage = async (req: Request, res: Response) => {
  try {
    console.log('Upload request received:', req.file); // Debug log

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        status: 'error',
        message: 'No file uploaded' 
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/events');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Return the file path relative to the uploads directory
    const filePath = `/uploads/events/${req.file.filename}`;
    res.status(200).json({
      status: 'success',
      data: {
        url: filePath
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error uploading image' 
    });
  }
}; 