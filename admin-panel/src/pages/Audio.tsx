import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Alert,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CloudUpload as UploadIcon,
  RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import trackService, { Track, CreateTrackData } from '../services/trackService';
import albumService, { Album, CreateAlbumData } from '../services/albumService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audio-tabpanel-${index}`}
      aria-labelledby={`audio-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Audio: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openTrackDialog, setOpenTrackDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [formData, setFormData] = useState<CreateTrackData>({
    title: '',
    artist: '',
    coverImage: '',
    audioFile: '',
    description: '',
  });
  const [openAlbumDialog, setOpenAlbumDialog] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumFormData, setAlbumFormData] = useState<CreateAlbumData>({
    title: '',
    artist: '',
    coverImage: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadTracks();
    loadAlbums();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const data = await trackService.getAllTracks();
      // Only show tracks that aren't part of any album
      setTracks(data.filter(track => !track.album));
      setError(null);
    } catch (err) {
      setError('Failed to load tracks');
      console.error('Error loading tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbums = async () => {
    try {
      const data = await albumService.getAllAlbums();
      setAlbums(data);
    } catch (err) {
      setError('Failed to load albums');
      console.error('Error loading albums:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTrackDialogClose = () => {
    setOpenTrackDialog(false);
    setFormData({
      title: '',
      artist: '',
      coverImage: '',
      audioFile: '',
      description: '',
    });
    setSelectedFile(null);
    setSelectedImage(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handlePlay = (track: Track) => {
    if (currentTrack?._id === track._id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (selectedFile && selectedImage) {
      try {
        // Upload files first
        const [audioFileUrl, coverImageUrl] = await Promise.all([
          trackService.uploadTrackFile(selectedFile),
          trackService.uploadCoverImage(selectedImage),
        ]);

        // Create track with uploaded file URLs
        const trackData: CreateTrackData = {
          ...formData,
          audioFile: audioFileUrl,
          coverImage: coverImageUrl,
        };

        await trackService.createTrack(trackData);
        handleTrackDialogClose();
        loadTracks();
      } catch (err) {
        setError('Failed to create track');
        console.error('Error creating track:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this track?')) {
      try {
        await trackService.deleteTrack(id);
        loadTracks();
      } catch (err) {
        setError('Failed to delete track');
        console.error('Error deleting track:', err);
      }
    }
  };

  const handleAlbumDialogClose = () => {
    setOpenAlbumDialog(false);
    setAlbumFormData({
      title: '',
      artist: '',
      coverImage: '',
      description: '',
    });
    setSelectedImage(null);
    setSelectedFiles([]);
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleAlbumSubmit = async () => {
    if (selectedImage && selectedFiles.length > 0) {
      try {
        // Upload cover image first
        const coverImageUrl = await trackService.uploadCoverImage(selectedImage);

        // Create album with uploaded cover image URL
        const albumData: CreateAlbumData = {
          ...albumFormData,
          coverImage: coverImageUrl,
        };

        const newAlbum = await albumService.createAlbum(albumData);

        // Upload all audio files and create tracks
        const uploadPromises = selectedFiles.map(async (file, index) => {
          try {
            // Upload audio file
            const audioFileUrl = await trackService.uploadTrackFile(file);

            // Create track with the uploaded audio file
            const trackData: CreateTrackData = {
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              artist: albumFormData.artist,
              coverImage: coverImageUrl,
              audioFile: audioFileUrl,
              description: `Track ${index + 1} from ${albumFormData.title}`,
              album: newAlbum._id // Add album reference to track
            };

            const newTrack = await trackService.createTrack(trackData);
            
            // Add track to album
            await albumService.addTrackToAlbum(newAlbum._id, newTrack._id);
            
            return newTrack;
          } catch (err) {
            console.error(`Error uploading file ${file.name}:`, err);
            throw err;
          }
        });

        await Promise.all(uploadPromises);
        handleAlbumDialogClose();
        loadAlbums();
      } catch (err) {
        setError('Failed to create album');
        console.error('Error creating album:', err);
      }
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this album?')) {
      try {
        await albumService.deleteAlbum(id);
        loadAlbums();
      } catch (err) {
        setError('Failed to delete album');
        console.error('Error deleting album:', err);
      }
    }
  };

  const handleRemoveTrackFromAlbum = async (albumId: string, trackId: string) => {
    try {
      await albumService.removeTrackFromAlbum(albumId, trackId);
      loadAlbums();
    } catch (err) {
      setError('Failed to remove track from album');
      console.error('Error removing track from album:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            width: { sm: `calc(100% - 240px)` },
            ml: { sm: `240px` },
          }}
        >
          <Topbar title="Audio" />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: `240px` },
        }}
      >
        <Topbar title="Audio" />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Single Tracks" />
                <Tab label="Albums" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 2 }}>
                <Typography variant="h6" color="text.primary">Single Tracks</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTrackDialog(true)}
                >
                  Upload Track
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                  p: 2,
                }}
              >
                {tracks.map((track) => (
                  <Card key={track._id} sx={{ bgcolor: 'background.paper' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={track.coverImage}
                      alt={track.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div" color="text.primary">
                        {track.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {track.artist}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <IconButton size="small" onClick={() => handlePlay(track)}>
                          {isPlaying && currentTrack?._id === track._id ? (
                            <PauseIcon />
                          ) : (
                            <PlayIcon />
                          )}
                        </IconButton>
                        <Box>
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(track._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 2 }}>
                <Typography variant="h6" color="text.primary">Albums</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAlbumDialog(true)}
                >
                  Create Album
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                  p: 2,
                }}
              >
                {albums.map((album) => (
                  <Card 
                    key={album._id} 
                    sx={{ 
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s ease-in-out'
                      }
                    }}
                    onClick={() => setSelectedAlbum(album)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={album.coverImage}
                      alt={album.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div" color="text.primary">
                        {album.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {album.artist}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {album.tracks.length} tracks
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            setSelectedAlbum(album);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleDeleteAlbum(album._id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Album Details Dialog */}
              <Dialog
                open={!!selectedAlbum}
                onClose={() => setSelectedAlbum(null)}
                maxWidth="md"
                fullWidth
              >
                {selectedAlbum && (
                  <>
                    <DialogTitle>
                      {selectedAlbum.title} - {selectedAlbum.artist}
                    </DialogTitle>
                    <DialogContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <img
                          src={selectedAlbum.coverImage}
                          alt={selectedAlbum.title}
                          style={{ width: 200, height: 200, objectFit: 'cover' }}
                        />
                        <Box>
                          <Typography variant="body1" color="text.secondary" paragraph>
                            {selectedAlbum.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedAlbum.tracks.length} tracks
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Album Tracks
                      </Typography>
                      <List>
                        {selectedAlbum.tracks.map((track) => (
                          <ListItem 
                            key={track._id}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: currentTrack?._id === track._id ? 'action.selected' : 'inherit'
                            }}
                            onClick={() => handlePlay(track)}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {currentTrack?._id === track._id && isPlaying ? (
                                    <PauseIcon fontSize="small" />
                                  ) : (
                                    <PlayIcon fontSize="small" />
                                  )}
                                  {track.title}
                                </Box>
                              }
                              secondary={track.artist}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveTrackFromAlbum(selectedAlbum._id, track._id)}
                              >
                                <RemoveCircleIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setSelectedAlbum(null)}>Close</Button>
                    </DialogActions>
                  </>
                )}
              </Dialog>

              {/* Album Creation Dialog */}
              <Dialog open={openAlbumDialog} onClose={handleAlbumDialogClose} maxWidth="md" fullWidth>
                <DialogTitle>Create New Album</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                      label="Album Title"
                      fullWidth
                      value={albumFormData.title}
                      onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
                    />
                    <TextField
                      label="Artist Name"
                      fullWidth
                      value={albumFormData.artist}
                      onChange={(e) => setAlbumFormData({ ...albumFormData, artist: e.target.value })}
                    />
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={4}
                      value={albumFormData.description}
                      onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                    />
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      Upload Cover Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>
                    {selectedImage && (
                      <Typography variant="body2" color="text.secondary">
                        Selected: {selectedImage.name}
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      Upload Audio Files
                      <input
                        type="file"
                        hidden
                        accept="audio/*"
                        multiple
                        onChange={handleFilesChange}
                      />
                    </Button>
                    {selectedFiles.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Selected {selectedFiles.length} files:
                        </Typography>
                        <List dense>
                          {selectedFiles.map((file, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={file.name}
                                secondary={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleAlbumDialogClose}>Cancel</Button>
                  <Button 
                    onClick={handleAlbumSubmit} 
                    variant="contained"
                    disabled={!selectedImage || selectedFiles.length === 0}
                  >
                    Create Album
                  </Button>
                </DialogActions>
              </Dialog>
            </TabPanel>
          </Paper>
        </Container>

        {/* Player */}
        {currentTrack && (
          <Paper
            sx={{
              position: 'fixed',
              bottom: 0,
              left: { sm: '240px' },
              right: 0,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              zIndex: 1000,
              bgcolor: 'background.paper',
            }}
          >
            <img
              src={currentTrack.coverImage}
              alt={currentTrack.title}
              style={{ width: 60, height: 60, objectFit: 'cover' }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" color="text.primary">{currentTrack.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentTrack.artist}
              </Typography>
            </Box>
            <IconButton onClick={isPlaying ? handlePause : () => handlePlay(currentTrack)}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <audio
              ref={audioRef}
              src={currentTrack.audioFile}
              onEnded={handleAudioEnded}
              style={{ display: 'none' }}
            />
          </Paper>
        )}
      </Box>

      {/* Track Upload Dialog */}
      <Dialog open={openTrackDialog} onClose={handleTrackDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Track</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Track Title"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Artist Name"
              fullWidth
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload Cover Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {selectedImage && (
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedImage.name}
              </Typography>
            )}
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload Audio File
              <input
                type="file"
                hidden
                accept="audio/*"
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTrackDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Upload Track
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Audio; 