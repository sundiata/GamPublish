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
  LinearProgress,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import trackService, { Track, CreateTrackData } from '../services/trackService';

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
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    loadTracks();
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
      setTracks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracks');
      console.error('Error loading tracks:', err);
    } finally {
      setLoading(false);
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
    setUploadProgress(0);
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
        setUploadProgress(0);
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
              {/* Album content will be implemented later */}
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
            {uploadProgress > 0 && (
              <LinearProgress variant="determinate" value={uploadProgress} />
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