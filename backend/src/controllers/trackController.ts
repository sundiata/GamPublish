import { Request, Response } from 'express';
import Track from '../models/Track';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import path from 'path';

// Get all tracks
export const getAllTracks = catchAsync(async (req: Request, res: Response) => {
  const tracks = await Track.find().sort({ uploadDate: -1 });
  res.status(200).json({
    status: 'success',
    results: tracks.length,
    data: {
      tracks,
    },
  });
});

// Get single track
export const getTrack = catchAsync(async (req: Request, res: Response) => {
  const track = await Track.findById(req.params.id);
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }
  res.status(200).json({
    status: 'success',
    data: {
      track,
    },
  });
});

// Create new track
export const createTrack = catchAsync(async (req: Request, res: Response) => {
  const newTrack = await Track.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      track: newTrack,
    },
  });
});

// Update track
export const updateTrack = catchAsync(async (req: Request, res: Response) => {
  const track = await Track.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }
  res.status(200).json({
    status: 'success',
    data: {
      track,
    },
  });
});

// Delete track
export const deleteTrack = catchAsync(async (req: Request, res: Response) => {
  const track = await Track.findByIdAndDelete(req.params.id);
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Upload track file
export const uploadTrackFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please upload a file', 400);
  }

  const fileUrl = `/uploads/tracks/${req.file.filename}`;
  res.status(200).json({
    status: 'success',
    url: fileUrl,
  });
});

// Upload cover image
export const uploadCoverImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please upload a file', 400);
  }

  const fileUrl = `/uploads/images/${req.file.filename}`;
  res.status(200).json({
    status: 'success',
    url: fileUrl,
  });
}); 