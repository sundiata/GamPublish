import { Request, Response } from 'express';
import Album from '../models/Album';
import Track from '../models/Track';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';

// Get all albums
export const getAllAlbums = catchAsync(async (req: Request, res: Response) => {
  const albums = await Album.find().populate('tracks').sort({ releaseYear: -1 });
  res.status(200).json({
    status: 'success',
    results: albums.length,
    data: {
      albums,
    },
  });
});

// Get single album
export const getAlbum = catchAsync(async (req: Request, res: Response) => {
  const album = await Album.findById(req.params.id).populate('tracks');
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }
  res.status(200).json({
    status: 'success',
    data: {
      album,
    },
  });
});

// Create new album
export const createAlbum = catchAsync(async (req: Request, res: Response) => {
  const newAlbum = await Album.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      album: newAlbum,
    },
  });
});

// Update album
export const updateAlbum = catchAsync(async (req: Request, res: Response) => {
  const album = await Album.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('tracks');
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }
  res.status(200).json({
    status: 'success',
    data: {
      album,
    },
  });
});

// Delete album
export const deleteAlbum = catchAsync(async (req: Request, res: Response) => {
  const album = await Album.findById(req.params.id);
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }

  // Delete all tracks associated with the album
  await Track.deleteMany({ album: album._id });
  
  // Delete the album
  await album.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Add track to album
export const addTrackToAlbum = catchAsync(async (req: Request, res: Response) => {
  const { albumId, trackId } = req.params;
  
  const album = await Album.findById(albumId);
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }

  const track = await Track.findById(trackId);
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }

  // Add track to album if not already present
  if (!album.tracks.includes(track._id)) {
    album.tracks.push(track._id);
    await album.save();
  }

  // Update track's album reference
  track.album = album._id;
  await track.save();

  const updatedAlbum = await Album.findById(albumId).populate('tracks');
  
  res.status(200).json({
    status: 'success',
    data: {
      album: updatedAlbum,
    },
  });
});

// Remove track from album
export const removeTrackFromAlbum = catchAsync(async (req: Request, res: Response) => {
  const { albumId, trackId } = req.params;
  
  const album = await Album.findById(albumId);
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }

  const track = await Track.findById(trackId);
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }

  // Remove track from album
  album.tracks = album.tracks.filter(id => id.toString() !== trackId);
  await album.save();

  // Remove album reference from track
  track.album = undefined;
  await track.save();

  const updatedAlbum = await Album.findById(albumId).populate('tracks');
  
  res.status(200).json({
    status: 'success',
    data: {
      album: updatedAlbum,
    },
  });
}); 