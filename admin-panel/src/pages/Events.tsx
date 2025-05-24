import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  Card,
  CardContent,
  CardMedia,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Chair as ChairIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import { Event, CreateEventData } from '../services/eventService';
import eventService from '../services/eventService';
import { API_URL } from '../services/api';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    date: '',
    location: '',
    image: '',
    price: 0,
    capacity: 0,
    category: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getAllEvents();
      console.log('Events response:', response);
      setEvents(response.events);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: new Date(event.date).toISOString().split('T')[0],
        location: event.location,
        image: event.image,
        price: event.price,
        capacity: event.capacity,
        category: event.category,
      });
      setImagePreview(event.image);
    } else {
      setSelectedEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        image: '',
        price: 0,
        capacity: 0,
        category: '',
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      try {
        await eventService.deleteEvent(selectedEvent._id);
        loadEvents();
        setDeleteDialog(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: name === 'price' || name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (
    event: React.ChangeEvent<{ name?: string; value: string }> | (Event & { target: { value: string; name: string } })
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image;
      
      if (selectedImage) {
        imageUrl = await eventService.uploadEventImage(selectedImage);
      }

      if (selectedEvent) {
        await eventService.updateEvent(selectedEvent._id, {
          ...formData,
          image: imageUrl,
        });
      } else {
        await eventService.createEvent({
          ...formData,
          image: imageUrl,
        });
      }

      handleCloseDialog();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'table' | 'card' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getImageUrl = (image: string) => {
    if (!image) return '/placeholder-event.svg';
    return image.startsWith('http') ? image : `${API_URL.replace('/api', '')}${image}`;
  };

  const handleImageLoad = (eventId: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [eventId]: true
    }));
  };

  const handleImageError = (eventId: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [eventId]: true
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f4f4' }}>
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
        <Topbar title="Events" />
        <Box sx={{ mt: 8, mb: 4, maxWidth: '1200px', pl: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Events
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="table">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="card">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                size="small"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Event
              </Button>
            </Box>
          </Box>

          {filteredEvents.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="textSecondary">No events found</Typography>
            </Box>
          ) : viewMode === 'table' ? (
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <TableContainer>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Seats</TableCell>
                      <TableCell>Thumbnail</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow
                        key={event._id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{event.title}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.capacity}</TableCell>
                        <TableCell>
                          <Box sx={{ position: 'relative', width: '100px', height: '60px' }}>
                            {!imageLoadStates[event._id] && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'grey.100'
                                }}
                              >
                                <CircularProgress size={20} />
                              </Box>
                            )}
                            <img
                              src={getImageUrl(event.image)}
                              alt={event.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: imageLoadStates[event._id] ? 'block' : 'none'
                              }}
                              onLoad={() => handleImageLoad(event._id)}
                              onError={() => handleImageError(event._id)}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(new Date(event.date))}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            color={
                              event.status === 'upcoming'
                                ? 'primary'
                                : event.status === 'ongoing'
                                ? 'success'
                                : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(event)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {filteredEvents.map((event) => (
                <Card key={event._id}>
                  <Box sx={{ position: 'relative', height: '140px' }}>
                    {!imageLoadStates[event._id] && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}
                      >
                        <CircularProgress size={20} />
                      </Box>
                    )}
                    <CardMedia
                      component="img"
                      height="140"
                      image={getImageUrl(event.image)}
                      alt={event.title}
                      sx={{
                        display: imageLoadStates[event._id] ? 'block' : 'none'
                      }}
                      onLoad={() => handleImageLoad(event._id)}
                      onError={() => handleImageError(event._id)}
                    />
                  </Box>
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {event.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <ChairIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {event.capacity} seats
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <EventIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(new Date(event.date))}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(event)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(event)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Add/Edit Event Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? 'Edit Event' : 'Create Event'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleSelectChange(e as React.ChangeEvent<{ name?: string; value: string }>)}
                  required
                >
                  <MenuItem value="Music">Music</MenuItem>
                  <MenuItem value="Sports">Sports</MenuItem>
                  <MenuItem value="Arts">Arts</MenuItem>
                  <MenuItem value="Food">Food</MenuItem>
                  <MenuItem value="Technology">Technology</MenuItem>
                </Select>
              </FormControl>
              <Box>
                <input
                  accept="image/*"
                  type="file"
                  id="event-image"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="event-image">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                  >
                    Upload Image
                  </Button>
                </label>
              </Box>
              {imagePreview && (
                <Box sx={{ position: 'relative', height: '300px' }}>
                  {!imageLoadStates['preview'] && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100'
                      }}
                    >
                      <CircularProgress size={20} />
                    </Box>
                  )}
                  <img
                    src={getImageUrl(imagePreview)}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      display: imageLoadStates['preview'] ? 'block' : 'none'
                    }}
                    onLoad={() => handleImageLoad('preview')}
                    onError={() => handleImageError('preview')}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this event?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events; 