import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';

interface Event {
  id: number;
  name: string;
  location: string;
  seats: number;
  thumbnail: string;
  date: Date;
  description: string;
  seatFormat: 'alphanumeric' | 'numeric';
  status: 'upcoming' | 'past';
}

const initialEvents: Event[] = [
  {
    id: 1,
    name: 'Friday Prayer',
    location: 'Main Mosque',
    seats: 500,
    thumbnail: 'https://via.placeholder.com/300',
    date: new Date('2024-03-22T13:00:00'),
    description: 'Weekly Friday prayer with special khutbah',
    seatFormat: 'alphanumeric',
    status: 'upcoming',
  },
  {
    id: 2,
    name: 'Eid Celebration',
    location: 'Community Center',
    seats: 1000,
    thumbnail: 'https://via.placeholder.com/300',
    date: new Date('2024-04-10T09:00:00'),
    description: 'Annual Eid celebration with activities for all ages',
    seatFormat: 'numeric',
    status: 'upcoming',
  },
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Event>>({
    name: '',
    location: '',
    seats: 0,
    date: new Date(),
    description: '',
    seatFormat: 'numeric',
  });

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setFormData(event);
      setSelectedEvent(event);
      setImagePreview(event.thumbnail);
    } else {
      setFormData({
        name: '',
        location: '',
        seats: 0,
        date: new Date(),
        description: '',
        seatFormat: 'numeric',
      });
      setSelectedEvent(null);
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setImagePreview(null);
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent) {
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setDeleteDialog(false);
      setSelectedEvent(null);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedEvent) {
      // Edit existing event
      setEvents(events.map(e => 
        e.id === selectedEvent.id ? { ...e, ...formData, thumbnail: imagePreview || e.thumbnail } : e
      ));
    } else {
      // Add new event
      const newEvent: Event = {
        ...formData as Event,
        id: Math.max(...events.map(e => e.id)) + 1,
        thumbnail: imagePreview || 'https://via.placeholder.com/300',
        status: new Date(formData.date!) > new Date() ? 'upcoming' : 'past',
      };
      setEvents([...events, newEvent]);
    }
    handleCloseDialog();
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
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

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
                Add Event
              </Button>
            </Box>
          </Box>

          {viewMode === 'table' ? (
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
                        key={event.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.seats}</TableCell>
                        <TableCell>
                          <img
                            src={event.thumbnail}
                            alt={event.name}
                            style={{ width: 50, height: 50, objectFit: 'cover' }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(event.date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.status}
                            color={event.status === 'upcoming' ? 'success' : 'default'}
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
                <Card key={event.id}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={event.thumbnail}
                      alt={event.name}
                    />
                    <Chip
                      label={event.status}
                      color={event.status === 'upcoming' ? 'success' : 'default'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {event.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {event.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <ChairIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {event.seats} seats
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <EventIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(event.date)}
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
          {selectedEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Event Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Location"
              fullWidth
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <TextField
              label="Number of Seats"
              type="number"
              fullWidth
              value={formData.seats}
              onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
            />
            <FormControl fullWidth>
              <InputLabel>Seat Numbering Format</InputLabel>
              <Select
                value={formData.seatFormat}
                label="Seat Numbering Format"
                onChange={(e) => setFormData({ ...formData, seatFormat: e.target.value as 'alphanumeric' | 'numeric' })}
              >
                <MenuItem value="alphanumeric">Alphanumeric (A1, A2, etc.)</MenuItem>
                <MenuItem value="numeric">Numeric (1, 2, etc.)</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Event Date & Time"
                value={formData.date}
                onChange={(newValue: Date | null) => setFormData({ ...formData, date: newValue || new Date() })}
              />
            </LocalizationProvider>
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
              startIcon={<AddIcon />}
            >
              Upload Event Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedEvent ? 'Save Changes' : 'Add Event'}
          </Button>
        </DialogActions>
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